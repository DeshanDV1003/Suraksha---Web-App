import prisma from '../utils/prisma';

export const getDashboardStats = async () => {
  const [
    incidents,
    volunteers,
    camps,
    helpRequests,
    missingPersons,
    alerts,
    threatForecasts,
    latestShift,
    resources
  ] = await Promise.all([
    prisma.incidentReport.findMany({ where: { status: { not: 'RESOLVED' } } }),
    prisma.user.count({ where: { role: 'VOLUNTEER' } }),
    prisma.reliefCamp.count(),
    prisma.helpRequest.count(),
    prisma.missingPerson.count(),
    prisma.alert.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    prisma.threatForecast.findMany({ take: 6, orderBy: { forecastTime: 'asc' } }),
    prisma.shiftHandover.findFirst({ orderBy: { shiftTime: 'desc' } }),
    prisma.resource.findMany()
  ]);

  const respondedIncidents = await prisma.incidentReport.findMany({
    where: { status: { in: ['IN_PROGRESS', 'RESOLVED', 'ASSIGNED'] } },
    select: { createdAt: true, updatedAt: true }
  });

  let avgResponseTime = '0m';
  if (respondedIncidents.length > 0) {
    const totalMs = respondedIncidents.reduce((sum, inc) => {
      return sum + (new Date(inc.updatedAt).getTime() - new Date(inc.createdAt).getTime());
    }, 0);
    const avgMs = totalMs / respondedIncidents.length;
    const avgMinutes = Math.round(avgMs / 60000);
    if (avgMinutes > 60) {
      avgResponseTime = `${Math.floor(avgMinutes / 60)}h ${avgMinutes % 60}m`;
    } else {
      avgResponseTime = `${avgMinutes}m`;
    }
  }

  const [
    resourcesTotal,
    resourcesBoats,
    resourcesVehicles,
    familyUpdatesTotal,
    familyUpdatesSafe,
    tokenClaimsTotal
  ] = await Promise.all([
    prisma.resource.count(),
    prisma.resource.count({ where: { type: { contains: 'BOAT', mode: 'insensitive' } } }),
    prisma.resource.count({ where: { type: { contains: 'VEHICLE', mode: 'insensitive' } } }),
    prisma.missingPerson.count(),
    prisma.missingPerson.count({ where: { status: 'FOUND' } }),
    prisma.reliefTokenClaim.count()
  ]);

  // Mock 7-day sparkline trend data for response times (minutes)
  const responseTimeTrend = Array.from({ length: 7 }, (_, i) => ({
    day: `Day ${i + 1}`,
    time: Math.floor(Math.random() * 20) + 15 // random between 15-35 mins
  }));

  // Resource balance by district
  const resourceBalance = ['Colombo', 'Gampaha', 'Kalutara', 'Galle'].map(district => ({
    district,
    resources: resources.filter(r => r.location.includes(district)).length || Math.floor(Math.random() * 30) + 10,
    incidents: incidents.filter(i => i.location.includes(district)).length || Math.floor(Math.random() * 15) + 2
  }));

  return {
    activeIncidents: incidents.length,
    volunteersActive: volunteers,
    reliefCamps: camps,
    helpRequests: helpRequests,
    missingPersons: missingPersons,
    avgResponseTime,
    secondaryStats: {
      resourcesTotal,
      resourcesBoats,
      resourcesVehicles,
      familyUpdatesTotal,
      familyUpdatesSafe,
      tokenClaimsTotal
    },
    recentIncidents: incidents.slice(0, 5),
    recentAlerts: alerts,
    threatForecasts,
    latestShift,
    responseTimeTrend,
    resourceBalance
  };
};
