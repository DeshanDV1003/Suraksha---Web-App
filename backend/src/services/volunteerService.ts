import prisma from '../utils/prisma';

export const upsertVolunteerProfile = async (userId: string, data: any) => {
  const { skills, availability } = data;
  return prisma.volunteerProfile.upsert({
    where: { userId },
    update: { skills, availability },
    create: { userId, skills, availability }
  });
};

export const getVolunteerProfile = async (userId: string) => {
  return prisma.volunteerProfile.findUnique({
    where: { userId },
    include: { user: { select: { name: true, email: true, phone: true } } }
  });
};

export const listAllVolunteers = async () => {
  return prisma.user.findMany({
    where: { role: 'VOLUNTEER' },
    include: { volunteerProfile: true }
  });
};

export const createTask = async (data: any) => {
  return prisma.task.create({ data });
};

export const getTasksByVolunteer = async (userId: string) => {
  return prisma.task.findMany({
    where: { assignedToId: userId },
    include: { incident: true },
    orderBy: { createdAt: 'desc' }
  });
};

export const updateTaskStatus = async (id: string, status: any) => {
  return prisma.task.update({
    where: { id },
    data: { status }
  });
};
