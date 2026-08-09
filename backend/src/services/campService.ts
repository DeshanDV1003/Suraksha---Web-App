import prisma from '../utils/prisma';
import { InventoryItemType, Severity, ReferralStatus } from '../../prisma/generated/client';

export const getAllCamps = async () => {
  return prisma.reliefCamp.findMany({
    orderBy: { currentOccupancy: 'desc' },
    include: {
      inventory: true,
      schedules: true,
      referrals: true,
      residents: { where: { status: 'ACTIVE' } }
    }
  });
};

export const getCampById = async (id: string) => {
  return prisma.reliefCamp.findUnique({
    where: { id },
    include: {
      inventory: true,
      schedules: true,
      referrals: true,
      residents: { where: { status: 'ACTIVE' } },
      transfersOut: true,
      transfersIn: true
    }
  });
};

export const createCamp = async (data: any) => {
  return prisma.reliefCamp.create({ data });
};

export const updateCampOccupancy = async (id: string, occupancy: number) => {
  const camp = await prisma.reliefCamp.update({
    where: { id },
    data: { currentOccupancy: occupancy }
  });

  // Surge Alert Logic
  let surgeAlert = null;
  const occupancyRate = camp.currentOccupancy / camp.totalCapacity;
  
  if (occupancyRate >= 0.8) {
    // Find nearest/available camps (for simplicity, find camps with < 60% occupancy)
    const availableCamps = await prisma.reliefCamp.findMany({
      where: {
        id: { not: camp.id }
      }
    });

    const suggestions = availableCamps.filter(c => (c.currentOccupancy / c.totalCapacity) < 0.6).map(c => ({
      id: c.id,
      name: c.name,
      availableSpace: c.totalCapacity - c.currentOccupancy
    }));

    surgeAlert = {
      isSurge: true,
      message: `Camp is at ${Math.round(occupancyRate * 100)}% capacity.`,
      suggestions
    };
  }

  return { camp, surgeAlert };
};

// --- Residents (Digital Roll) ---
export const getCampResidents = async (campId: string) => {
  return prisma.campResident.findMany({ where: { campId } });
};

export const addCampResident = async (campId: string, data: { name: string, nic?: string, familySize?: number }) => {
  const resident = await prisma.campResident.create({
    data: {
      campId,
      name: data.name,
      nic: data.nic,
      familySize: data.familySize || 1
    }
  });

  // Check against missing persons (exact name OR exact NIC)
  let isMissingPersonMatch = false;
  
  const missingPersons = await prisma.missingPerson.findMany({
    where: { status: 'MISSING' }
  });

  for (const mp of missingPersons) {
    if (mp.name.toLowerCase() === data.name.toLowerCase() || (data.nic && mp.nic === data.nic)) {
      isMissingPersonMatch = true;
      // Auto-update missing person status or create an alert
      await prisma.missingPerson.update({
        where: { id: mp.id },
        data: { status: 'FOUND_AT_CAMP', description: mp.description + `\nFound at camp ID: ${campId}` }
      });
      break;
    }
  }

  // Update occupancy
  const camp = await prisma.reliefCamp.findUnique({ where: { id: campId } });
  if (camp) {
    await prisma.reliefCamp.update({
      where: { id: campId },
      data: { currentOccupancy: camp.currentOccupancy + resident.familySize }
    });
  }

  return { resident, isMissingPersonMatch };
};

export const checkoutResident = async (residentId: string) => {
  const resident = await prisma.campResident.update({
    where: { id: residentId },
    data: { status: 'CHECKED_OUT', checkOutTime: new Date() }
  });

  const camp = await prisma.reliefCamp.findUnique({ where: { id: resident.campId } });
  if (camp) {
    await prisma.reliefCamp.update({
      where: { id: resident.campId },
      data: { currentOccupancy: Math.max(0, camp.currentOccupancy - resident.familySize) }
    });
  }

  return resident;
};

// --- Inventory ---
export const getCampInventory = async (campId: string) => {
  return prisma.campInventory.findMany({ where: { campId } });
};

