import prisma from '../utils/prisma';

export const getAllIncidents = async (filter: { category?: string; status?: string } = {}) => {
  const where: any = {};
  if (filter.category) where.category = filter.category;
  if (filter.status) where.status = filter.status;
  return prisma.incidentReport.findMany({
    where,
    include: {
      reporter:      { select: { name: true } },
      verifications: { include: { user: { select: { name: true } } } },
      duplicateLinks: {
        where:   { status: 'PENDING' },
        select:  { id: true, canonicalId: true, score: true, distanceM: true, reasons: true, status: true },
      },
      canonicalLinks: {
        where:   { status: 'PENDING' },
        select:  { id: true, reportId: true, score: true, distanceM: true, reasons: true, status: true },
      },
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getIncidentById = async (id: string) => {
  const incident = await prisma.incidentReport.findUnique({
    where: { id },
    include: {
      reporter: { select: { name: true, phone: true } },
      verifications: true,
      tasks: true,
      damageAssessments: true,
      history: { orderBy: { createdAt: 'asc' } },
    }
  });
  if (!incident) return incident;

  // Resolve the actor name for each history entry (updatedBy holds a user id)
  const actorIds = [...new Set(incident.history.map(h => h.updatedBy).filter(Boolean))];
  const actors = actorIds.length
    ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, role: true } })
    : [];
  const byId = new Map(actors.map(a => [a.id, a]));
  return {
    ...incident,
    history: incident.history.map(h => ({
      ...h,
      actorName: byId.get(h.updatedBy)?.name ?? 'System',
      actorRole: byId.get(h.updatedBy)?.role ?? null,
    })),
  };
};

export const createIncident = async (data: any) => {
  const incident = await prisma.incidentReport.create({
    data: { ...data, status: 'PENDING' }
  });
  await prisma.incidentHistory.create({
    data: {
      incidentId: incident.id,
      status: 'PENDING',
      updatedBy: data.reporterId ?? '',
      note: 'Incident reported and logged',
    },
  }).catch(() => {});
  return incident;
};

export const updateIncidentStatus = async (id: string, status: any, updatedBy?: string, note?: string) => {
  const incident = await prisma.incidentReport.update({
    where: { id },
    data: { status }
  });
  await prisma.incidentHistory.create({
    data: {
      incidentId: id,
      status,
      updatedBy: updatedBy ?? '',
      note: note ?? `Status changed to ${String(status).replace(/_/g, ' ')}`,
    },
  }).catch(() => {});
  return incident;
};

export const deleteIncident = async (id: string) => {
  // Child rows have no ON DELETE CASCADE, so remove them first in one transaction.
  return prisma.$transaction([
    prisma.incidentHistory.deleteMany({ where: { incidentId: id } }),
    prisma.reportVerification.deleteMany({ where: { reportId: id } }),
    prisma.verifierAction.deleteMany({ where: { incidentId: id } }),
    prisma.task.deleteMany({ where: { incidentId: id } }),
    prisma.damageAssessment.deleteMany({ where: { incidentId: id } }),
    prisma.afterActionReport.deleteMany({ where: { incidentId: id } }),
    prisma.mLLog.deleteMany({ where: { incidentId: id } }),
    prisma.incidentReport.delete({ where: { id } }),
  ]);
};

export const getIncidentsByUser = async (reporterId: string) => {
  return prisma.incidentReport.findMany({
    where: { reporterId },
    orderBy: { createdAt: 'desc' }
  });
};
