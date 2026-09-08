import cron from 'node-cron';
import prisma from '../utils/prisma';
import { dispatchAlert } from './alertService';
import { sendAlertPushToAll, sendAlertPushToRegion, notifyAdmins } from './notificationService';

/**
 * Every minute: find alerts whose scheduledTime has arrived but which were never
 * dispatched, and deliver them (in-app + channels + push + live socket).
 */
export function setupScheduledAlertCron(getIO: () => any): void {
  console.log('[ScheduledAlerts] Cron registered — checks every minute.');

  cron.schedule('* * * * *', async () => {
    let due;
    try {
      due = await prisma.alert.findMany({
        where: {
          scheduledTime: { not: null, lte: new Date() },
          dispatchedAt: null,
        },
      });
    } catch (err) {
      console.error('[ScheduledAlerts] query failed:', err);
      return;
    }
    if (due.length === 0) return;

    for (const alert of due) {
      try {
        const dispatched = await dispatchAlert(alert.id);

        const io = getIO?.();
        if (io) {
          io.emit('new-alert', { ...dispatched, broadcastRadiusKm: dispatched.broadcastRadiusKm ?? 50 });
        }

        const pushTitle = `🚨 ${dispatched.title}`;
        const pushBody = `${dispatched.message}${dispatched.locations?.length ? ` — ${dispatched.locations[0]}` : ''}`;
        const payload = { alertId: dispatched.id, type: dispatched.type };
        if (dispatched.type === 'EMERGENCY') {
          sendAlertPushToAll(pushTitle, pushBody, payload).catch(() => {});
        } else if (['WARNING', 'FLOOD', 'EVACUATION'].includes(dispatched.type as string)) {
          sendAlertPushToRegion(pushTitle, pushBody, dispatched.locations, payload).catch(() => {});
        } else {
          notifyAdmins(pushTitle, pushBody).catch(() => {});
        }

        console.log(`[ScheduledAlerts] Dispatched "${dispatched.title}" → ${dispatched.notifiedCount} users`);
      } catch (err) {
        console.error(`[ScheduledAlerts] failed to dispatch ${alert.id}:`, err);
      }
    }
  });
}
