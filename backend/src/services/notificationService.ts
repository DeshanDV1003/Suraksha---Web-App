import prisma from '../utils/prisma';

export const getUserNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
};

export const markNotificationRead = async (id: string) => {
  return prisma.notification.update({
    where: { id },
    data: { read: true }
  });
};

export const sendNotification = async (userId: string, title: string, message: string) => {
  return prisma.notification.create({
    data: { userId, title, message }
  });
};
