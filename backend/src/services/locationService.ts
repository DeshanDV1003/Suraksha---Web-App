import prisma from '../utils/prisma';

export const saveLocationLog = async (userId: string, latitude: number, longitude: number) => {
  return prisma.locationLog.create({
    data: {
      userId,
      latitude,
      longitude
    }
  });
};

export const getLatestUserLocation = async (userId: string) => {
  return prisma.locationLog.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
};
