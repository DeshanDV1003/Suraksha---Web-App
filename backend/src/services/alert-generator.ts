import { RiverStatus, AlertType } from '../../prisma/generated/client';
import prisma from '../utils/prisma';
import { getIO } from '../utils/socketInstance';

async function createAndEmitAlert(title: string, message: string, type: AlertType, districts: string[]) {
    try {
        const alert = await prisma.alert.create({
            data: { title, message, type, active: true, locations: districts },
        });

        const io = getIO();
        io.emit('new-alert', { ...alert, source: 'water-monitor' });

        console.log(`[AlertGenerator] Created & emitted ${type} alert: ${title}`);
        return alert;
    } catch (err) {
        console.error('[AlertGenerator] Failed to create alert:', err);
    }
}

// Prevent re-sending the same alert every hour — key expires after 3h
const sentAlertKeys = new Set<string>();
function throttle(key: string, ttlMs = 3 * 60 * 60 * 1000): boolean {
    if (sentAlertKeys.has(key)) return false;
    sentAlertKeys.add(key);
    setTimeout(() => sentAlertKeys.delete(key), ttlMs);
    return true;
}

export async function evaluateThresholdsAndAlerts() {
    console.log('--- Evaluating Water Thresholds and Generating Alerts ---');

    // ── Rainfall ──────────────────────────────────────────────────────
    const recentRainfalls = await prisma.rainfallReading.findMany({
        where: { recordedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    });

    for (const reading of recentRainfalls) {
        const { district } = reading;

        if (reading.rainfallMmPerHour > 50 || reading.cumulativeRain24h > 150) {
            if (throttle(`rain-critical-${district}`)) {
                await createAndEmitAlert(
                    `🚨 Critical Flood Alert — ${district}`,
                    `Severe rainfall at ${reading.stationName}: ${reading.rainfallMmPerHour.toFixed(1)} mm/hr. 24h total: ${reading.cumulativeRain24h.toFixed(0)} mm. Immediate flood risk — move to higher ground.`,
                    AlertType.EMERGENCY,
                    [district],
                );
            }
        } else if (reading.rainfallMmPerHour > 25 && reading.cumulativeRain24h > 75) {
            if (throttle(`rain-warning-${district}`)) {
                await createAndEmitAlert(
                    `⚠️ Flood Warning — ${district}`,
                    `Heavy rainfall at ${reading.stationName}: ${reading.rainfallMmPerHour.toFixed(1)} mm/hr. 24h total: ${reading.cumulativeRain24h.toFixed(0)} mm. Avoid low-lying areas.`,
                    AlertType.WARNING,
                    [district],
                );
            }
        }
    }

    // ── River levels ──────────────────────────────────────────────────
    const recentRivers = await prisma.riverWaterLevel.findMany({
        where: { recordedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    });

    for (const river of recentRivers) {
        const mapping = await prisma.downstreamMapping.findUnique({ where: { gaugeId: river.gaugeId } });
        const targetDistricts: string[] = mapping ? mapping.targetDistricts : [river.district];
        const label = targetDistricts.join(', ');

        if (river.status === RiverStatus.MAJOR_FLOOD) {
            if (throttle(`river-major-${river.gaugeId}`)) {
                await createAndEmitAlert(
                    `🚨 Major Flood Emergency — ${label}`,
                    `${river.riverName} at ${river.stationName} has reached MAJOR FLOOD level (${river.waterLevelMetres.toFixed(2)} m). Evacuate immediately. Affected: ${label}.`,
                    AlertType.EMERGENCY,
                    targetDistricts,
                );
            }
        } else if (river.status === RiverStatus.MINOR_FLOOD) {
            if (throttle(`river-minor-${river.gaugeId}`)) {
                await createAndEmitAlert(
                    `⚠️ Flood Warning — ${label}`,
                    `${river.riverName} at ${river.stationName} has reached Minor Flood level (${river.waterLevelMetres.toFixed(2)} m). Stay away from riverbanks. Affected: ${label}.`,
                    AlertType.WARNING,
                    targetDistricts,
                );
            }
        } else if (river.status === RiverStatus.ALERT) {
            if (throttle(`river-alert-${river.gaugeId}`)) {
                await createAndEmitAlert(
                    `🔔 River Watch — ${label}`,
                    `${river.riverName} at ${river.stationName} is at ALERT level (${river.waterLevelMetres.toFixed(2)} m). Monitor updates. Affected: ${label}.`,
                    AlertType.WARNING,
                    targetDistricts,
                );
            }
        }

        if (river.changeFromLastHour > 0.5) {
            if (throttle(`river-rapid-${river.gaugeId}`, 2 * 60 * 60 * 1000)) {
                await createAndEmitAlert(
                    `⚡ Rapid Rise Warning — ${label}`,
                    `${river.riverName} is rising rapidly (+${river.changeFromLastHour.toFixed(2)} m in 1 hour). Immediate flood risk in ${label}.`,
                    AlertType.WARNING,
                    targetDistricts,
                );
            }
        }
    }

    console.log('--- Completed Water Threshold Evaluation ---');
}
