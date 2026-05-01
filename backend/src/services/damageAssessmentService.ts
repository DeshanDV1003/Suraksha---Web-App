import prisma from '../utils/prisma';

export const createDamageAssessment = async (userId: string, data: any) => {
  return prisma.damageAssessment.create({
    data: {
      ...data,
      reportedById: userId,
      mediaUrls: data.mediaUrls || []
    }
  });
};

export const getDamageAssessments = async () => {
  return prisma.damageAssessment.findMany({
    include: {
      reportedBy: { select: { name: true } },
      incident: { select: { title: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const deleteDamageAssessment = async (id: string) => {
  return prisma.damageAssessment.delete({ where: { id } });
};
