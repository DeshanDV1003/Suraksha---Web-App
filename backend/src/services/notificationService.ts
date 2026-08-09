import prisma from '../utils/prisma';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Expo } = require('expo-server-sdk') as { Expo: any };
type ExpoPushMessage = { to: string; title: string; body: string; sound: string; priority: string; data: Record<string, any> };

const expo = new Expo();

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

// Send Expo push notifications to a list of users who have push tokens
export const sendExpoPush = async (
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, any>
) => {
  if (userIds.length === 0) return;

  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, NOT: { pushToken: null } },
    select: { pushToken: true },
  });

  const messages: ExpoPushMessage[] = users
    .filter(u => Expo.isExpoPushToken(u.pushToken!))
    .map(u => ({
      to: u.pushToken!,
      title,
      body,
      sound: 'default' as const,
      priority: 'high' as const,
      data: data || {},
    }));

  if (messages.length === 0) return;

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    expo.sendPushNotificationsAsync(chunk).catch(() => {});
  }
};

export const notifyAdmins = async (title: string, message: string) => {
  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'DMC_OFFICER', 'FIELD_RESPONDER'] } },
    select: { id: true }
  });
  await Promise.all(admins.map(a => sendNotification(a.id, title, message)));
};

export const notifyAllUsers = async (title: string, message: string) => {
  const users = await prisma.user.findMany({ select: { id: true } });
  await Promise.all(users.map(u => sendNotification(u.id, title, message)));
};

// Send both in-app DB notification + Expo push to all mobile users
export const sendAlertPushToAll = async (
  title: string,
  body: string,
  alertData?: Record<string, any>
) => {
  const users = await prisma.user.findMany({ select: { id: true } });
  await Promise.all(users.map(u => sendNotification(u.id, title, body)));
  const userIds = users.map(u => u.id);
  await sendExpoPush(userIds, title, body, alertData);
};

export const sendAlertPushToRegion = async (
  title: string,
  body: string,
  locations: string[],
  alertData?: Record<string, any>
) => {
  if (!locations || locations.length === 0) {
    return sendAlertPushToAll(title, body, alertData);
  }
  // Match users whose region matches any of the alert's locations (district-level)
  const users = await prisma.user.findMany({
    where: { region: { in: locations } },
    select: { id: true },
  });
  // Also always notify admins regardless of region
  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'DMC_OFFICER', 'FIELD_RESPONDER'] as any } },
    select: { id: true },
  });
  const allIds = [...new Set([...users.map(u => u.id), ...admins.map(u => u.id)])];
  await Promise.all(allIds.map(id => sendNotification(id, title, body)));
  await sendExpoPush(allIds, title, body, alertData);
};
