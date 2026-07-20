import fs from 'fs';
import path from 'path';
import { WaterRiskLevel, RiverStatus, WaterTrend } from '../../prisma/generated/client';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';

// The path to the CSV file should be adjustable, using an environment variable or default relative path
const CSV_PATH = process.env.WEATHER_CSV_PATH || path.join(__dirname, '../../../SriLanka_Weather_Dataset.csv');

export async function simulateDataFetch() {
  console.log('--- Starting Water Data Simulation Fetch ---');
  
  // Read CSV and parse some lines. This is a naive simulation for development.
  // In a real scenario, this would parse the CSV or connect to an API.
  let csvData = '';
  try {
    csvData = fs.readFileSync(CSV_PATH, 'utf-8');
  } catch (err) {
    console.warn(`Could not read CSV file at ${CSV_PATH}. Using fallback simulation data.`);
  }

  // Simulate Rainfall Readings
  const simulatedStations = [
    { id: 'RG-CMB-001', name: 'Colombo Met Station', district: 'Colombo', province: 'Western', lat: 6.9271, lng: 79.8612 },
    { id: 'RG-RTP-001', name: 'Ratnapura Met Station', district: 'Ratnapura', province: 'Sabaragamuwa', lat: 6.6828, lng: 80.3992 },
    { id: 'RG-GAL-001', name: 'Galle Met Station', district: 'Galle', province: 'Southern', lat: 6.0535, lng: 80.2210 }
  ];

  const now = new Date();
  const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const past72h = new Date(now.getTime() - 72 * 60 * 60 * 1000);

  for (const station of simulatedStations) {
    // Generate random rainfall based on some logic (e.g., higher in Ratnapura)
    const baseRain = station.district === 'Ratnapura' ? 10 : 5;
    const currentRain = Math.max(0, baseRain + (Math.random() * 20 - 5)); // mm/hr

    let riskLevel: WaterRiskLevel = WaterRiskLevel.NORMAL;
    if (currentRain > 50) riskLevel = WaterRiskLevel.DANGER;
    else if (currentRain > 25) riskLevel = WaterRiskLevel.WARNING;
    else if (currentRain > 10) riskLevel = WaterRiskLevel.WATCH;

    // Simulate cumulatives (in real life, we sum from the database)
    const cumulative24 = currentRain * 24 * (Math.random() * 0.5 + 0.5);
    const cumulative72 = cumulative24 + currentRain * 48 * (Math.random() * 0.5 + 0.5);

    await prisma.rainfallReading.create({
      data: {
        stationId: station.id,
        stationName: station.name,
        district: station.district,
        province: station.province,
        latitude: station.lat,
        longitude: station.lng,
        rainfallMmPerHour: currentRain,
        cumulativeRain24h: cumulative24,
        cumulativeRain72h: cumulative72,
        riskLevel,
        recordedAt: now,
        fetchedAt: now,
        source: 'SIMULATED'
      }
    });
    console.log(`Saved simulated rainfall for ${station.name}: ${currentRain.toFixed(2)} mm/hr`);
  }

  const simulatedRivers = [
    { id: 'RG-KELANI-NORWOOD', river: 'Kelani Ganga', name: 'Norwood', district: 'Nuwara Eliya', lat: 6.8394, lng: 80.6117, normal: 1.5, alert: 3.5, minor: 5.0, major: 6.5 },
    { id: 'RG-KELANI-KITHULGALA', river: 'Kelani Ganga', name: 'Kithulgala', district: 'Kegalle', lat: 6.9906, lng: 80.4122, normal: 2.0, alert: 4.5, minor: 6.0, major: 8.0 },
    { id: 'RG-KELANI-DERANIYAGALA', river: 'Kelani Ganga', name: 'Deraniyagala', district: 'Kegalle', lat: 6.9244, lng: 80.3378, normal: 2.0, alert: 4.5, minor: 6.0, major: 8.0 },
    { id: 'RG-KELANI-GLENCOURSE', river: 'Kelani Ganga', name: 'Glencourse', district: 'Colombo', lat: 6.9530, lng: 80.1640, normal: 2.0, alert: 4.5, minor: 6.0, major: 8.0 },
    { id: 'RG-KELANI-HANWELLA', river: 'Kelani Ganga', name: 'Hanwella', district: 'Colombo', lat: 6.9090, lng: 80.0810, normal: 2.5, alert: 5.0, minor: 7.0, major: 9.0 },
    { id: 'RG-KELANI-NAGALAGAM', river: 'Kelani Ganga', name: 'Nagalagam Street', district: 'Colombo', lat: 6.9430, lng: 79.8660, normal: 1.0, alert: 3.0, minor: 4.5, major: 6.0 },
    { id: 'RG-KALU-RATNAPURA', river: 'Kalu Ganga', name: 'Ratnapura', district: 'Ratnapura', lat: 6.6828, lng: 80.3992, normal: 2.5, alert: 5.0, minor: 7.0, major: 9.0 },
    { id: 'RG-KALU-MILLAKANDA', river: 'Kalu Ganga', name: 'Millakanda', district: 'Kalutara', lat: 6.5940, lng: 80.1790, normal: 2.0, alert: 4.5, minor: 6.0, major: 8.0 },
    { id: 'RG-KALU-ELLAGAWA', river: 'Kalu Ganga', name: 'Ellagawa', district: 'Ratnapura', lat: 6.7440, lng: 80.4700, normal: 2.0, alert: 4.5, minor: 6.0, major: 8.0 },
    { id: 'RG-KALU-PUTUPAULA', river: 'Kalu Ganga', name: 'Putupaula', district: 'Ratnapura', lat: 6.6440, lng: 80.4160, normal: 2.0, alert: 4.5, minor: 6.0, major: 8.0 },
    { id: 'RG-NILWALA-PITABEDDARA', river: 'Nilwala Ganga', name: 'Pitabeddara', district: 'Matara', lat: 6.2240, lng: 80.5750, normal: 2.0, alert: 4.0, minor: 5.5, major: 7.5 },
    { id: 'RG-NILWALA-THALGAHAGODA', river: 'Nilwala Ganga', name: 'Thalgahagoda', district: 'Matara', lat: 6.0340, lng: 80.5480, normal: 1.5, alert: 3.5, minor: 5.0, major: 6.5 },
    { id: 'RG-GIN-BADDEGAMA', river: 'Gin Ganga', name: 'Baddegama', district: 'Galle', lat: 6.1650, lng: 80.1790, normal: 2.0, alert: 4.0, minor: 5.5, major: 7.0 },
    { id: 'RG-GIN-TAWALAMA', river: 'Gin Ganga', name: 'Tawalama', district: 'Galle', lat: 6.1150, lng: 80.3330, normal: 2.0, alert: 4.0, minor: 5.5, major: 7.0 },
    { id: 'RG-MAHA-HOLOMBUWA', river: 'Maha Oya', name: 'Holombuwa', district: 'Kurunegala', lat: 7.1510, lng: 80.2110, normal: 2.5, alert: 5.0, minor: 6.5, major: 8.5 },
    { id: 'RG-MAHA-GIRIULLA', river: 'Maha Oya', name: 'Giriulla', district: 'Kurunegala', lat: 7.3270, lng: 80.1260, normal: 2.0, alert: 4.5, minor: 6.0, major: 8.0 },
    { id: 'RG-MAHAWELI-PERADENIYA', river: 'Mahaweli Ganga', name: 'Peradeniya', district: 'Kandy', lat: 7.2690, lng: 80.5960, normal: 3.0, alert: 5.5, minor: 7.0, major: 9.0 },
    { id: 'RG-MAHAWELI-MANAMPITIYA', river: 'Mahaweli Ganga', name: 'Manampitiya', district: 'Polonnaruwa', lat: 7.9100, lng: 81.1300, normal: 3.5, alert: 6.0, minor: 7.5, major: 9.5 },
    { id: 'RG-MAHAWELI-WELIKANDA', river: 'Mahaweli Ganga', name: 'Welikanda', district: 'Polonnaruwa', lat: 7.9500, lng: 81.2500, normal: 3.0, alert: 5.5, minor: 7.0, major: 9.0 },
    { id: 'RG-KIRINDI-THANAMALWILA', river: 'Kirindi Oya', name: 'Thanamalwila', district: 'Monaragala', lat: 6.4330, lng: 81.1330, normal: 2.0, alert: 4.0, minor: 5.5, major: 7.5 },
    { id: 'RG-UMA-UVAPARANAGAMA', river: 'Uma Oya', name: 'Uva Paranagama', district: 'Badulla', lat: 6.8600, lng: 80.9300, normal: 1.5, alert: 3.5, minor: 5.0, major: 6.5 },
    { id: 'RG-KALA-DAMBULLA', river: 'Kala Oya', name: 'Dambulla', district: 'Matale', lat: 7.8840, lng: 80.6470, normal: 2.0, alert: 4.0, minor: 5.5, major: 7.5 },
    { id: 'RG-DEDURU-MEDIYAWA', river: 'Deduru Oya', name: 'Mediyawa', district: 'Kurunegala', lat: 7.5200, lng: 80.2500, normal: 2.0, alert: 4.0, minor: 5.5, major: 7.5 },
    { id: 'RG-GAL-PADIYATHALAWA', river: 'Gal Oya', name: 'Padiyathalawa', district: 'Ampara', lat: 7.4000, lng: 81.2000, normal: 2.0, alert: 4.5, minor: 6.0, major: 8.0 },
    { id: 'RG-AMBAN-ANGAMMEDILLA', river: 'Amban Ganga', name: 'Angammedilla', district: 'Polonnaruwa', lat: 7.9160, lng: 80.9600, normal: 2.5, alert: 4.5, minor: 6.0, major: 8.0 },
    { id: 'RG-KALU-RATHNAPURA', river: 'Kalu Ganga', name: 'Rathnapura', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 2.6, alert: 5.2, minor: 7.5, major: 9.5 },
    { id: 'RG-MAGURU-MAGURA', river: 'Maguru Ganga', name: 'Magura', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 2.0, alert: 4.0, minor: 6.0, major: 7.5 },
    { id: 'RG-KUDA-KALAWELLAWA(MILLAKANDA)', river: 'Kuda Ganga', name: 'Kalawellawa (Millakanda)', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 2.5, alert: 5.0, minor: 6.5, major: 8.0 },
    { id: 'RG-GIN-THAWALAMA', river: 'Gin Ganga', name: 'Thawalama', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 2.0, alert: 4.0, minor: 6.0, major: 7.5 },
    { id: 'RG-NILWALA-PANADUGAMA', river: 'Nilwala Ganga', name: 'Panadugama', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 2.5, alert: 5.0, minor: 6.0, major: 7.5 },
    { id: 'RG-URUBOKKA-URAWA', river: 'Urubokka Ganga', name: 'Urawa', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 1.25, alert: 2.5, minor: 4.0, major: 6.0 },
    { id: 'RG-WALAWE-MORAKETIYA', river: 'Walawe Ganga', name: 'Moraketiya', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 1.5, alert: 3.0, minor: 5.0, major: 7.0 },
    { id: 'RG-KIRINDI-WELLAWAYA', river: 'Kirindi Oya', name: 'Wellawaya', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 2.2, alert: 4.4, minor: 5.4, major: 5.9 },
    { id: 'RG-KUDA-KUDAOYA', river: 'Kuda Oya', name: 'Kuda Oya', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 3.45, alert: 6.9, minor: 8.4, major: 8.8 },
    { id: 'RG-MENIK-KATHARAGAMA', river: 'Menik Ganga', name: 'Katharagama', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 2.0, alert: 4.0, minor: 4.6, major: 6.5 },
    { id: 'RG-KUMBUKKAN-NAKKALA', river: 'Kumbukkan Oya', name: 'Nakkala', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 2.5, alert: 5.0, minor: 6.0, major: 7.5 },
    { id: 'RG-HEDA-SIYAMBALANDUWA', river: 'Heda Oya', name: 'Siyambalanduwa', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 2.25, alert: 4.5, minor: 6.0, major: 7.0 },
    { id: 'RG-MAHAWELI-WERAGANTHOTA', river: 'Mahaweli Ganga', name: 'Weraganthota', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 2.5, alert: 5.0, minor: 6.0, major: 8.0 },
    { id: 'RG-MAHAWELI-NAWALAPITIYA', river: 'Mahaweli Ganga', name: 'Nawalapitiya', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 1.75, alert: 3.5, minor: 5.0, major: 6.0 },
    { id: 'RG-BADULU-THALDENA', river: 'Badulu Oya', name: 'Thaldena', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 1.5, alert: 3.0, minor: 4.0, major: 5.0 },
    { id: 'RG-YAN-HOROWPOTHANA', river: 'Yan Oya', name: 'Horowpothana', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 3.0, alert: 6.0, minor: 7.5, major: 10.5 },
    { id: 'RG-MUKUNU-YAKAWEWA', river: 'Mukunu Oya', name: 'Yaka Wewa', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 2.0, alert: 4.0, minor: 5.0, major: 6.0 },
    { id: 'RG-MALWATHU-THANTHIRIMALE', river: 'Malwathu Oya', name: 'Thanthirimale', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 2.5, alert: 5.0, minor: 6.8, major: 7.8 },
    { id: 'RG-MEE-GALGAMUWA', river: 'Mee Oya', name: 'Galgamuwa', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 2.42, alert: 4.84, minor: 5.94, major: 8.0 },
    { id: 'RG-DEDURU-MORAGASWEWA', river: 'Deduru Oya', name: 'Moragaswewa', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 2.375, alert: 4.75, minor: 6.0, major: 7.0 },
    { id: 'RG-MAHA-BADALGAMA', river: 'Maha Oya', name: 'Badalgama', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 2.5, alert: 5.0, minor: 6.2, major: 9.6 },
    { id: 'RG-ATTANAGALU-DUNAMALE', river: 'Attanagalu Oya', name: 'Dunamale', district: 'Unknown', lat: 7.0, lng: 80.0, normal: 1.65, alert: 3.3, minor: 4.4, major: 5.5 }
  ];

  for (const river of simulatedRivers) {
    // Get last reading to calculate trend
    const lastReading = await prisma.riverWaterLevel.findFirst({
      where: { gaugeId: river.id },
      orderBy: { recordedAt: 'desc' }
    });

    const lastLevel = lastReading ? lastReading.waterLevelMetres : river.normal;
    // Fluctuate randomly between -0.2 and +0.5
    const change = (Math.random() * 0.7) - 0.2;
    const currentLevel = Math.max(0, lastLevel + change);

    let trend: WaterTrend = WaterTrend.STABLE;
    if (change > 0.1) trend = WaterTrend.RISING;
    else if (change < -0.1) trend = WaterTrend.FALLING;

    let status: RiverStatus = RiverStatus.NORMAL;
    if (currentLevel >= river.major) status = RiverStatus.MAJOR_FLOOD;
    else if (currentLevel >= river.minor) status = RiverStatus.MINOR_FLOOD;
    else if (currentLevel >= river.alert) status = RiverStatus.ALERT;

    await prisma.riverWaterLevel.create({
      data: {
        gaugeId: river.id,
        riverName: river.river,
        stationName: river.name,
        district: river.district,
        latitude: river.lat,
        longitude: river.lng,
        waterLevelMetres: currentLevel,
        flowRateCumecs: currentLevel * 100, // naive estimate
        alertLevel: river.alert,
        minorFloodLevel: river.minor,
        majorFloodLevel: river.major,
        status,
        changeFromLastHour: change,
        trend,
        recordedAt: now,
        fetchedAt: now,
        source: 'SIMULATED'
      }
    });
    console.log(`Saved simulated river level for ${river.river} at ${river.name}: ${currentLevel.toFixed(2)} m`);
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
