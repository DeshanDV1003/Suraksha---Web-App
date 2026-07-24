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

export const notifyAdmins = async (title: string, message: string) => {
  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'COORDINATOR', 'RESPONDER'] } },
    select: { id: true }
  });
  await Promise.all(admins.map(a => sendNotification(a.id, title, message)));
};

export const notifyAllUsers = async (title: string, message: string) => {
  const users = await prisma.user.findMany({ select: { id: true } });
  await Promise.all(users.map(u => sendNotification(u.id, title, message)));
};
