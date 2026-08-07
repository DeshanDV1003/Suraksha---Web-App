import fs from 'fs';
import path from 'path';
import { WaterRiskLevel, RiverStatus, WaterTrend } from '../../prisma/generated/client';
import prisma from '../utils/prisma';

const CSV_PATH = process.env.WEATHER_CSV_PATH ||
  path.join(__dirname, '../../../../suraksha-ml/synthetic_flood_dataset_real_stations.csv');

// ── CSV parsing ───────────────────────────────────────────────────────────────
interface CsvRow {
  month: number;
  stationName: string;
  rainfall_mm_hr: number;
  rainfall_24h_total: number;
  humidity_pct: number;
  temp_c: number;
  water_level_m: number;
}

function parseWeatherCsv(): CsvRow[] {
  try {
    const raw = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = raw.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const idx = (col: string) => headers.indexOf(col);

    return lines.slice(1).map(line => {
      const cols = line.split(',');
      return {
        month:              parseInt(cols[idx('month')] ?? '1'),
        stationName:        (cols[idx('stationName')] ?? '').trim(),
        rainfall_mm_hr:     parseFloat(cols[idx('rainfall_mm_hr')] ?? '0') || 0,
        rainfall_24h_total: parseFloat(cols[idx('rainfall_24h_total')] ?? '0') || 0,
        humidity_pct:       parseFloat(cols[idx('humidity_pct')] ?? '75') || 75,
        temp_c:             parseFloat(cols[idx('temp_c')] ?? '28') || 28,
        water_level_m:      parseFloat(cols[idx('water_level_m')] ?? '0') || 0,
      };
    }).filter(r => !isNaN(r.rainfall_mm_hr));
  } catch {
    console.warn(`[Simulator] Could not read CSV at ${CSV_PATH} — using pure random fallback.`);
    return [];
  }
}

/**
 * Returns the rows from the CSV that best match a given station name and the
 * current month. Used to seed realistic rainfall/humidity/temp values.
 */
function csvRowsForStation(rows: CsvRow[], stationName: string, month: number): CsvRow[] {
  const name = stationName.toLowerCase();
  const matching = rows.filter(r => r.stationName.toLowerCase().includes(name) && r.month === month);
  return matching.length > 0 ? matching : rows.filter(r => r.month === month);
}

function sampleRandom<T>(arr: T[]): T | undefined {
  return arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : undefined;
}

