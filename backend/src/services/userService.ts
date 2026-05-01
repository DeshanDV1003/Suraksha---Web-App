import prisma from '../utils/prisma';

export const listUsers = async () => {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      createdAt: true,
    }
  });
};

export const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    include: {
      volunteerProfile: true,
      reliefTokens: true,
      helpRequests: true,
      supportRequests: true,
      assignedTasks: true,
    }
  });
};

export const updateUserRole = async (id: string, role: any) => {
  return prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    }
  });
};

export const deleteUser = async (id: string) => {
  return prisma.user.delete({ where: { id } });
};

export const updateProfile = async (userId: string, data: any) => {
  const { name, phone } = data;
  return prisma.user.update({
    where: { id: userId },
    data: { name, phone },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
    }
  });
};
