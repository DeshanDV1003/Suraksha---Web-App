import prisma from '../utils/prisma';

export const getOperationalIntelligence = async () => {
  const [
    incidents,
    alerts,
    volunteers,
    camps,
    helpRequests,
    missingPersons
  ] = await Promise.all([
    prisma.incidentReport.findMany(),
    prisma.alert.findMany(),
    prisma.user.findMany({ where: { role: 'VOLUNTEER' } }),
    prisma.reliefCamp.findMany(),
    prisma.helpRequest.findMany(),
    prisma.missingPerson.findMany()
  ]);

  return {
    incidents: {
      total: incidents.length,
      critical: incidents.filter((i: any) => i.severity === 'CRITICAL').length,
      high: incidents.filter((i: any) => i.severity === 'HIGH').length,
      medium: incidents.filter((i: any) => i.severity === 'MEDIUM').length,
      low: incidents.filter((i: any) => i.severity === 'LOW').length,
    },
    alerts: {
      total: alerts.length,
      emergency: alerts.filter((a: any) => a.type === 'EMERGENCY').length,
    },
    volunteers: {
      total: volunteers.length,
    },
    camps: {
      total: camps.length,
    },
    helpRequests: {
      total: helpRequests.length,
    },
    missingPersons: {
      total: missingPersons.length,
      found: missingPersons.filter((m: any) => m.status === 'FOUND').length,
    },
    weeklyTrends: [
      { name: 'Mon', value: 12 },
      { name: 'Tue', value: 18 },
      { name: 'Wed', value: 22 },
      { name: 'Thu', value: 14 },
      { name: 'Fri', value: 16 },
      { name: 'Sat', value: 19 },
      { name: 'Sun', value: 12 },
    ]
  };
};
