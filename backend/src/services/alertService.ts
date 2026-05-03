import prisma from '../utils/prisma';

export const createAlert = async (data: any) => {
  const alert = await prisma.alert.create({ data });

  // Targeted Notification Logic
  const targetLocation = data.location;
  
  // Find users to notify
  const usersToNotify = await prisma.user.findMany({
    where: targetLocation === 'All Island' ? {} : { region: targetLocation },
    select: { id: true }
  });

  // Create notifications in bulk
  if (usersToNotify.length > 0) {
    await prisma.notification.createMany({
      data: usersToNotify.map(user => ({
        userId: user.id,
        title: `🚨 AREA ALERT: ${alert.title}`,
        message: alert.message,
        read: false
      }))
    });
  }

  return alert;
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
