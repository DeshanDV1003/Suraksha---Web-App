/**
 * alert-generator.ts
 *
 * Alerts are ONLY sent by the ML prediction pipeline (water-predictor.ts).
 * This file now contains only the shared helper used by that pipeline
 * and the broadcast alert service.
 *
 * Removed: all simulator-based threshold triggers (rapid rise, rainfall
 * thresholds, river status thresholds). Those were firing based on
 * simulated/synthetic data which is not acceptable in the Sri Lankan
 * disaster management context. Real alerts must come from ML predictions
 * that combine water level + rainfall + humidity + temperature.
 */

import { AlertType } from '../../prisma/generated/client';
import prisma from '../utils/prisma';
import { getIO } from '../utils/socketInstance';
import { sendExpoPush } from './notificationService';
import { sendSMS, sendWhatsApp, sendAlertEmail } from './channelDeliveryService';

/**
 * Creates a persisted alert, notifies affected users via all channels,
 * and emits a socket event. Called exclusively by the ML predictor and
 * the admin broadcast endpoint.
 */
export async function createAndEmitAlert(
    title: string,
    message: string,
    type: AlertType,
    districts: string[],
    source: 'ml-water-predictor' | 'admin-broadcast' = 'ml-water-predictor',
) {
    try {
        const alert = await prisma.alert.create({
            data: { title, message, type, active: true, locations: districts },
        });

        const usersToNotify = await prisma.user.findMany({
            where: { region: { in: districts } },
            select: { id: true, phone: true, email: true },
        });

        if (usersToNotify.length > 0) {
            const userIds = usersToNotify.map(u => u.id);
            const phones  = usersToNotify.map(u => u.phone).filter((p): p is string => !!p);
            const emails  = usersToNotify.map(u => u.email).filter((e): e is string => !!e);

            await prisma.notification.createMany({
                data: userIds.map(id => ({
                    userId: id, alertId: alert.id, title, message, read: false,
                })),
            });

            await Promise.all([
                sendExpoPush(userIds, title, message, { alertId: alert.id, type }),
                sendSMS(phones, title, message),
                sendWhatsApp(phones, title, message),
                sendAlertEmail(emails, title, message, districts),
            ]);

            await prisma.alert.update({
                where: { id: alert.id },
                data:  { notifiedCount: usersToNotify.length },
            });
        }

        const io = getIO();
        io.emit('new-alert', { ...alert, source });

        console.log(`[AlertGenerator] ${source} alert created: "${title}" → ${districts.join(', ')} (${usersToNotify.length} users notified)`);
        return alert;
    } catch (err) {
        console.error('[AlertGenerator] Failed to create alert:', err);
    }
}

/**
 * DB-backed dedup: returns true (allow) only if no alert with the same
 * title exists within the last ttlMs milliseconds.
 */
export async function throttle(title: string, ttlMs = 3 * 60 * 60 * 1000): Promise<boolean> {
    const since    = new Date(Date.now() - ttlMs);
    const existing = await prisma.alert.findFirst({
        where: { title, createdAt: { gte: since } },
        select: { id: true },
    });
    return existing === null;
}

/**
 * evaluateThresholdsAndAlerts — intentionally disabled.
 *
 * All automated flood alerting is now handled exclusively by
 * runPredictionsForAllGauges() in water-predictor.ts, which requires
 * ML confidence ≥ 75% combining water level + rainfall + humidity + temperature
 * before any alert is sent.
 */
export async function evaluateThresholdsAndAlerts(): Promise<void> {
    console.log('[AlertGenerator] Threshold evaluation skipped — ML-only alert mode active.');
}
