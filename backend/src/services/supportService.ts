import prisma from '../utils/prisma';

export const createSupportRequest = async (userId: string, data: any) => {
  return prisma.psychologicalSupportRequest.create({
    data: {
      ...data,
      userId
    }
  });
};

export const getSupportRequests = async () => {
  return prisma.psychologicalSupportRequest.findMany({
    include: {
      user: { select: { name: true, phone: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const updateSupportStatus = async (id: string, data: any) => {
  const { status, notes, assignedToId } = data;
  return prisma.psychologicalSupportRequest.update({
    where: { id },
    data: { status, notes, assignedToId }
  });
};