// ── Main simulation ───────────────────────────────────────────────────────────
export async function simulateDataFetch() {
  console.log('--- Starting Water Data Simulation Fetch ---');

  const csvRows = parseWeatherCsv();
  const currentMonth = new Date().getMonth() + 1;
  const csvAvailable = csvRows.length > 0;
  console.log(csvAvailable
    ? `[Simulator] Loaded ${csvRows.length} CSV rows for weather enrichment.`
    : '[Simulator] No CSV data — using fully random values.');

  // ── Rainfall stations ─────────────────────────────────────────────────────
  const simulatedStations = [
    { id: 'RG-CMB-001', name: 'Colombo Met Station',   district: 'Colombo',   province: 'Western',       lat: 6.9271, lng: 79.8612 },
    { id: 'RG-RTP-001', name: 'Ratnapura Met Station', district: 'Ratnapura', province: 'Sabaragamuwa', lat: 6.6828, lng: 80.3992 },
    { id: 'RG-GAL-001', name: 'Galle Met Station',     district: 'Galle',     province: 'Southern',      lat: 6.0535, lng: 80.2210 },
  ];

  const now = new Date();

  for (const station of simulatedStations) {
    // Try to pull a representative row from the CSV for this station & month
    const csvSample = csvAvailable
      ? sampleRandom(csvRowsForStation(csvRows, station.name, currentMonth))
      : undefined;

    const baseRain       = station.district === 'Ratnapura' ? 10 : 5;
    const currentRain    = csvSample
      ? Math.max(0, csvSample.rainfall_mm_hr + (Math.random() * 4 - 2))   // ±2 jitter on real value
      : Math.max(0, baseRain + (Math.random() * 20 - 5));
    const cumulative24   = csvSample
      ? Math.max(0, csvSample.rainfall_24h_total + (Math.random() * 10 - 5))
      : currentRain * 24 * (Math.random() * 0.5 + 0.5);
    const cumulative72   = cumulative24 + currentRain * 48 * (Math.random() * 0.5 + 0.5);

    let riskLevel: WaterRiskLevel = WaterRiskLevel.NORMAL;
    if (currentRain > 50)      riskLevel = WaterRiskLevel.DANGER;
    else if (currentRain > 25) riskLevel = WaterRiskLevel.WARNING;
    else if (currentRain > 10) riskLevel = WaterRiskLevel.WATCH;

    await prisma.rainfallReading.create({
      data: {
        stationId:          station.id,
        stationName:        station.name,
        district:           station.district,
        province:           station.province,
        latitude:           station.lat,
        longitude:          station.lng,
        rainfallMmPerHour:  currentRain,
        cumulativeRain24h:  cumulative24,
        cumulativeRain72h:  cumulative72,
        riskLevel,
        recordedAt:         now,
        fetchedAt:          now,
        source:             'SIMULATED',
      },
    });
    console.log(`Saved simulated rainfall for ${station.name}: ${currentRain.toFixed(2)} mm/hr (24h: ${cumulative24.toFixed(0)} mm)`);
  }

  // ── River gauges — thresholds from official DMC daily water level reports ────
  // Nagalagam Street is measured in FEET by DMC; converted to metres here (ft × 0.3048).
  // normal = typical dry-season observed level from DMC PDFs (Jul 2026).
  const simulatedRivers = [
    // Kelani Ganga basin
    { id: 'RG-KELANI-NAGALAGAM',      river: 'Kelani Ganga',    name: 'Nagalagam Street',     district: 'Colombo',       lat: 6.9430, lng: 79.8660, normal: 0.50,  alert: 1.22,  minor: 1.52,  major: 2.13  }, // DMC: 4/5/7 ft → m
    { id: 'RG-KELANI-HANWELLA',       river: 'Kelani Ganga',    name: 'Hanwella',             district: 'Colombo',       lat: 6.9090, lng: 80.0810, normal: 1.30,  alert: 7.00,  minor: 8.00,  major: 10.00 },
    { id: 'RG-KELANI-GLENCOURSE',     river: 'Kelani Ganga',    name: 'Glencourse',           district: 'Colombo',       lat: 6.9530, lng: 80.1640, normal: 9.30,  alert: 15.00, minor: 16.50, major: 19.00 },
    { id: 'RG-KELANI-KITHULGALA',     river: 'Kelani Ganga',    name: 'Kithulgala',           district: 'Kegalle',       lat: 6.9906, lng: 80.4122, normal: 1.60,  alert: 3.00,  minor: 4.00,  major: 6.00  },
    { id: 'RG-KELANI-DERANIYAGALA',   river: 'Seethawaka Ganga',name: 'Deraniyagala',         district: 'Kegalle',       lat: 6.9244, lng: 80.3378, normal: 0.70,  alert: 4.80,  minor: 5.80,  major: 6.40  },
    { id: 'RG-KELANI-NORWOOD',        river: 'Kehelgamu Oya',   name: 'Norwood',              district: 'Nuwara Eliya',  lat: 6.8394, lng: 80.6117, normal: 0.53,  alert: 1.50,  minor: 3.00,  major: 4.50  },
    { id: 'RG-MAHA-HOLOMBUWA',        river: 'Gurugoda Oya',    name: 'Holombuwa',            district: 'Kegalle',       lat: 7.1510, lng: 80.2110, normal: 0.50,  alert: 3.00,  minor: 3.40,  major: 5.00  },
    // Kalu Ganga basin
    { id: 'RG-KALU-PUTUPAULA',        river: 'Kalu Ganga',      name: 'Putupaula',            district: 'Ratnapura',     lat: 6.6440, lng: 80.4160, normal: 0.40,  alert: 3.00,  minor: 4.00,  major: 5.00  },
    { id: 'RG-KALU-ELLAGAWA',         river: 'Kalu Ganga',      name: 'Ellagawa',             district: 'Ratnapura',     lat: 6.7440, lng: 80.4700, normal: 4.50,  alert: 10.00, minor: 10.70, major: 12.20 },
    { id: 'RG-KALU-RATHNAPURA',       river: 'Kalu Ganga',      name: 'Rathnapura',           district: 'Ratnapura',     lat: 6.6828, lng: 80.3992, normal: 0.90,  alert: 5.20,  minor: 7.50,  major: 9.50  },
    { id: 'RG-MAGURU-MAGURA',         river: 'Maguru Ganga',    name: 'Magura',               district: 'Ratnapura',     lat: 6.6500, lng: 80.3800, normal: 1.05,  alert: 4.00,  minor: 6.00,  major: 7.50  },
    { id: 'RG-KUDA-KALAWELLAWA',      river: 'Kuda Ganga',      name: 'Kalawellawa (Millakanda)', district: 'Kalutara',  lat: 6.5800, lng: 80.2000, normal: 1.90,  alert: 5.00,  minor: 6.50,  major: 8.00  },
    // Gin Ganga basin
    { id: 'RG-GIN-BADDEGAMA',         river: 'Gin Ganga',       name: 'Baddegama',            district: 'Galle',         lat: 6.1650, lng: 80.1790, normal: 1.38,  alert: 3.50,  minor: 4.00,  major: 5.00  },
    { id: 'RG-GIN-THAWALAMA',         river: 'Gin Ganga',       name: 'Thawalama',            district: 'Galle',         lat: 6.1150, lng: 80.3330, normal: 1.25,  alert: 4.00,  minor: 6.00,  major: 7.50  },
    // Nilwala Ganga basin
    { id: 'RG-NILWALA-THALGAHAGODA',  river: 'Nilwala Ganga',   name: 'Thalgahagoda',         district: 'Matara',        lat: 6.0340, lng: 80.5480, normal: 0.15,  alert: 1.40,  minor: 1.70,  major: 2.80  },
    { id: 'RG-NILWALA-PANADUGAMA',    river: 'Nilwala Ganga',   name: 'Panadugama',           district: 'Matara',        lat: 6.0200, lng: 80.5300, normal: 2.20,  alert: 5.00,  minor: 6.00,  major: 7.50  },
    { id: 'RG-NILWALA-PITABEDDARA',   river: 'Nilwala Ganga',   name: 'Pitabeddara',          district: 'Matara',        lat: 6.2240, lng: 80.5750, normal: 0.40,  alert: 4.00,  minor: 5.00,  major: 6.50  },
    { id: 'RG-URUBOKKA-URAWA',        river: 'Urubokka Ganga',  name: 'Urawa',                district: 'Matara',        lat: 6.1000, lng: 80.6000, normal: 0.01,  alert: 2.50,  minor: 4.00,  major: 6.00  },
    // Walawe Ganga basin
    { id: 'RG-WALAWE-MORAKETIYA',     river: 'Walawe Ganga',    name: 'Moraketiya',           district: 'Hambantota',    lat: 6.2000, lng: 80.8000, normal: 0.78,  alert: 3.00,  minor: 5.00,  major: 7.00  },
    // Kirindi Oya basin
    { id: 'RG-KIRINDI-THANAMALWILA',  river: 'Kirindi Oya',     name: 'Thanamalwila',         district: 'Monaragala',    lat: 6.4330, lng: 81.1330, normal: 0.20,  alert: 4.00,  minor: 5.00,  major: 5.50  },
    { id: 'RG-KIRINDI-WELLAWAYA',     river: 'Kirindi Oya',     name: 'Wellawaya',            district: 'Monaragala',    lat: 6.7300, lng: 81.1000, normal: 0.49,  alert: 4.40,  minor: 5.40,  major: 5.90  },
    { id: 'RG-KUDA-KUDAOYA',          river: 'Kuda Oya',        name: 'Kuda Oya',             district: 'Kalutara',      lat: 6.6000, lng: 80.2500, normal: 1.06,  alert: 6.90,  minor: 8.40,  major: 8.80  },
    // Menik Ganga basin
    { id: 'RG-MENIK-KATHARAGAMA',     river: 'Menik Ganga',     name: 'Katharagama',          district: 'Monaragala',    lat: 6.4100, lng: 81.3300, normal: -0.17, alert: 4.00,  minor: 4.60,  major: 6.50  },
    // Kumbukkan / Heda basins
    { id: 'RG-KUMBUKKAN-NAKKALA',     river: 'Kumbukkan Oya',   name: 'Nakkala',              district: 'Ampara',        lat: 6.6500, lng: 81.5000, normal: 0.54,  alert: 5.00,  minor: 6.00,  major: 7.50  },
    { id: 'RG-HEDA-SIYAMBALANDUWA',   river: 'Heda Oya',        name: 'Siyambalanduwa',       district: 'Ampara',        lat: 7.0500, lng: 81.5500, normal: 0.40,  alert: 4.50,  minor: 6.00,  major: 7.00  },
    // Maduru Oya / Gal Oya basins
    { id: 'RG-GAL-PADIYATHALAWA',     river: 'Maduru Oya',      name: 'Padiyathalawa',        district: 'Ampara',        lat: 7.4000, lng: 81.2000, normal: 0.06,  alert: 4.00,  minor: 4.50,  major: 6.00  },
    // Mahaweli Ganga basin
    { id: 'RG-MAHAWELI-MANAMPITIYA',  river: 'Mahaweli Ganga',  name: 'Manampitiya',          district: 'Polonnaruwa',   lat: 7.9100, lng: 81.1300, normal: -0.05, alert: 3.00,  minor: 4.30,  major: 6.00  },
    { id: 'RG-MAHAWELI-WERAGANTHOTA', river: 'Mahaweli Ganga',  name: 'Weraganthota',         district: 'Kandy',         lat: 7.4500, lng: 80.9000, normal: -3.35, alert: 5.00,  minor: 6.00,  major: 8.00  },
    { id: 'RG-MAHAWELI-PERADENIYA',   river: 'Mahaweli Ganga',  name: 'Peradeniya',           district: 'Kandy',         lat: 7.2690, lng: 80.5960, normal: 1.60,  alert: 5.00,  minor: 7.00,  major: 9.00  },
    { id: 'RG-MAHAWELI-NAWALAPITIYA', river: 'Mahaweli Ganga',  name: 'Nawalapitiya',         district: 'Kandy',         lat: 7.0500, lng: 80.5300, normal: 1.25,  alert: 3.50,  minor: 5.00,  major: 6.00  },
    { id: 'RG-BADULU-THALDENA',       river: 'Badulu Oya',      name: 'Thaldena',             district: 'Badulla',       lat: 7.0000, lng: 81.0000, normal: 0.12,  alert: 3.00,  minor: 4.00,  major: 5.00  },
    // Yan Oya / northern basins
    { id: 'RG-YAN-HOROWPOTHANA',      river: 'Yan Oya',         name: 'Horowpothana',         district: 'Anuradhapura',  lat: 8.4000, lng: 80.7500, normal: 1.30,  alert: 6.00,  minor: 7.50,  major: 10.50 },
    { id: 'RG-MUKUNU-YAKAWEWA',       river: 'Mukunu Oya',      name: 'Yaka Wewa',            district: 'Anuradhapura',  lat: 8.2000, lng: 80.5000, normal: 0.45,  alert: 4.00,  minor: 5.00,  major: 6.00  },
    { id: 'RG-MALWATHU-THANTHIRIMALE',river: 'Malwathu Oya',    name: 'Thanthirimale',        district: 'Anuradhapura',  lat: 8.6000, lng: 80.4000, normal: 1.05,  alert: 5.00,  minor: 6.80,  major: 7.80  },
    // Mee / Deduru / Maha Oya / Attanagalu basins
    { id: 'RG-MEE-GALGAMUWA',         river: 'Mee Oya',         name: 'Galgamuwa',            district: 'Kurunegala',    lat: 7.7500, lng: 80.2000, normal: 0.16,  alert: 4.84,  minor: 5.94,  major: 8.00  },
    { id: 'RG-DEDURU-MORAGASWEWA',    river: 'Deduru Oya',      name: 'Moragaswewa',          district: 'Kurunegala',    lat: 7.6000, lng: 80.3000, normal: 0.06,  alert: 4.75,  minor: 6.00,  major: 7.00  },
    { id: 'RG-MAHA-BADALGAMA',        river: 'Maha Oya',        name: 'Badalgama',            district: 'Gampaha',       lat: 7.1200, lng: 80.0500, normal: 2.12,  alert: 5.00,  minor: 6.20,  major: 9.60  },
    { id: 'RG-MAHA-GIRIULLA',         river: 'Maha Oya',        name: 'Giriulla',             district: 'Kurunegala',    lat: 7.3270, lng: 80.1260, normal: 1.03,  alert: 5.50,  minor: 6.50,  major: 7.50  },
    { id: 'RG-ATTANAGALU-DUNAMALE',   river: 'Attanagalu Oya',  name: 'Dunamale',             district: 'Gampaha',       lat: 7.1000, lng: 80.0000, normal: 1.05,  alert: 3.30,  minor: 4.40,  major: 5.50  },
  ];

  for (const river of simulatedRivers) {
    const lastReading = await prisma.riverWaterLevel.findFirst({
      where:   { gaugeId: river.id },
      orderBy: { recordedAt: 'desc' },
    });

    const lastLevel = lastReading ? lastReading.waterLevelMetres : river.normal;

    // ── Realistic physics-based step ──────────────────────────────────────────
    // Step size is proportional to the station's own operating range so that
    // a high-scale gauge (Glencourse, 9.3–19 m) moves in plausible metres while
    // a low-scale gauge (Nagalagam, 0.5–2.13 m) moves in centimetres.
    const alertRange   = river.alert - river.normal;          // normal → alert gap
    const maxStepUp    = alertRange * 0.12;                   // at most 12% of that gap per hour rising
    const maxStepDown  = alertRange * 0.09;                   // fall a little slower (river drains gradually)

    // Mean reversion: the further above normal, the stronger the pull back.
    // Coefficient 0.10 means 10% of the excess evaporates each hour even without rain.
    const deviation  = lastLevel - river.normal;
    const reversion  = -deviation * 0.10;

    // Random noise scaled to the station's range
    const noise = (Math.random() * 2 - 1) *
                  (lastLevel > river.alert ? maxStepUp * 0.6 : maxStepUp);  // smaller swings when flooded

    const rawChange = reversion + noise;

    // Clamp the per-hour change to prevent teleportation
    const clampedChange = Math.max(-maxStepDown * 1.5, Math.min(maxStepUp * 1.5, rawChange));

    // Hard floor: never below 0 or below (normal − 40% of alertRange)
    // Hard ceiling: never above major × 1.08 (just above the declared limit)
    const hardMin  = Math.max(0, river.normal - alertRange * 0.4);
    const hardMax  = river.major * 1.08;
    const currentLevel = Math.max(hardMin, Math.min(hardMax, lastLevel + clampedChange));

    const change = currentLevel - lastLevel;

    let trend: WaterTrend = WaterTrend.STABLE;
    if (change > alertRange * 0.03)       trend = WaterTrend.RISING;
    else if (change < -alertRange * 0.03) trend = WaterTrend.FALLING;

    let status: RiverStatus = RiverStatus.NORMAL;
    if (currentLevel >= river.major)      status = RiverStatus.MAJOR_FLOOD;
    else if (currentLevel >= river.minor) status = RiverStatus.MINOR_FLOOD;
    else if (currentLevel >= river.alert) status = RiverStatus.ALERT;

    // ── Enrich with CSV weather data for this station & month ──────────────
    const csvSample = csvAvailable
      ? sampleRandom(csvRowsForStation(csvRows, river.name, currentMonth))
      : undefined;

    const flowRateCumecs = currentLevel * 100;

    await prisma.riverWaterLevel.create({
      data: {
        gaugeId:           river.id,
        riverName:         river.river,
        stationName:       river.name,
        district:          river.district,
        latitude:          river.lat,
        longitude:         river.lng,
        waterLevelMetres:  currentLevel,
        flowRateCumecs,
        alertLevel:        river.alert,
        minorFloodLevel:   river.minor,
        majorFloodLevel:   river.major,
        status,
        changeFromLastHour: change,
        trend,
        recordedAt:        now,
        fetchedAt:         now,
        source:            'SIMULATED',
      },
    });

    // Store the per-station weather context in the rainfall table so the ML
    // predictor can join against it without a schema change on RiverWaterLevel.
    if (csvSample) {
      const rainfallMm = Math.max(0, csvSample.rainfall_mm_hr + (Math.random() * 2 - 1));
      const cum24      = Math.max(0, csvSample.rainfall_24h_total + (Math.random() * 5 - 2.5));

      let riskLevel: WaterRiskLevel = WaterRiskLevel.NORMAL;
      if (rainfallMm > 50)      riskLevel = WaterRiskLevel.DANGER;
      else if (rainfallMm > 25) riskLevel = WaterRiskLevel.WARNING;
      else if (rainfallMm > 10) riskLevel = WaterRiskLevel.WATCH;

      await prisma.rainfallReading.create({
        data: {
          stationId:         `${river.id}-RAIN`,
          stationName:       river.name,
          district:          river.district,
          province:          river.district,
          latitude:          river.lat,
          longitude:         river.lng,
          rainfallMmPerHour: rainfallMm,
          cumulativeRain24h: cum24,
          cumulativeRain72h: cum24 * 2.5,
          riskLevel,
          recordedAt:        now,
          fetchedAt:         now,
          source:            'SIMULATED_CSV',
        },
      });
    }
    console.log(`Saved river level for ${river.river} @ ${river.name}: ${currentLevel.toFixed(2)} m [${status}]`);
  }

  console.log('--- Completed Water Data Simulation Fetch ---');

  // Run LSTM predictions after each simulation cycle
  try {
    const { runPredictionsForAllGauges } = await import('./water-predictor');
    await runPredictionsForAllGauges();
  } catch (err) {
    console.warn('[Simulator] Prediction cycle skipped (ML service may be offline):', err);
  }
}
