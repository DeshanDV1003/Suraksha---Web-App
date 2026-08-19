/**
 * rainfallWeatherService.ts
 *
 * Fetches live hourly rainfall data from the Open-Meteo API (free, no key required)
 * for each of Sri Lanka's 25 districts, writes results into the existing
 * RainfallReading table, and auto-creates Alerts when thresholds are crossed.
 *
 * This runs as a standalone cron — it does NOT touch any existing cron jobs,
 * routes, or services.
 */

import prisma from '../utils/prisma';
import { WaterRiskLevel } from '../../prisma/generated/client';
import { sendAlertPushToAll, sendAlertPushToRegion } from './notificationService';
import { getIO } from '../utils/socketInstance';

// ── District coordinate map ────────────────────────────────────────────────
export const SL_DISTRICTS: { name: string; province: string; lat: number; lng: number }[] = [
  { name: 'Colombo',       province: 'Western',    lat: 6.9271,  lng: 79.8612 },
  { name: 'Gampaha',       province: 'Western',    lat: 7.0917,  lng: 80.0153 },
  { name: 'Kalutara',      province: 'Western',    lat: 6.5854,  lng: 79.9607 },
  { name: 'Kandy',         province: 'Central',    lat: 7.2906,  lng: 80.6337 },
  { name: 'Matale',        province: 'Central',    lat: 7.4675,  lng: 80.6234 },
  { name: 'Nuwara Eliya',  province: 'Central',    lat: 6.9497,  lng: 80.7891 },
  { name: 'Galle',         province: 'Southern',   lat: 6.0535,  lng: 80.2210 },
  { name: 'Matara',        province: 'Southern',   lat: 5.9549,  lng: 80.5550 },
  { name: 'Hambantota',    province: 'Southern',   lat: 6.1429,  lng: 81.1212 },
  { name: 'Jaffna',        province: 'Northern',   lat: 9.6615,  lng: 80.0255 },
  { name: 'Kilinochchi',   province: 'Northern',   lat: 9.3803,  lng: 80.4037 },
  { name: 'Mannar',        province: 'Northern',   lat: 8.9779,  lng: 79.9040 },
  { name: 'Mullaitivu',    province: 'Northern',   lat: 9.2672,  lng: 80.8137 },
  { name: 'Vavuniya',      province: 'Northern',   lat: 8.7514,  lng: 80.4977 },
  { name: 'Batticaloa',    province: 'Eastern',    lat: 7.7170,  lng: 81.6924 },
  { name: 'Ampara',        province: 'Eastern',    lat: 7.2811,  lng: 81.6723 },
  { name: 'Trincomalee',   province: 'Eastern',    lat: 8.5874,  lng: 81.2152 },
  { name: 'Kurunegala',    province: 'North Western', lat: 7.4867, lng: 80.3647 },
  { name: 'Puttalam',      province: 'North Western', lat: 8.0408, lng: 79.8394 },
  { name: 'Anuradhapura',  province: 'North Central', lat: 8.3114, lng: 80.4037 },
  { name: 'Polonnaruwa',   province: 'North Central', lat: 7.9403, lng: 81.0188 },
  { name: 'Badulla',       province: 'Uva',        lat: 6.9934,  lng: 81.0550 },
  { name: 'Monaragala',    province: 'Uva',        lat: 6.8728,  lng: 81.3506 },
  { name: 'Ratnapura',     province: 'Sabaragamuwa', lat: 6.6828, lng: 80.3992 },
  { name: 'Kegalle',       province: 'Sabaragamuwa', lat: 7.2513, lng: 80.3464 },
];

// ── Risk thresholds (mm / hour) ────────────────────────────────────────────
const THRESHOLDS = {
  WATCH:   2.5,   // light rain
  WARNING: 7.5,   // moderate — regional push
  DANGER:  25.0,  // heavy — push to all + EMERGENCY alert
};

function calcRiskLevel(mmPerHour: number): WaterRiskLevel {
  if (mmPerHour >= THRESHOLDS.DANGER)  return 'DANGER';
  if (mmPerHour >= THRESHOLDS.WARNING) return 'WARNING';
  if (mmPerHour >= THRESHOLDS.WATCH)   return 'WATCH';
  return 'NORMAL';
}

// ── Open-Meteo fetch ───────────────────────────────────────────────────────
interface OpenMeteoResponse {
  hourly: {
    time: string[];
    precipitation: number[];
  };
  daily: {
    time: string[];
    precipitation_sum: number[];
  };
}

