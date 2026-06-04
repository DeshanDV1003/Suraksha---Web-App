import prisma from '../utils/prisma';
import geohash from 'ngeohash';

export const saveLocationLog = async (userId: string, latitude: number, longitude: number) => {
  // 1. Save the location log
  const log = await prisma.locationLog.create({
    data: {
      userId,
      latitude,
      longitude
    }
  });

  // 2. Calculate the Sector ID (Geohash length 5)
  const sectorId = geohash.encode(latitude, longitude, 5);

  // 3. Upsert the Sector just in case it doesn't exist (e.g., outside the seeded bounding box)
  await prisma.sector.upsert({
    where: { id: sectorId },
    update: {},
    create: {
      id: sectorId,
      name: `Grid-${sectorId}`,
      type: 'GRID'
    }
  });

  // 4. Update the user's current sector
  await prisma.user.update({
    where: { id: userId },
    data: { currentSectorId: sectorId }
  });

  return log;
};

export const getLatestUserLocation = async (userId: string) => {
  return prisma.locationLog.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
};
