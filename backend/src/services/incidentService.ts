import prisma from '../utils/prisma';

export const getAllIncidents = async () => {
  return prisma.incidentReport.findMany({
    include: {
      reporter: { select: { name: true } },
      verifications: { include: { user: { select: { name: true } } } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getIncidentById = async (id: string) => {
  return prisma.incidentReport.findUnique({
    where: { id },
    include: {
      reporter: { select: { name: true, phone: true } },
      verifications: true,
      tasks: true,
      damageAssessments: true
    }
  });
};

export const createIncident = async (data: any) => {
  return prisma.incidentReport.create({
    data: {
      ...data,
      status: 'PENDING'
    }
  });
};

export const updateIncidentStatus = async (id: string, status: any) => {
  return prisma.incidentReport.update({
    where: { id },
    data: { status }
  });
};

export const deleteIncident = async (id: string) => {
  return prisma.incidentReport.delete({ where: { id } });
};

export const getIncidentsByUser = async (reporterId: string) => {
  return prisma.incidentReport.findMany({
    where: { reporterId },
    orderBy: { createdAt: 'desc' }
  });
};
