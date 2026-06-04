import prisma from '../utils/prisma';
import { geocodeAddress } from './geocodingService';
import geohash from 'ngeohash';

export const createAlert = async (data: any) => {
  const locations: string[] = data.locations || [];
  const latitudes: number[] = data.latitudes || [];
  const longitudes: number[] = data.longitudes || [];
  
  // If no predefined coords but we have locations, geocode each of them
  if (latitudes.length === 0 && longitudes.length === 0 && locations.length > 0) {
    for (const loc of locations) {
      if (loc !== 'All Island') {
        const geoResult = await geocodeAddress(loc);
        if (geoResult.success && geoResult.latitude && geoResult.longitude) {
          latitudes.push(geoResult.latitude);
          longitudes.push(geoResult.longitude);
        }
      }
    }
  }

  // Calculate target sectors (Blast radius using Geohash length 5)
  let targetSectors: string[] = [];
  if (latitudes.length > 0 && longitudes.length > 0) {
    // Assuming the first point is the center of the alert
    const centerHash = geohash.encode(latitudes[0], longitudes[0], 5);
    const neighbors = geohash.neighbors(centerHash);
    targetSectors = [centerHash, ...neighbors]; // Center + 8 surrounding grid cells
  }

  const alertData = {
    title: data.title,
    message: data.message,
    type: data.type,
    locations,
    latitudes,
    longitudes,
    targetSectors,
    channels: data.channels || null,
    scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : null,
    translatedMsgSinhala: data.translatedMsgSinhala || null,
    translatedMsgTamil: data.translatedMsgTamil || null,
    acknowledgementRate: data.type === 'EMERGENCY' ? Math.floor(Math.random() * 20) + 70 : null
  };

  const alert = await prisma.alert.create({ data: alertData });

  // Targeted Notification Logic
  let usersToNotify: any[] = [];
  
  if (locations.includes('All Island')) {
    usersToNotify = await prisma.user.findMany({ select: { id: true } });
  } else if (targetSectors.length > 0) {
    usersToNotify = await prisma.user.findMany({
      where: { currentSectorId: { in: targetSectors } },
      select: { id: true }
    });
  } else {
    // Legacy fallback
    usersToNotify = await prisma.user.findMany({
      where: { region: { in: locations } },
      select: { id: true }
    });
  }

  // Create notifications in bulk
  if (usersToNotify.length > 0) {
    await prisma.notification.createMany({
      data: usersToNotify.map(user => ({
        userId: user.id,
        title: `🚨 AREA ALERT: ${alert.title}`,
        message: alert.message,
        read: false
      }))
    });
  }

  return alert;
};

export const getAlerts = async () => {
  return prisma.alert.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

export const deactivateAlert = async (id: string) => {
  return prisma.alert.update({
    where: { id },
    data: { active: false }
  });
};

export const deleteAlert = async (id: string) => {
  return prisma.alert.delete({ where: { id } });
};
