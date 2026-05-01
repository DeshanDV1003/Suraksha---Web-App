import prisma from '../utils/prisma';

export const createMissingPerson = async (userId: string, data: any) => {
  return prisma.missingPerson.create({
    data: {
      ...data,
      reportedBy: userId
    }
  });
};

export const getMissingPersons = async () => {
  return prisma.missingPerson.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

export const updateMissingPersonStatus = async (id: string, status: string) => {
  return prisma.missingPerson.update({
    where: { id },
    data: { status }
  });
};

export const deleteMissingPerson = async (id: string) => {
  return prisma.missingPerson.delete({ where: { id } });
};
