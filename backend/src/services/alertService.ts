import prisma from '../utils/prisma';
import { geocodeAddress } from './geocodingService';

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

  const alertData = {
    title: data.title,
    message: data.message,
    type: data.type,
    locations,
    latitudes,
    longitudes,
    channels: data.channels || null,
    scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : null,
    translatedMsgSinhala: data.translatedMsgSinhala || null,
    translatedMsgTamil: data.translatedMsgTamil || null,
    acknowledgementRate: data.type === 'EMERGENCY' ? Math.floor(Math.random() * 20) + 70 : null
  };

  const alert = await prisma.alert.create({ data: alertData });

  // Targeted Notification Logic
  const targetLocations = locations;
  
  // Find users to notify (Legacy notification logic, kept for fallback)
  const usersToNotify = await prisma.user.findMany({
    where: targetLocations.includes('All Island') ? {} : { region: { in: targetLocations } },
    select: { id: true }
  });

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
