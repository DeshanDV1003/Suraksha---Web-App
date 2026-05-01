import prisma from '../utils/prisma';

export const listAuditLogs = async () => {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  });
};

export const createAuditEntry = async (userId: string | null, action: string, entity: string, entityId: string, metadata?: any) => {
  return prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      metadata
    }
  });
};
