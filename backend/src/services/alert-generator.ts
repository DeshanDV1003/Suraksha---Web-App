import { WaterRiskLevel, RiverStatus } from '../../prisma/generated/client';
import prisma from '../utils/prisma';

export async function evaluateThresholdsAndAlerts() {
  console.log('--- Evaluating Thresholds and Generating Alerts ---');

  // Evaluate Rainfall
  const recentRainfalls = await prisma.rainfallReading.findMany({
    where: {
      recordedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    }
  });

  for (const reading of recentRainfalls) {
    if (reading.rainfallMmPerHour > 50 || reading.cumulativeRain24h > 150) {
      console.log(`[ALERT SUGGESTION] CRITICAL FLOOD ALERT for ${reading.district} District due to severe rainfall at ${reading.stationName}.`);
      // Here we would insert an alert suggestion to the database
    } else if (reading.rainfallMmPerHour > 25 && reading.cumulativeRain24h > 75) {
      console.log(`[ALERT SUGGESTION] FLOOD WARNING for ${reading.district} District due to heavy rainfall at ${reading.stationName}.`);
    }
  }

  // Evaluate River Levels
  const recentRivers = await prisma.riverWaterLevel.findMany({
    where: {
      recordedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }
    }
  });

  for (const river of recentRivers) {
    // Find mapping for target districts
    const mapping = await prisma.downstreamMapping.findUnique({
      where: { gaugeId: river.gaugeId }
    });

    const targetDistricts = mapping ? mapping.targetDistricts.join(', ') : river.district;

    if (river.status === RiverStatus.MAJOR_FLOOD) {
      console.log(`[ALERT SUGGESTION] CRITICAL EMERGENCY for districts: ${targetDistricts}. ${river.riverName} at ${river.stationName} has reached Major Flood Level.`);
    } else if (river.status === RiverStatus.MINOR_FLOOD) {
      console.log(`[ALERT SUGGESTION] FLOOD WARNING for districts: ${targetDistricts}. ${river.riverName} at ${river.stationName} has reached Minor Flood Level.`);
    } else if (river.status === RiverStatus.ALERT) {
      console.log(`[ALERT SUGGESTION] WATCH ALERT for districts: ${targetDistricts}. ${river.riverName} at ${river.stationName} has reached Alert Level.`);
    }

    if (river.changeFromLastHour > 0.5) {
      console.log(`[ALERT SUGGESTION] RAPID RISE WARNING for ${targetDistricts}. ${river.riverName} is rising rapidly.`);
    }
  }

  console.log('--- Completed Evaluation ---');
}
