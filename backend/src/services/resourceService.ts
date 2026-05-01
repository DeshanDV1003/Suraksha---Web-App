import prisma from '../utils/prisma';

export const getAllResources = async () => {
  return prisma.resource.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

export const createResource = async (data: any) => {
  return prisma.resource.create({ data });
};

export const updateResourceStatus = async (id: string, status: string) => {
  return prisma.resource.update({
    where: { id },
    data: { status }
  });
};
