import prisma from '../utils/prisma';

// ── Vehicles ─────────────────────────────────────────────────────────────────

export const createVehicle = (data: {
  type: string; name: string; capacity: number;
  area: string; contactPhone?: string; operatorName?: string; assignedById?: string;
}) => prisma.rescueVehicle.create({ data: data as any });

export const getVehicles = () =>
  prisma.rescueVehicle.findMany({ orderBy: { createdAt: 'desc' } });

export const getVehiclesByArea = (area: string) =>
  prisma.rescueVehicle.findMany({
    where: { area: { contains: area, mode: 'insensitive' }, status: 'AVAILABLE' },
    orderBy: { createdAt: 'desc' },
  });

export const updateVehicleStatus = (id: string, status: string) =>
  prisma.rescueVehicle.update({ where: { id }, data: { status } });

export const deleteVehicle = (id: string) =>
  prisma.rescueVehicle.delete({ where: { id } });

// ── Missions ─────────────────────────────────────────────────────────────────

export const createMission = (data: {
  vehicleId: string; area: string; destinationCampId?: string;
  assignedById: string; notes?: string;
}) =>
  prisma.rescueMission.create({
    data: { ...data, status: 'PENDING' },
    include: {
      vehicle: true,
      assignedBy: { select: { id: true, name: true, role: true } },
    },
  });

export const getMissions = () =>
  prisma.rescueMission.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      vehicle: true,
      assignedBy: { select: { id: true, name: true, role: true } },
      safeZoneCheckIns: { include: { user: { select: { id: true, name: true } } } },
    },
  });

export const getMissionsByArea = (area: string) =>
  prisma.rescueMission.findMany({
    where: {
      area: { contains: area, mode: 'insensitive' },
      status: { not: 'CANCELLED' },
    },
    include: {
      vehicle: true,
      safeZoneCheckIns: true,
    },
    orderBy: { createdAt: 'desc' },
  });

export const updateMissionStatus = async (id: string, status: string, evacuatedCount?: number) => {
  const data: any = { status, updatedAt: new Date() };
  if (status === 'COMPLETED') data.completedAt = new Date();
  if (evacuatedCount !== undefined) data.evacuatedCount = evacuatedCount;

  const mission = await prisma.rescueMission.update({
    where: { id },
    data,
    include: { vehicle: true },
  });

  // Free up the vehicle when mission is done or cancelled
  if (status === 'COMPLETED' || status === 'CANCELLED') {
    await prisma.rescueVehicle.update({
      where: { id: mission.vehicleId },
      data: { status: 'AVAILABLE' },
    });
  }
  // Mark vehicle ON_MISSION when started
  if (status === 'IN_PROGRESS') {
    await prisma.rescueVehicle.update({
      where: { id: mission.vehicleId },
      data: { status: 'ON_MISSION' },
    });
  }

  return mission;
};

// ── Safe Zone Check-In (citizen marks themselves safe) ────────────────────────

export const markSafeZone = (userId: string, missionId?: string, campId?: string, notes?: string) =>
  prisma.safeZoneCheckIn.create({
    data: { userId, missionId: missionId || null, campId: campId || null, notes: notes || null },
    include: { user: { select: { id: true, name: true } } },
  });

export const getSafeZoneCheckIns = () =>
  prisma.safeZoneCheckIn.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true, region: true } } },
  });

export const getUserSafeZoneStatus = (userId: string) =>
  prisma.safeZoneCheckIn.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
