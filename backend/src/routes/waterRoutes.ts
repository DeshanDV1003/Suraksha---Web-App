import { Router } from 'express';
import prisma from '../utils/prisma';
import { getPrediction, checkMLServiceOnline, savePrediction, refreshPredictions, PREDICTION_STALE_MS } from '../services/water-predictor';
import { createAndEmitAlert } from '../services/alert-generator';
import { getIO } from '../utils/socketInstance';
import { sendTelegramTestMessage } from '../services/telegram-alert';

const router = Router();

// Get recent rainfall data
router.get('/rainfall', async (req, res) => {
  try {
    const recent = await prisma.rainfallReading.findMany({
      take: 100,
      orderBy: { recordedAt: 'desc' }
    });
    res.json(recent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rainfall data' });
  }
});

// Get recent river data (latest reading per gauge)
router.get('/river', async (req, res) => {
  try {
    const recent = await prisma.riverWaterLevel.findMany({
      take: 100,
      orderBy: { recordedAt: 'desc' }
    });
    res.json(recent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch river data' });
  }
});

// ─── PREDICTIONS: all gauges ──────────────────────────────────────
// Served from the WaterLevelPrediction cache table (refreshed hourly by the
// prediction cycle). Gauges with no cached row are computed inline (bounded);
// gauges whose row is stale are returned as-is and refreshed in the background.
// The assembled payload is also held in-process for a short TTL — the underlying
// data only changes hourly, so this keeps the endpoint flat under load.
let predictionsResponseCache: { body: any[]; expires: number } | null = null;
let predictionsInFlight: Promise<any[]> | null = null;
const PREDICTIONS_RESPONSE_TTL_MS = 60_000;

async function buildPredictionsPayload(): Promise<any[]> {
    const gauges = await prisma.riverWaterLevel.findMany({
      distinct: ['gaugeId'],
      orderBy:  { recordedAt: 'desc' },
      take:     50,
    });
    const gaugeIds = gauges.map(g => g.gaugeId);

    const cachedRows = await prisma.waterLevelPrediction.findMany({
      where: { gaugeId: { in: gaugeIds } },
    });
    const cache = new Map(cachedRows.map(r => [r.gaugeId, r]));
    const now = Date.now();

    const toPredObj = (c: (typeof cachedRows)[number]) => ({
      gaugeId:      c.gaugeId,
      predictedT1M: c.predictedT1M,
      predictedT2M: c.predictedT2M,
      confidence:   c.confidence,
      alertLevel:   c.alertLevel,
      modelUsed:    c.modelUsed,
      reason:       c.reason,
      predictedAt:  c.predictedAt.toISOString(),
    });

    const missing: typeof gauges = [];
    const stale:   typeof gauges = [];
    for (const g of gauges) {
      const c = cache.get(g.gaugeId);
      if (!c) missing.push(g);
      else if (now - c.computedAt.getTime() > PREDICTION_STALE_MS) stale.push(g);
    }

    // No cached row at all → compute now so the response still carries real data.
    if (missing.length > 0) {
      await Promise.allSettled(missing.map(async g => {
        const pred = await getPrediction(g.gaugeId, {
          watch_m: g.alertLevel, warning_m: g.minorFloodLevel, critical_m: g.majorFloodLevel,
        });
        if (pred) {
          await savePrediction(pred);
          cache.set(g.gaugeId, {
            id: '', gaugeId: g.gaugeId, predictedT1M: pred.predictedT1M, predictedT2M: pred.predictedT2M,
            confidence: pred.confidence, alertLevel: pred.alertLevel, modelUsed: pred.modelUsed,
            reason: pred.reason, predictedAt: new Date(pred.predictedAt),
            computedAt: new Date(), updatedAt: new Date(),
          } as any);
        }
      }));
    }

    // Stale rows are returned immediately; refresh happens off the request path.
    if (stale.length > 0) {
      void refreshPredictions(stale.map(g => ({
        gaugeId: g.gaugeId, alertLevel: g.alertLevel,
        minorFloodLevel: g.minorFloodLevel, majorFloodLevel: g.majorFloodLevel,
      })));
    }

    const results = gauges.map(g => {
      const c = cache.get(g.gaugeId);
      return {
        gaugeId:          g.gaugeId,
        riverName:        g.riverName,
        stationName:      g.stationName,
        district:         g.district,
        currentLevelM:    g.waterLevelMetres,
        trend:            g.trend,
        changeFromLast:   g.changeFromLastHour,
        alertLevel:       g.status,
        watchThreshold:   g.alertLevel,
        minorFloodLevel:  g.minorFloodLevel,
        majorFloodLevel:  g.majorFloodLevel,
        prediction:       c ? toPredObj(c) : null,
        predictionStale:  c ? (now - c.computedAt.getTime() > PREDICTION_STALE_MS) : false,
      };
    });

    predictionsResponseCache = { body: results, expires: Date.now() + PREDICTIONS_RESPONSE_TTL_MS };
    return results;
}

router.get('/predictions', async (_req, res) => {
  try {
    if (predictionsResponseCache && Date.now() < predictionsResponseCache.expires) {
      return res.json(predictionsResponseCache.body);
    }
    // Collapse a concurrent burst of cache-misses onto one build.
    if (!predictionsInFlight) {
      predictionsInFlight = buildPredictionsPayload().finally(() => { predictionsInFlight = null; });
    }
    const body = await predictionsInFlight;
    res.json(body);
  } catch (err) {
    console.error('[water/predictions] error:', err);
    res.status(500).json({ error: 'Failed to get predictions' });
  }
});

// ─── PREDICTIONS: single gauge with 12hr history ─────────────────
router.get('/predictions/:gaugeId', async (req, res) => {
  try {
    const { gaugeId } = req.params;
    const latest = await prisma.riverWaterLevel.findFirst({
      where:   { gaugeId },
      orderBy: { recordedAt: 'desc' },
    });
    if (!latest) return res.status(404).json({ error: 'Gauge not found' });

    const history = await prisma.riverWaterLevel.findMany({
      where:   { gaugeId },
      orderBy: { recordedAt: 'asc' },
      take:    24,
    });

    const thresholds = {
      watch_m:    latest.alertLevel,
      warning_m:  latest.minorFloodLevel,
      critical_m: latest.majorFloodLevel,
    };

    // Serve a fresh cached prediction if we have one; otherwise compute live and cache it.
    const cached = await prisma.waterLevelPrediction.findUnique({ where: { gaugeId } });
    let prediction: any = null;
    if (cached && Date.now() - cached.computedAt.getTime() <= PREDICTION_STALE_MS) {
      prediction = {
        gaugeId: cached.gaugeId, predictedT1M: cached.predictedT1M, predictedT2M: cached.predictedT2M,
        confidence: cached.confidence, alertLevel: cached.alertLevel, modelUsed: cached.modelUsed,
        reason: cached.reason, predictedAt: cached.predictedAt.toISOString(),
      };
    } else {
      prediction = await getPrediction(gaugeId, thresholds);
      if (prediction) await savePrediction(prediction);
      else if (cached) prediction = {
        gaugeId: cached.gaugeId, predictedT1M: cached.predictedT1M, predictedT2M: cached.predictedT2M,
        confidence: cached.confidence, alertLevel: cached.alertLevel, modelUsed: cached.modelUsed,
        reason: cached.reason, predictedAt: cached.predictedAt.toISOString(),
      };
    }

    res.json({ latest, history, prediction });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get gauge prediction' });
  }
});

// ─── MANUAL TRIGGER: admin can force a prediction cycle ───────────
router.post('/trigger-prediction', async (req, res) => {
  try {
    const { gaugeId } = req.body;
    if (gaugeId) {
      const gauge = await prisma.riverWaterLevel.findFirst({
        where: { gaugeId }, orderBy: { recordedAt: 'desc' }
      });
      if (!gauge) return res.status(404).json({ error: 'Gauge not found' });
      const thresholds = {
        watch_m:    gauge.alertLevel,
        warning_m:  gauge.minorFloodLevel,
        critical_m: gauge.majorFloodLevel,
      };
      const prediction = await getPrediction(gaugeId, thresholds);
      res.json({ gaugeId, prediction });
    } else {
      const { runPredictionsForAllGauges } = await import('../services/water-predictor');
      await runPredictionsForAllGauges();
      res.json({ message: 'Prediction cycle triggered for all gauges' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Trigger failed' });
  }
});

// ─── ML SERVICE STATUS ────────────────────────────────────────────
router.get('/ml-status', async (_req, res) => {
  try {
    const ML_URL  = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    const online  = await checkMLServiceOnline();
    let modelInfo = {};
    if (online) {
      const r = await fetch(`${ML_URL}/water-model-status`);
      modelInfo = await r.json();
    }
    res.json({ online, ...modelInfo });
  } catch {
    res.json({ online: false });
  }
});

// ─── TELEGRAM TEST ────────────────────────────────────────────────
router.post('/telegram-test', async (_req, res) => {
  const ok = await sendTelegramTestMessage();
  res.json({ success: ok, message: ok ? 'Test message sent to Telegram' : 'Failed — check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env' });
});

// ─── DEMO ALERT (presentation use only) ──────────────────────────
// Picks a real gauge from the DB, injects a flood-level reading,
// fires the full alert pipeline (DB → notifications → socket → push),
// then emits water_data_updated so the dashboard refreshes live.
router.post('/demo-alert', async (req, res) => {
  try {
    const { gaugeId } = req.body as { gaugeId?: string };

    // 1. Find the target gauge (use provided gaugeId or pick the first available)
    const gauge = await prisma.riverWaterLevel.findFirst({
      where: gaugeId ? { gaugeId } : undefined,
      orderBy: { recordedAt: 'desc' },
    });
    if (!gauge) return res.status(404).json({ error: 'No gauges found in database. Run the simulator first.' });

    // 2. Set demo level = minorFloodLevel + 0.5 m (clearly above every threshold)
    const demoLevel = parseFloat((gauge.minorFloodLevel + 0.5).toFixed(2));
    const prevLevel = gauge.waterLevelMetres;
    const rise      = parseFloat((demoLevel - prevLevel).toFixed(2));

    // 3. Insert a new high-level reading for this gauge (keeps full audit trail)
    await prisma.riverWaterLevel.create({
      data: {
        gaugeId:           gauge.gaugeId,
        riverName:         gauge.riverName,
        stationName:       gauge.stationName,
        district:          gauge.district,
        latitude:          gauge.latitude,
        longitude:         gauge.longitude,
        waterLevelMetres:  demoLevel,
        flowRateCumecs:    gauge.flowRateCumecs * 1.8,
        alertLevel:        gauge.alertLevel,
        minorFloodLevel:   gauge.minorFloodLevel,
        majorFloodLevel:   gauge.majorFloodLevel,
        status:            'MINOR_FLOOD',
        changeFromLastHour: rise,
        trend:             'RISING',
        recordedAt:        new Date(),
        fetchedAt:         new Date(),
        source:            'DEMO',
      },
    });

    // 4. Fire the full alert pipeline — same function the ML predictor uses
    const title   = `🚨 Flood Alert — ${gauge.riverName} @ ${gauge.stationName}`;
    const message = `Water level has risen to ${demoLevel} m (Minor Flood threshold: ${gauge.minorFloodLevel} m). ` +
                    `Rise of ${rise > 0 ? '+' : ''}${rise} m in the last hour. Residents in ${gauge.district} district should move to higher ground.`;

    const alert = await createAndEmitAlert(title, message, 'EMERGENCY', [gauge.district], 'ml-water-predictor');

    // 5. Tell all dashboards to refresh their water level data
    const io = getIO();
    io.of('/water').emit('water_data_updated', { timestamp: new Date().toISOString() });
    io.emit('water_data_updated', { timestamp: new Date().toISOString() });

    res.json({
      success:    true,
      gauge:      `${gauge.riverName} @ ${gauge.stationName}`,
      district:   gauge.district,
      prevLevel,
      demoLevel,
      alertId:    alert?.id,
      message:    `Demo alert fired. Dashboard and mobile apps will refresh automatically.`,
    });
  } catch (err) {
    console.error('[Demo] Alert failed:', err);
    res.status(500).json({ error: 'Demo alert failed', detail: String(err) });
  }
});

// Get mappings
router.get('/downstream-mapping', async (req, res) => {
  try {
    const mappings = await prisma.downstreamMapping.findMany();
    res.json(mappings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mappings' });
  }
});

// Create/Update mapping
router.post('/downstream-mapping', async (req, res) => {
  const { gaugeId, riverName, stationName, targetDistricts } = req.body;
  try {
    const mapping = await prisma.downstreamMapping.upsert({
      where: { gaugeId },
      update: { riverName, stationName, targetDistricts },
      create: { gaugeId, riverName, stationName, targetDistricts }
    });
    res.json(mapping);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update mapping' });
  }
});

export default router;
