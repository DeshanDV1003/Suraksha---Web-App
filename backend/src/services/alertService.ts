import prisma from '../utils/prisma';

export const createAlert = async (data: any) => {
  return prisma.alert.create({ data });
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
