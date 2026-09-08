import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '../../prisma/generated/client';

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
      hasMobileApp: true,
      lastCheckInTime: true,
      isFieldActive: true,
      twoFactorEnabled: true,
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

export const updateUserRole = async (id: string, role: any, updatedByUserId?: string) => {
  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    }
  });

  if (updatedByUserId) {
    await prisma.auditLog.create({
      data: {
        userId: updatedByUserId,
        action: 'UPDATE',
        entity: 'USER_ROLE',
        entityId: id,
        metadata: { newRole: role }
      }
    });
  }
  return updated;
};

export const deleteUser = async (id: string, deletedByUserId?: string) => {
  const deleted = await prisma.user.delete({ where: { id } });
  
  if (deletedByUserId) {
    await prisma.auditLog.create({
      data: {
        userId: deletedByUserId,
        action: 'DELETE',
        entity: 'USER',
        entityId: id,
        metadata: { deletedEmail: deleted.email }
      }
    });
  }
  return deleted;
};

export const updateProfile = async (userId: string, data: any) => {
  const { name, phone, profilePicture } = data;
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(profilePicture !== undefined && { profilePicture }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      profilePicture: true,
      twoFactorEnabled: true,
    }
  });
};

export const getSessions = async (userId: string) => {
  return prisma.userSessionLog.findMany({
    where: { userId },
    orderBy: { loginTime: 'desc' },
    take: 10,
  });
};

export const deleteSession = async (userId: string, sessionId: string) => {
  const session = await prisma.userSessionLog.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== userId) throw new Error('Session not found');
  return prisma.userSessionLog.delete({ where: { id: sessionId } });
};

export const getRBACMatrix = async () => {
  return prisma.rolePermission.findMany({
    orderBy: { role: 'asc' }
  });
};

export const updateRBACMatrix = async (permissions: any[], updatedBy: string) => {
  const promises = permissions.map(async (p) => {
    if (p.id) {
      return prisma.rolePermission.update({
        where: { id: p.id },
        data: { canView: p.canView, canEdit: p.canEdit, canDelete: p.canDelete, updatedBy }
      });
    } else {
      const existing = await prisma.rolePermission.findFirst({
        where: { role: p.role, module: p.module }
      });
      if (existing) {
        return prisma.rolePermission.update({
          where: { id: existing.id },
          data: { canView: p.canView, canEdit: p.canEdit, canDelete: p.canDelete, updatedBy }
        });
      } else {
        return prisma.rolePermission.create({
          data: { role: p.role, module: p.module, canView: p.canView, canEdit: p.canEdit, canDelete: p.canDelete, updatedBy }
        });
      }
    }
  });
  
  await prisma.auditLog.create({
    data: {
      userId: updatedBy,
      action: 'UPDATE',
      entity: 'ROLE_PERMISSION',
      entityId: 'MATRIX',
    }
  });

  return Promise.all(promises);
};

export const bulkImportUsers = async (users: any[]) => {
  const results = [];
  const defaultPassword = await bcrypt.hash('Suraksha@123', 10);
  
  for (const user of users) {
    try {
      const created = await prisma.user.create({
        data: {
          name: user.name,
          email: user.email.toLowerCase().trim(),
          nic: user.nic,
          phone: user.phone,
          password: defaultPassword,
          role: user.role as Role || 'CITIZEN'
        }
      });
      // Mock sending welcome SMS
      console.log(`[MOCK SMS] Welcome to Suraksha, ${created.name}! Your role is ${created.role}.`);
      results.push({ success: true, email: created.email });
    } catch (e: any) {
      results.push({ success: false, email: user.email, error: e.message });
    }
  }
  return results;
};

export const getAuditLogs = async () => {
  const sessions = await prisma.userSessionLog.findMany({
    include: { user: { select: { name: true, email: true, role: true } } },
    orderBy: { loginTime: 'desc' },
    take: 100
  });

  const actions = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  // Resolve every id we can — actor ids plus entityIds that point at a User.
  const actorIds = actions.map(a => a.userId).filter(Boolean) as string[];
  const userEntityIds = actions
    .filter(a => /user/i.test(a.entity) && a.entityId && a.entityId !== 'MATRIX')
    .map(a => a.entityId) as string[];
  const allIds = [...new Set([...actorIds, ...userEntityIds])];
  const users = allIds.length
    ? await prisma.user.findMany({ where: { id: { in: allIds } }, select: { id: true, email: true, name: true } })
    : [];
  const byId = new Map(users.map(u => [u.id, u]));

  const prettyEntity = (e: string) => e.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  const enrichedActions = actions.map(a => {
    const actor = a.userId ? byId.get(a.userId) : undefined;
    const target = /user/i.test(a.entity) && a.entityId ? byId.get(a.entityId) : undefined;
    return {
      ...a,
      userEmail: actor ? actor.email : 'System',
      userName: actor ? actor.name : 'System',
      entityLabel: prettyEntity(a.entity),
      targetName: target ? target.name : (a.entityId === 'MATRIX' ? 'RBAC matrix' : null),
    };
  });

  return { sessions, actions: enrichedActions };
};

export const toggleFieldResponderApp = async (userId: string, hasApp: boolean) => {
  return prisma.user.update({
    where: { id: userId },
    data: { hasMobileApp: hasApp }
  });
};

export const sendAppLink = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && user.phone) {
    console.log(`[MOCK SMS] Download Suraksha Field App: https://suraksha.gov.lk/app. Link sent to ${user.phone}`);
    return { success: true };
  }
  throw new Error('User has no phone number');
};