export const updateCampInventory = async (campId: string, itemType: InventoryItemType, quantity: number, threshold?: number) => {
  const existing = await prisma.campInventory.findFirst({
    where: { campId, itemType }
  });

  if (existing) {
    return prisma.campInventory.update({
      where: { id: existing.id },
      data: { quantity, threshold: threshold ?? existing.threshold, lastUpdated: new Date() }
    });
  } else {
    return prisma.campInventory.create({
      data: { campId, itemType, quantity, threshold: threshold || 100 }
    });
  }
};

// --- Schedule ---
export const getCampSchedule = async (campId: string) => {
  return prisma.campSchedule.findMany({ where: { campId } });
};

export const addCampSchedule = async (campId: string, data: any) => {
  return prisma.campSchedule.create({
    data: {
      campId,
      ...data
    }
  });
};

export const deleteCampSchedule = async (scheduleId: string) => {
  return prisma.campSchedule.delete({ where: { id: scheduleId } });
};

// --- Referrals ---
export const getCampReferrals = async (campId: string) => {
  return prisma.hospitalReferral.findMany({ where: { campId } });
};

export const createHospitalReferral = async (campId: string, data: any) => {
  return prisma.hospitalReferral.create({
    data: {
      campId,
      ...data
    }
  });
};

export const updateReferralStatus = async (referralId: string, status: ReferralStatus) => {
  return prisma.hospitalReferral.update({
    where: { id: referralId },
    data: { status }
  });
};

// --- Transfers ---
export const createTransferRequest = async (fromCampId: string, toCampId: string, peopleCount: number) => {
  return prisma.campTransferRequest.create({
    data: {
      fromCampId,
      toCampId,
      peopleCount,
      status: 'PENDING'
    }
  });
};

export const getAllTransferRequests = async () => {
  return prisma.campTransferRequest.findMany({
    include: {
      fromCamp: { select: { id: true, name: true, location: true, currentOccupancy: true, totalCapacity: true } },
      toCamp:   { select: { id: true, name: true, location: true, currentOccupancy: true, totalCapacity: true } },
    },
    orderBy: { requestDate: 'desc' },
  });
};

// Haversine distance in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export const getTransferSuggestions = async () => {
  const camps = await prisma.reliefCamp.findMany();
  const fullCamps = camps.filter(c => c.status === 'FULL' || c.currentOccupancy >= c.totalCapacity);
  const availableCamps = camps.filter(c => c.status !== 'FULL' && c.currentOccupancy < c.totalCapacity && c.latitude && c.longitude);

  return fullCamps.map(fc => {
    const available = fc.latitude && fc.longitude
      ? availableCamps
          .map(ac => ({
            ...ac,
            distanceKm: haversineKm(fc.latitude!, fc.longitude!, ac.latitude!, ac.longitude!),
            freeCapacity: ac.totalCapacity - ac.currentOccupancy,
          }))
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, 3)
      : availableCamps.slice(0, 3).map(ac => ({ ...ac, distanceKm: null, freeCapacity: ac.totalCapacity - ac.currentOccupancy }));

    return { fullCamp: fc, suggestions: available };
  });
};

export const updateTransferRequestStatus = async (requestId: string, status: string) => {
  const req = await prisma.campTransferRequest.update({
    where: { id: requestId },
    data: { status }
  });

  if (status === 'APPROVED') {
    // We don't auto-checkout residents here for simplicity, but we update occupancy counts
    const fromCamp = await prisma.reliefCamp.findUnique({ where: { id: req.fromCampId }});
    const toCamp = await prisma.reliefCamp.findUnique({ where: { id: req.toCampId }});
    
    if (fromCamp && toCamp) {
      await prisma.reliefCamp.update({
        where: { id: fromCamp.id },
        data: { currentOccupancy: Math.max(0, fromCamp.currentOccupancy - req.peopleCount) }
      });
      await prisma.reliefCamp.update({
        where: { id: toCamp.id },
        data: { currentOccupancy: toCamp.currentOccupancy + req.peopleCount }
      });
    }
  }

  return req;
};
