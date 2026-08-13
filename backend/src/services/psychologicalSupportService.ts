import prisma from '../utils/prisma';

export const getWellbeingTrends = async () => {
  // Aggregate data for dashboard
  // Mock data as actual aggregate queries would need significant historical data
  return {
    requestsByDay: [
      { day: 'Mon', requests: 12 },
      { day: 'Tue', requests: 19 },
      { day: 'Wed', requests: 15 },
      { day: 'Thu', requests: 25 },
      { day: 'Fri', requests: 22 },
      { day: 'Sat', requests: 30 },
      { day: 'Sun', requests: 28 },
    ],
    topIssues: [
      { issue: 'Grief & Loss', count: 45 },
      { issue: 'Anxiety/Panic', count: 38 },
      { issue: 'PTSD Symptoms', count: 25 },
      { issue: 'Displacement Stress', count: 43 },
    ],
    utilizationRate: 85 // 85% counselor utilization
  };
};

export const getCheckIns = async () => {
  return prisma.psychologicalSupportRequest.findMany({
    where: {
      nextCheckInDate: { not: null },
      checkInStatus: { not: 'COMPLETED' }
    },
    include: {
      user: true
    },
    orderBy: {
      nextCheckInDate: 'asc'
    }
  });
};

export const updateCheckIn = async (id: string, status: string, nextDate: string | null) => {
  return prisma.psychologicalSupportRequest.update({
    where: { id },
    data: {
      checkInStatus: status,
      nextCheckInDate: nextDate ? new Date(nextDate) : null
    }
  });
};

// Guides
export const getGuides = async () => {
  return prisma.mentalHealthGuide.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

// Group Therapy
export const getGroupSessions = async () => {
  return prisma.groupTherapySession.findMany({
    include: {
      participants: true
    },
    orderBy: { scheduledFor: 'asc' }
  });
};

export const createGroupSession = async (data: any) => {
  return prisma.groupTherapySession.create({
    data: {
      title: data.title,
      description: data.description,
      campId: data.campId,
      counselorId: data.counselorId,
      scheduledFor: new Date(data.scheduledFor),
      maxParticipants: data.maxParticipants || 20
    }
  });
};

export const joinGroupSession = async (sessionId: string, userId: string) => {
  return prisma.groupTherapyParticipant.create({
    data: {
      sessionId,
      userId
    }
  });
};

// Chat
export const getChatSessions = async () => {
  return prisma.chatSession.findMany({
    include: {
      messages: { orderBy: { createdAt: 'asc' } }
    },
    orderBy: { startedAt: 'desc' }
  });
};

export const acceptChatSession = async (sessionId: string, counselorId: string) => {
  return prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      counselorId,
      status: 'ACTIVE'
    }
  });
};

export const endChatSession = async (sessionId: string, moodAfter: string) => {
  return prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      status: 'COMPLETED',
      endedAt: new Date(),
      moodAfter
    }
  });
};

export const saveChatMessage = async (sessionId: string, senderId: string, content: string) => {
  return prisma.chatMessage.create({
    data: {
      sessionId,
      senderId,
      content
    }
  });
};

export const createChatSession = async (userId: string, moodBefore?: string) => {
  return prisma.chatSession.create({
    data: {
      requestId: userId + '-' + Date.now(),
      userId,
      status: 'WAITING',
      moodAfter: moodBefore || null
    }
  });
};

export const getMyChatSessions = async (userId: string) => {
  return prisma.chatSession.findMany({
    where: { userId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
    orderBy: { startedAt: 'desc' }
  });
};

export const submitMoodLog = async (userId: string, mood: string) => {
  return prisma.chatSession.create({
    data: {
      requestId: 'mood-' + userId + '-' + Date.now(),
      userId,
      status: 'MOOD_LOG',
      moodAfter: mood
    }
  });
};