async function fetchOpenMeteo(lat: number, lng: number): Promise<{ mmPerHour: number; cumulative24h: number }> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&hourly=precipitation` +
    `&daily=precipitation_sum` +
    `&timezone=Asia%2FColombo` +
    `&forecast_days=1`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);

  const data: OpenMeteoResponse = await res.json();

  // Current hour index (Colombo is UTC+5:30)
  const now = new Date();
  const colomboHour = Math.floor((now.getUTCHours() * 60 + now.getUTCMinutes() + 330) / 60) % 24;
  const idx = Math.min(colomboHour, data.hourly.precipitation.length - 1);

  const mmPerHour = data.hourly.precipitation[idx] ?? 0;
  const cumulative24h = data.daily.precipitation_sum[0] ?? 0;

  return { mmPerHour, cumulative24h };
}

// ── Alert deduplication — DB-backed, survives restarts ────────────────────
const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours

async function maybeCreateAlert(district: string, riskLevel: WaterRiskLevel, mmPerHour: number): Promise<void> {
  const log = await prisma.rainfallAlertLog.findUnique({ where: { district } });
  if (log && Date.now() - log.lastFiredAt.getTime() < COOLDOWN_MS) return;

  if (riskLevel !== 'WARNING' && riskLevel !== 'DANGER') return;

  const isEmergency = riskLevel === 'DANGER';
  const title = isEmergency
    ? `🚨 Heavy Rainfall Alert — ${district}`
    : `🌧️ Rainfall Warning — ${district}`;
  const message = isEmergency
    ? `Rainfall of ${mmPerHour.toFixed(1)} mm/hr recorded in ${district}. High flood risk — evacuate low-lying areas immediately.`
    : `Rainfall of ${mmPerHour.toFixed(1)} mm/hr recorded in ${district}. Moderate flood risk — avoid flood-prone areas.`;
  const alertType = isEmergency ? 'EMERGENCY' : 'WARNING';

  const alert = await prisma.alert.create({
    data: {
      title,
      message,
      type: alertType as any,
      active: true,
      locations: [district],
    },
  });

  await prisma.rainfallAlertLog.upsert({
    where:  { district },
    create: { district, lastFiredAt: new Date() },
    update: { lastFiredAt: new Date() },
  });

  // Push notifications — reuse existing service (same as alertController does)
  const pushTitle = `🌧️ ${alert.title}`;
  const pushBody = message;
  const data = { alertId: alert.id, type: alertType, source: 'rainfall-weather' };

  if (isEmergency) {
    sendAlertPushToAll(pushTitle, pushBody, data).catch(() => {});
  } else {
    sendAlertPushToRegion(pushTitle, pushBody, [district], data).catch(() => {});
  }

  // Broadcast via socket.io so web clients refresh alert list immediately
  const io = getIO();
  io.emit('new-alert', { ...alert, broadcastRadiusKm: 50 });
}

// ── Main export: fetch all districts and persist ───────────────────────────
export async function fetchAndStoreDistrictRainfall(): Promise<void> {
  console.log('[RainfallWeather] Starting district rainfall fetch from Open-Meteo…');
  const fetchedAt = new Date();
  let stored = 0;
  let errors = 0;

  for (const district of SL_DISTRICTS) {
    try {
      const { mmPerHour, cumulative24h } = await fetchOpenMeteo(district.lat, district.lng);
      const riskLevel = calcRiskLevel(mmPerHour);

      await prisma.rainfallReading.create({
        data: {
          stationId:         `OM-${district.name.toUpperCase().replace(/\s/g, '_')}`,
          stationName:       `${district.name} District`,
          district:          district.name,
          province:          district.province,
          latitude:          district.lat,
          longitude:         district.lng,
          rainfallMmPerHour: mmPerHour,
          cumulativeRain24h: cumulative24h,
          cumulativeRain72h: cumulative24h, // Open-Meteo free tier: 1-day only; use same as proxy
          riskLevel,
          recordedAt:        fetchedAt,
          fetchedAt,
          source:            'OPEN_METEO',
        },
      });

      stored++;

      // Auto-alert if threshold crossed
      await maybeCreateAlert(district.name, riskLevel, mmPerHour);

      // Small delay to avoid hammering the API
      await new Promise(r => setTimeout(r, 200));
    } catch (err: any) {
      errors++;
      console.warn(`[RainfallWeather] Failed for ${district.name}:`, err.message);
    }
  }

  console.log(`[RainfallWeather] Done — ${stored} districts stored, ${errors} errors.`);
}

// ── District summary (for API endpoint) ───────────────────────────────────
export async function getLatestDistrictRainfall() {
  const cutoff = new Date(Date.now() - 4 * 60 * 60 * 1000); // last 4 hours
  const readings = await prisma.rainfallReading.findMany({
    where: { source: 'OPEN_METEO', recordedAt: { gte: cutoff } },
    orderBy: { recordedAt: 'desc' },
  });

  // Latest per district
  const seen = new Set<string>();
  return readings.filter(r => {
    if (seen.has(r.district)) return false;
    seen.add(r.district);
    return true;
  });
}
