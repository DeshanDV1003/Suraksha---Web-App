import { Router } from 'express';
import prisma from '../utils/prisma';
import { getPrediction, checkMLServiceOnline } from '../services/water-predictor';
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
router.get('/predictions', async (_req, res) => {
  try {
    // Get distinct gauges
    const gauges = await prisma.riverWaterLevel.findMany({
      distinct: ['gaugeId'],
      orderBy:  { recordedAt: 'desc' },
      take:     50,
    });

    const predictions = await Promise.allSettled(
      gauges.map(async g => {
        const thresholds = {
          watch_m:    g.alertLevel,
          warning_m:  g.minorFloodLevel,
          critical_m: g.majorFloodLevel,
        };
        const pred = await getPrediction(g.gaugeId, thresholds);
        return {
          gaugeId:        g.gaugeId,
          riverName:      g.riverName,
          stationName:    g.stationName,
          district:       g.district,
          currentLevelM:  g.waterLevelMetres,
          trend:          g.trend,
          changeFromLast: g.changeFromLastHour,
          alertLevel:     g.status,
          watchThreshold: g.alertLevel,
          prediction:     pred,
        };
      })
    );

    const results = predictions
      .filter(p => p.status === 'fulfilled')
      .map((p: any) => p.value);

    res.json(results);
  } catch (err) {
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
    const prediction = await getPrediction(gaugeId, thresholds);

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
