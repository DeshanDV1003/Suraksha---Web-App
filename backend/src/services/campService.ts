import prisma from '../utils/prisma';

export const getAllCamps = async () => {
  return prisma.reliefCamp.findMany({
    orderBy: { currentOccupancy: 'desc' }
  });
};

export const createCamp = async (data: any) => {
  return prisma.reliefCamp.create({ data });
};

export const updateCampOccupancy = async (id: string, occupancy: number) => {
  return prisma.reliefCamp.update({
    where: { id },
    data: { currentOccupancy: occupancy }
  });
};
