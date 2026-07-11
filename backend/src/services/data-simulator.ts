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

  // Simulate River Gauges
  const simulatedRivers = [
    { id: 'RG-KELANI-HANWELLA', river: 'Kelani River', name: 'Hanwella', district: 'Colombo', lat: 6.9, lng: 80.0, normal: 1.2, alert: 4.0, minor: 5.5, major: 7.0 },
    { id: 'RG-KALU-PUTUPAULA', river: 'Kalu River', name: 'Putupaula', district: 'Kalutara', lat: 6.5, lng: 80.1, normal: 2.1, alert: 5.5, minor: 7.0, major: 9.0 },
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
}
