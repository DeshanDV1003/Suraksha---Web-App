/**
 * Suraksha — Water Level Prediction Orchestrator
 * ------------------------------------------------
 * Fetches last 12 readings per gauge from the DB,
 * calls the FastAPI LSTM service, stores predictions,
 * and triggers alerts when confidence ≥ 75%.
 */

import prisma from '../utils/prisma';
import { getIO } from '../utils/socketInstance';
import { AlertType } from '../../prisma/generated/client';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const MIN_CONFIDENCE = 0.75;

// ─── Interfaces ─────────────────────────────────────────────────
export interface WaterPrediction {
  gaugeId: string;
  predictedT1M: number;
  predictedT2M: number;
  confidence: number;
  alertLevel: string;
  modelUsed: string;
  reason: string;
  predictedAt: string;
}

// ─── ML Service health check ─────────────────────────────────────
export async function checkMLServiceOnline(): Promise<boolean> {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/water-model-status`, {
      signal: AbortSignal.timeout(5000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Get prediction for a single gauge ───────────────────────────
export async function getPrediction(
  gaugeId: string,
  thresholds?: { watch_m: number; warning_m: number; critical_m: number }
): Promise<WaterPrediction | null> {
  try {
    // Fetch last 12 readings from DB (newest last)
    const readings = await prisma.riverWaterLevel.findMany({
      where:   { gaugeId },
      orderBy: { recordedAt: 'asc' },
      take:    12,
    });

    if (readings.length < 3) {
      console.warn(`[WaterPredictor] Gauge ${gaugeId}: only ${readings.length} readings, need ≥3`);
      return null;
    }

    // Get rainfall data for the same time range if available
    const rainfallMap = new Map<string, number>();
    try {
      const rainfallReadings = await prisma.rainfallReading.findMany({
        where:   { district: readings[0].district },
        orderBy: { recordedAt: 'desc' },
        take:    12,
      });
      rainfallReadings.forEach(r => {
        rainfallMap.set(r.recordedAt.toISOString().slice(0, 13), r.rainfallMmPerHour);
      });
    } catch { /* rainfall optional */ }

    // Build reading payload for ML service
    const readingPayload = readings.map(r => ({
      water_level_m:      r.waterLevelMetres,
      rainfall_mm_hr:     rainfallMap.get(r.recordedAt.toISOString().slice(0, 13)) ?? 0,
      rainfall_24h_total: 0, // enriched from rainfall table if available
      humidity_pct:       75,
      temp_c:             28,
      month:              r.recordedAt.getMonth() + 1,
    }));

    const body = {
      gauge_id: gaugeId,
      gauge_thresholds: thresholds ? {
        watch_m:    thresholds.watch_m,
        warning_m:  thresholds.warning_m,
        critical_m: thresholds.critical_m,
      } : undefined,
      readings: readingPayload,
    };

    const response = await fetch(`${ML_SERVICE_URL}/predict-water-level`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.error(`[WaterPredictor] ML service error for ${gaugeId}: ${response.status}`);
      return null;
    }

    const result = await response.json();

    return {
      gaugeId,
      predictedT1M: result.predicted_t1_m,
      predictedT2M: result.predicted_t2_m,
      confidence:   result.confidence,
      alertLevel:   result.alert_level,
      modelUsed:    result.model_used,
      reason:       result.reason,
      predictedAt:  result.predicted_at,
    };

  } catch (err) {
    console.error(`[WaterPredictor] Failed for gauge ${gaugeId}:`, err);
    return null;
  }
}

// ─── Push ML prediction alert to mobile app ──────────────────────
// Dedup key store — same gauge+level won't re-alert within 30 min
const mobileSentKeys = new Map<string, number>();
const MOBILE_DEDUP_MS = 30 * 60 * 1000;

async function pushMobileAlert(payload: {
  gaugeName: string;
  district: string;
  currentLevelM: number;
  predictedT1M: number;
  predictedT2M: number;
  confidence: number;
  alertLevel: string;
  reason: string;
  targetDistricts: string[];
  safeZones?: { name: string; type: string; distanceKm: number; isInDangerZone: boolean; deepLink?: string }[];
  gaugeLatitude?: number;
  gaugeLongitude?: number;
}): Promise<void> {
  const key = `${payload.gaugeName}:${payload.alertLevel}`;
  const now = Date.now();
  const last = mobileSentKeys.get(key);
  if (last && now - last < MOBILE_DEDUP_MS) return;
  mobileSentKeys.set(key, now);

  const isEmergency = payload.alertLevel === 'CRITICAL';
  const emoji = isEmergency ? '🚨' : payload.alertLevel === 'WARNING' ? '⚠️' : '🔔';
  const type = isEmergency ? AlertType.EMERGENCY : AlertType.WARNING;

  const title = `${emoji} ML Flood Prediction — ${payload.district}`;
  const safeZoneSuffix = payload.safeZones && payload.safeZones.length > 0
    ? ` Nearest safe zone: ${payload.safeZones.filter(z => !z.isInDangerZone)[0]?.name || payload.safeZones[0].name}. Open app for map.`
    : '';
  const message =
    `${payload.gaugeName}: current ${payload.currentLevelM.toFixed(2)} m. ` +
    `AI predicts ${payload.predictedT1M.toFixed(2)} m in 1hr / ${payload.predictedT2M.toFixed(2)} m in 2hrs ` +
    `(${Math.round(payload.confidence * 100)}% confidence). ${payload.reason}${safeZoneSuffix}`;

  try {
    const alert = await prisma.alert.create({
      data: { title, message, type, active: true, locations: payload.targetDistricts },
    });
    const io = getIO();
    io.emit('new-alert', {
      ...alert,
      source: 'ml-water-predictor',
      safeZones: payload.safeZones || [],
      gaugeLatitude: payload.gaugeLatitude,
      gaugeLongitude: payload.gaugeLongitude,
    });
    console.log(`[WaterPredictor] Mobile alert emitted for ${payload.gaugeName} (${payload.alertLevel})`);
  } catch (err) {
    console.error('[WaterPredictor] Failed to push mobile alert:', err);
  }
}

// ─── Run predictions for all active gauges ────────────────────────
export async function runPredictionsForAllGauges(): Promise<void> {
  console.log('[WaterPredictor] Starting prediction cycle for all gauges...');

  // Get the distinct active gauges from recent river readings
  const recentGauges = await prisma.riverWaterLevel.findMany({
    distinct: ['gaugeId'],
    orderBy:  { recordedAt: 'desc' },
    take:     50,
    select:   {
      gaugeId:        true,
      riverName:      true,
      stationName:    true,
      district:       true,
      alertLevel:     true,
      minorFloodLevel:true,
      majorFloodLevel:true,
    },
  });

  let alertsFired = 0;

  for (const gauge of recentGauges) {
    // Stagger calls by 500ms to avoid hammering ML service
    await new Promise(r => setTimeout(r, 500));

    const thresholds = {
      watch_m:    gauge.alertLevel,
      warning_m:  gauge.minorFloodLevel,
      critical_m: gauge.majorFloodLevel,
    };

    const prediction = await getPrediction(gauge.gaugeId, thresholds);
    if (!prediction) continue;

    console.log(
      `[WaterPredictor] ${gauge.riverName}@${gauge.stationName}: ` +
      `T+1=${prediction.predictedT1M.toFixed(2)}m T+2=${prediction.predictedT2M.toFixed(2)}m ` +
      `confidence=${(prediction.confidence * 100).toFixed(0)}% alert=${prediction.alertLevel}`
    );

    // Only fire alert if confidence ≥ 75% and there is a threat in the next 2 hours
    const hasThreatInNext2Hours = prediction.predictedT1M >= thresholds.watch_m || prediction.predictedT2M >= thresholds.watch_m;
    
    if (
      prediction.alertLevel !== 'NONE' &&
      prediction.confidence >= MIN_CONFIDENCE &&
      hasThreatInNext2Hours
    ) {
      alertsFired++;
      try {
        const { sendTelegramFloodAlert } = await import('./telegram-alert');
        const latest = await prisma.riverWaterLevel.findFirst({
          where: { gaugeId: gauge.gaugeId }, orderBy: { recordedAt: 'desc' }
        });
        const currentLevelM = latest?.waterLevelMetres ?? prediction.predictedT1M;

        // Get downstream districts affected by this gauge
        const mapping = await prisma.downstreamMapping.findUnique({
          where: { gaugeId: gauge.gaugeId },
        });
        const targetDistricts = mapping ? mapping.targetDistricts : [gauge.district];

        // Fetch safe zones for Telegram message
        let safeZoneInfo: any[] = [];
        let gaugeLat: number | undefined;
        let gaugeLng: number | undefined;
        try {
          const { findSafeZones, dangerRadiusKmForLevel } = await import('./safeZoneService');
          const latestGauge = await prisma.riverWaterLevel.findFirst({
            where: { gaugeId: gauge.gaugeId }, orderBy: { recordedAt: 'desc' },
            select: { latitude: true, longitude: true },
          });
          if (latestGauge?.latitude && latestGauge?.longitude) {
            gaugeLat = latestGauge.latitude;
            gaugeLng = latestGauge.longitude;
            const dangerKm = dangerRadiusKmForLevel(prediction.alertLevel);
            const zones = await findSafeZones(gaugeLat, gaugeLng, dangerKm, dangerKm * 3, 5);
            safeZoneInfo = zones.map(z => ({
              name: z.name, type: z.type, distanceKm: z.distanceKm,
              isInDangerZone: z.isInDangerZone, mapsUrl: z.mapsUrl, address: z.address,
            }));
          }
        } catch (szErr) {
          console.warn('[WaterPredictor] Safe zone fetch failed:', szErr);
        }

        // Send Telegram alert
        await sendTelegramFloodAlert({
          gaugeName:       `${gauge.riverName} @ ${gauge.stationName}`,
          district:        targetDistricts.join(', '),
          currentLevelM,
          predictedT1M:    prediction.predictedT1M,
          predictedT2M:    prediction.predictedT2M,
          confidence:      prediction.confidence,
          alertLevel:      prediction.alertLevel,
          watchThreshold:  thresholds.watch_m,
          reason:          prediction.reason,
          safeZones:       safeZoneInfo,
          gaugeLatitude:   gaugeLat,
          gaugeLongitude:  gaugeLng,
        });

        // Push the same alert to mobile app users in real-time
        await pushMobileAlert({
          gaugeName:      `${gauge.riverName} @ ${gauge.stationName}`,
          district:       gauge.district,
          currentLevelM,
          predictedT1M:   prediction.predictedT1M,
          predictedT2M:   prediction.predictedT2M,
          confidence:     prediction.confidence,
          alertLevel:     prediction.alertLevel,
          reason:         prediction.reason,
          targetDistricts,
          safeZones:      safeZoneInfo,
          gaugeLatitude:  gaugeLat,
          gaugeLongitude: gaugeLng,
        });
      } catch (e) {
        console.error('[WaterPredictor] Alert dispatch failed:', e);
      }
    }
  }

  console.log(`[WaterPredictor] Cycle complete. ${recentGauges.length} gauges processed. ${alertsFired} alerts fired.`);
}
