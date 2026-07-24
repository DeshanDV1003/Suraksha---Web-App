import prisma from '../utils/prisma';
import { geocodeAddress } from './geocodingService';
import geohash from 'ngeohash';

export const createAlert = async (data: any) => {
  const locations: string[] = data.locations || [];
  const latitudes: number[] = data.latitudes || [];
  const longitudes: number[] = data.longitudes || [];
  const broadcastRadiusKm: number | null = data.broadcastRadiusKm ?? null;

  // Geocode any named locations that don't yet have coordinates
  if (latitudes.length === 0 && longitudes.length === 0 && locations.length > 0) {
    for (const loc of locations) {
      if (loc !== 'All Island') {
        const geo = await geocodeAddress(loc);
        if (geo.success && geo.latitude && geo.longitude) {
          latitudes.push(geo.latitude);
          longitudes.push(geo.longitude);
        }
      }
    }
  }

  // Compute geohash sectors (center + 8 neighbours) for real-time socket room targeting
  let targetSectors: string[] = [];
  if (latitudes.length > 0 && longitudes.length > 0) {
    const centerHash = geohash.encode(latitudes[0], longitudes[0], 5);
    targetSectors = [centerHash, ...geohash.neighbors(centerHash)];
  }

  // Create the alert record first (without notifiedCount — we fill it after)
  const alert = await prisma.alert.create({
    data: {
      title: data.title,
      message: data.message,
      type: data.type,
      locations,
      latitudes,
      longitudes,
      targetSectors,
      broadcastRadiusKm,
      channels: data.channels || null,
      scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : null,
      translatedMsgSinhala: data.translatedMsgSinhala || null,
      translatedMsgTamil: data.translatedMsgTamil || null,
      // acknowledgementRate is now computed from real reads — no random values
      acknowledgementRate: null,
      notifiedCount: 0,
    },
  });

  // ── Determine which users to notify ─────────────────────────────────────────
  // Priority 1: All Island
  // Priority 2: Users whose currentSectorId falls in geohash grid  (mobile users with live GPS)
  // Priority 3: Users whose registered region matches selected locations (always populated)
  // Both P2 and P3 are combined so we never miss anyone.
  let usersToNotify: { id: string }[] = [];

  if (locations.includes('All Island')) {
    usersToNotify = await prisma.user.findMany({ select: { id: true } });
  } else {
    const conditions: any[] = [];

    // Live GPS sector match
    if (targetSectors.length > 0) {
      conditions.push({ currentSectorId: { in: targetSectors } });
    }

    // Registered-region match (always works — every user has region set at signup)
    if (locations.length > 0) {
      conditions.push({ region: { in: locations } });
    }

    if (conditions.length > 0) {
      usersToNotify = await prisma.user.findMany({
        where: { OR: conditions },
        select: { id: true },
      });
    }
  }

  // ── Create in-app notifications linked to this alert ────────────────────────
  const notifiedCount = usersToNotify.length;

  if (notifiedCount > 0) {
    await prisma.notification.createMany({
      data: usersToNotify.map(u => ({
        userId: u.id,
        alertId: alert.id,       // ← real link so we can count reads later
        title: `🚨 AREA ALERT: ${alert.title}`,
        message: alert.message,
        read: false,
      })),
    });
  }

  // Store the real notifiedCount on the alert
  const updated = await prisma.alert.update({
    where: { id: alert.id },
    data: { notifiedCount },
  });

  return updated;
};

export const getAlerts = async () => {
  return prisma.alert.findMany({ orderBy: { createdAt: 'desc' } });
};

// Real delivery stats: notified vs acknowledged (read)
export const getAlertDeliveryStats = async (alertId: string) => {
  const [notifiedCount, acknowledgedCount] = await Promise.all([
    prisma.notification.count({ where: { alertId } }),
    prisma.notification.count({ where: { alertId, read: true } }),
  ]);

  const rate = notifiedCount > 0 ? Math.round((acknowledgedCount / notifiedCount) * 100) : 0;

  return { notifiedCount, acknowledgedCount, acknowledgementRate: rate };
};

// Called when a user taps "Acknowledge" on the popup — marks their notification read
export const acknowledgeAlert = async (alertId: string, userId: string) => {
  const notification = await prisma.notification.findFirst({
    where: { alertId, userId },
  });

  if (!notification) return null;

  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: { read: true, readAt: new Date() },
  });

  // Recompute and persist the live acknowledgement rate on the alert
  const [notifiedCount, acknowledgedCount] = await Promise.all([
    prisma.notification.count({ where: { alertId } }),
    prisma.notification.count({ where: { alertId, read: true } }),
  ]);

  const rate = notifiedCount > 0 ? Math.round((acknowledgedCount / notifiedCount) * 100) : 0;

  await prisma.alert.update({
    where: { id: alertId },
    data: { acknowledgementRate: rate },
  });

  return updated;
};

export const deactivateAlert = async (id: string) => {
  return prisma.alert.update({ where: { id }, data: { active: false } });
};

export const deleteAlert = async (id: string) => {
  return prisma.alert.delete({ where: { id } });
};
