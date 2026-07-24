import prisma from '../utils/prisma';

// Haversine distance
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

export const ensureProfileExists = async (userId: string) => {
  let profile = await prisma.volunteerProfile.findUnique({ where: { userId } });
  if (!profile) {
    profile = await prisma.volunteerProfile.create({ data: { userId } });
  }
  return profile;
};

export const evaluateGamification = async (volunteerId: string) => {
  const profile = await prisma.volunteerProfile.findUnique({
    where: { id: volunteerId },
    include: { badges: true, trainings: true }
  });
  if (!profile) return;

  const existingBadges = profile.badges.map(b => b.badgeType);
  const newBadges = [];

  if (profile.totalHours >= 50 && !existingBadges.includes('50_HOURS')) {
    newBadges.push('50_HOURS');
  }
  if (profile.incidentsJoined >= 3 && !existingBadges.includes('3_INCIDENTS')) {
    newBadges.push('3_INCIDENTS');
  }
  if (profile.trainings.length > 0 && !existingBadges.includes('CERTIFIED')) {
    newBadges.push('CERTIFIED');
  }

  for (const badge of newBadges) {
    await prisma.volunteerBadge.create({
      data: { volunteerId, badgeType: badge }
    });
  }
};

export const getVolunteerProfile = async (userId: string) => {
  const profile = await ensureProfileExists(userId);
  await evaluateGamification(profile.id);
  
  return prisma.volunteerProfile.findUnique({
    where: { userId },
    include: { 
      user: { select: { name: true, email: true, phone: true } },
      skills: true,
      trainings: true,
      checkIns: { orderBy: { checkInTime: 'desc' }, take: 10 },
      wellbeingLogs: { orderBy: { recordedAt: 'desc' }, take: 5 },
      badges: true
    }
  });
};

export const addSkill = async (userId: string, data: { skillName: string, certificationUrl?: string }) => {
  const profile = await ensureProfileExists(userId);
  return prisma.volunteerSkill.create({
    data: { volunteerId: profile.id, ...data }
  });
};

export const addTraining = async (userId: string, data: { trainingName: string, completedAt: string, expiresAt?: string }) => {
  const profile = await ensureProfileExists(userId);
  return prisma.volunteerTraining.create({
    data: { 
      volunteerId: profile.id, 
      trainingName: data.trainingName,
      completedAt: new Date(data.completedAt),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
    }
  });
};

export const checkIn = async (userId: string, data: { latitude: number, longitude: number, zone?: string }) => {
  const profile = await ensureProfileExists(userId);
  return prisma.volunteerCheckIn.create({
    data: {
      volunteerId: profile.id,
      latitude: data.latitude,
      longitude: data.longitude,
      zone: data.zone
    }
  });
};

export const checkOut = async (userId: string, checkInId: string) => {
  const profile = await ensureProfileExists(userId);
  const checkInRecord = await prisma.volunteerCheckIn.findUnique({ where: { id: checkInId } });
  
  if (!checkInRecord || checkInRecord.volunteerId !== profile.id || checkInRecord.checkOutTime) {
    throw new Error('Invalid check-in record');
  }

  const checkOutTime = new Date();
  const hours = (checkOutTime.getTime() - checkInRecord.checkInTime.getTime()) / (1000 * 60 * 60);

  const updatedCheckIn = await prisma.volunteerCheckIn.update({
    where: { id: checkInId },
    data: { checkOutTime, activeHours: hours }
  });

  await prisma.volunteerProfile.update({
    where: { id: profile.id },
    data: { totalHours: { increment: hours } }
  });

  return updatedCheckIn;
};

export const submitWellbeing = async (userId: string, data: { physicalRating: number, mentalRating: number, needsResources: boolean }) => {
  const profile = await ensureProfileExists(userId);
  const distressFlag = data.physicalRating <= 2 || data.mentalRating <= 2 || data.needsResources;
  
  return prisma.volunteerWellbeing.create({
    data: {
      volunteerId: profile.id,
      physicalRating: data.physicalRating,
      mentalRating: data.mentalRating,
      needsResources: data.needsResources,
      distressFlag
    }
  });
};

export const getRecommendedIncidents = async (userId: string) => {
  const profile = await getVolunteerProfile(userId);
  if (!profile) return [];

  const lastCheckIn = profile.checkIns[0];
  const userLat = lastCheckIn && !lastCheckIn.checkOutTime ? lastCheckIn.latitude : null;
  const userLng = lastCheckIn && !lastCheckIn.checkOutTime ? lastCheckIn.longitude : null;

  const userSkills = profile.skills.map(s => s.skillName.toLowerCase());

  const activeIncidents = await prisma.incidentReport.findMany({
    where: { status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] as any } }
  });

  const rankedIncidents = activeIncidents.map(incident => {
    let score = 0;
    
    // Skill Matching (simple keyword search in description/title/category)
    const text = `${incident.title} ${incident.description} ${incident.category}`.toLowerCase();
    let matchedSkills = 0;
    userSkills.forEach(skill => {
      if (text.includes(skill)) matchedSkills++;
    });
    score += matchedSkills * 20;

    // Distance Matching
    let distance = null;
    if (userLat && userLng && incident.latitude && incident.longitude) {
      distance = calculateDistanceKm(userLat, userLng, incident.latitude, incident.longitude);
      if (distance < 5) score += 50;
      else if (distance < 15) score += 30;
      else if (distance < 50) score += 10;
    }

    // Severity
    if (incident.severity === 'CRITICAL' as any) score += 30;
    if (incident.severity === 'HIGH' as any) score += 15;

    return { ...incident, matchScore: score, distance, matchedSkills };
  }).filter(inc => inc.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);

  return rankedIncidents;
};

export const listAllVolunteers = async () => {
  return prisma.user.findMany({
    where: { role: 'VOLUNTEER' as any },
    include: {
      volunteerProfile: {
        include: {
          skills: true,
          badges: true,
          checkIns: { orderBy: { checkInTime: 'desc' }, take: 5 }
        }
      }
    }
  });
};

// Kept legacy for compatibility
export const createTask = async (data: any) => prisma.task.create({ data });
export const getTasksByVolunteer = async (userId: string) => prisma.task.findMany({ where: { assignedToId: userId }, include: { incident: true }, orderBy: { createdAt: 'desc' } });
export const updateTaskStatus = async (id: string, status: any) => prisma.task.update({ where: { id }, data: { status } });
