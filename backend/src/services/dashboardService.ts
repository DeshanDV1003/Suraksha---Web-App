import prisma from '../utils/prisma';

export const getDashboardStats = async () => {
  const [
    incidents,
    volunteers,
    camps,
    helpRequests,
    missingPersons,
    alerts
  ] = await Promise.all([
    prisma.incidentReport.findMany({ where: { status: { not: 'RESOLVED' } } }),
    prisma.user.count({ where: { role: 'VOLUNTEER' } }),
    prisma.reliefCamp.count(),
    prisma.helpRequest.count(),
    prisma.missingPerson.count(),
    prisma.alert.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
  ]);

  return {
    activeIncidents: incidents.length,
    volunteersActive: volunteers,
    reliefCamps: camps,
    helpRequests: helpRequests,
    missingPersons: missingPersons,
    recentIncidents: incidents.slice(0, 5),
    recentAlerts: alerts
  };
};
