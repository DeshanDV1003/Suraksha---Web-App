import prisma from '../utils/prisma';

export const createEvacuationRoute = async (data: any) => {
  return prisma.evacuationRoute.create({ data });
};

export const getEvacuationRoutes = async () => {
  return prisma.evacuationRoute.findMany();
};

export const createVolunteerLocation = async (data: any) => {
  return prisma.volunteerLocation.create({ data });
};

export const getVolunteerLocations = async () => {
  return prisma.volunteerLocation.findMany();
};

export const createThreatProjection = async (data: any) => {
  return prisma.threatProjection.create({ data });
};

export const getThreatProjections = async () => {
  return prisma.threatProjection.findMany({ where: { active: true } });
};
