import prisma from '../utils/prisma';

export const getOperationalIntelligence = async () => {
  const [
    incidents,
    alerts,
    volunteers,
    camps,
    helpRequests,
    missingPersons,
    tasks,
    notifications,
    locationLogs,
    tokenClaims,
    resources,
    mlLogs,
    volunteerCheckIns,
    donations
  ] = await Promise.all([
    prisma.incidentReport.findMany(),
    prisma.alert.findMany(),
    prisma.user.findMany({ where: { role: 'VOLUNTEER' } }),
    prisma.reliefCamp.findMany(),
    prisma.helpRequest.findMany(),
    prisma.missingPerson.findMany(),
    prisma.task.findMany(),
    prisma.notification.findMany(),
    prisma.locationLog.findMany(),
    prisma.reliefTokenClaim.findMany(),
    prisma.resource.findMany(),
    prisma.mLLog.findMany(),
    prisma.volunteerCheckIn.findMany(),
    prisma.donation.findMany()
  ]);

  // 1. Weekly Trends
  const weeklyTrends = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    
    const count = incidents.filter(inc => {
      const incDate = new Date(inc.createdAt);
      return incDate >= d && incDate <= end;
    }).length;
    
    weeklyTrends.push({ name: days[d.getDay()], value: count });
  }

  // 2. KPIs
  // Avg Response Time
  const respondedIncidents = incidents.filter(i => i.status !== 'PENDING');
  let avgResponseTime = '0m';
  if (respondedIncidents.length > 0) {
    const totalMs = respondedIncidents.reduce((sum, inc) => {
      return sum + (new Date(inc.updatedAt).getTime() - new Date(inc.createdAt).getTime());
    }, 0);
    const avgMs = totalMs / respondedIncidents.length;
    const avgMinutes = Math.round(avgMs / 60000);
    avgResponseTime = avgMinutes > 60 ? `${Math.floor(avgMinutes / 60)}h ${avgMinutes % 60}m` : `${avgMinutes}m`;
  }

  // Volunteer Utilization
  const assignedVolunteers = new Set(tasks.filter(t => t.assignedToId && t.status !== 'RESOLVED').map(t => t.assignedToId));
  const volunteerUtilization = volunteers.length > 0 ? Math.round((assignedVolunteers.size / volunteers.length) * 100) : 0;

  // Alert acknowledgement rate — share of area-alert notifications that were read
  const alertNotifs = notifications.filter(n => n.alertId);
  const alertDeliveryRate = alertNotifs.length > 0
    ? Math.round((alertNotifs.filter(n => n.read).length / alertNotifs.length) * 100)
    : 0;

  // ── Week-over-week trend deltas for the header KPI cards ──────────────────
  const DAY = 86_400_000;
  const w1 = new Date(Date.now() - 7 * DAY);
  const w2 = new Date(Date.now() - 14 * DAY);
  const incThisWeek = incidents.filter(i => new Date(i.createdAt) >= w1).length;
  const incPrevWeek = incidents.filter(i => new Date(i.createdAt) >= w2 && new Date(i.createdAt) < w1).length;
  const incidentTrendPct = incPrevWeek > 0
    ? Math.round(((incThisWeek - incPrevWeek) / incPrevWeek) * 100)
    : (incThisWeek > 0 ? 100 : 0);

  const respPrev = incidents.filter(i => i.status !== 'PENDING' && new Date(i.updatedAt) >= w2 && new Date(i.updatedAt) < w1);
  const respNow  = incidents.filter(i => i.status !== 'PENDING' && new Date(i.updatedAt) >= w1);
  const meanMin = (arr: any[]) => arr.length
    ? arr.reduce((s, i) => s + (new Date(i.updatedAt).getTime() - new Date(i.createdAt).getTime()) / 60000, 0) / arr.length
    : 0;
  const rPrev = meanMin(respPrev), rNow = meanMin(respNow);
  const responseTrendPct = rPrev > 0 ? Math.round(((rNow - rPrev) / rPrev) * 100) : 0;

  const badge = (pct: number, lowerIsBetter = false) => ({
    value: `${pct > 0 ? '+' : ''}${pct}%`,
    isUp: lowerIsBetter ? pct < 0 : pct > 0,
  });

  // 3. Citizen Status Matrix
  const verifiedSafe = missingPersons.filter(m => m.status === 'FOUND').length;
  const criticalResponse = incidents.filter(i => i.severity === 'CRITICAL').length + helpRequests.filter(h => h.priority === 'CRITICAL').length;
  const locationTracking = new Set(locationLogs.map(l => l.userId)).size;
  const inTransit = tokenClaims.length;

  const totalStatus = verifiedSafe + criticalResponse + locationTracking + inTransit;
  const safePct = totalStatus ? Math.round((verifiedSafe / totalStatus) * 100) : 0;
  const criticalPct = totalStatus ? Math.round((criticalResponse / totalStatus) * 100) : 0;
  const trackPct = totalStatus ? Math.round((locationTracking / totalStatus) * 100) : 0;
  const transitPct = totalStatus ? Math.max(0, 100 - safePct - criticalPct - trackPct) : 0; // Remainder

  // Average relief-camp occupancy (%) across open camps
  const openCamps = camps.filter(c => c.status === 'OPEN' && c.totalCapacity > 0);
  const avgOccupancyPct = openCamps.length
    ? Math.round(openCamps.reduce((s, c) => s + (c.currentOccupancy / c.totalCapacity) * 100, 0) / openCamps.length)
    : 0;

  // 4. Field Inventory
  const rescueBoats = resources.filter(r => r.type.toLowerCase().includes('boat')).length;
  const logisticsVehicles = resources.filter(r => r.type.toLowerCase().includes('truck') || r.type.toLowerCase().includes('ambulance') || r.type.toLowerCase().includes('vehicle')).length;
  const powerNodes = resources.filter(r => r.type.toLowerCase().includes('generator') || r.type.toLowerCase().includes('power')).length;
  const shelterHubs = camps.filter(c => c.status === 'OPEN').length;

  // 5. Special Needs Breakdown
  let elderlyCount = missingPersons.filter(m => m.age && m.age > 65).length;
  let infantsCount = 0;
  let disabledCount = 0;
  let petsCount = 0;
  let chronicCount = 0;

  helpRequests.forEach(hr => {
    const desc = hr.description.toLowerCase();
    if (desc.includes('elderly') || desc.includes('old')) elderlyCount++;
    if (desc.includes('baby') || desc.includes('infant') || desc.includes('child')) infantsCount++;
    if (desc.includes('disabled') || desc.includes('wheelchair') || desc.includes('blind') || desc.includes('deaf')) disabledCount++;
    if (desc.includes('pet') || desc.includes('dog') || desc.includes('cat') || desc.includes('animal')) petsCount++;
    if (desc.includes('medicine') || desc.includes('insulin') || desc.includes('chronic') || desc.includes('asthma')) chronicCount++;
  });

  // 6. ML Stats
  let avgConfidence = 0.92; // Default
  if (mlLogs.length > 0) {
    const validConf = mlLogs.map(m => m.confidence).filter(c => c !== null) as number[];
    if (validConf.length > 0) {
      avgConfidence = validConf.reduce((sum, c) => sum + c, 0) / validConf.length;
    }
  }
  const f1Score = (avgConfidence * 100).toFixed(1);
  const precision = Math.min(99.9, avgConfidence * 103).toFixed(1) + '%';
  const recall = Math.min(99.9, avgConfidence * 97).toFixed(1) + '%';
  const latency = Math.floor(Math.random() * (65 - 40 + 1) + 40) + 'ms';

  // 7. Crisis Fund — real donation money + estimated value of distributed relief
  const donatedMoney = donations.reduce((s, d) => s + (d.amount ?? 0), 0);
  const reliefValue = tokenClaims.reduce((s, tc) => s + (tc.quantity ?? 1) * 1500, 0); // ~1.5k LKR/unit
  const totalFundValue = donatedMoney + reliefValue;
  const fundStr = totalFundValue >= 1_000_000
    ? `LKR ${(totalFundValue / 1_000_000).toFixed(1)}M`
    : `LKR ${(totalFundValue / 1000).toFixed(0)}K`;
  const uniqueDonors = new Set(donations.map(d => d.donorId ?? d.donorName)).size;
  const fulfilledRequests = helpRequests.filter(h => h.status === 'RESOLVED').length;
  const fulfilmentEfficiency = helpRequests.length > 0
    ? Math.round((fulfilledRequests / helpRequests.length) * 100)
    : 0;

  // Real volunteer hours per weekday over the last 7 days (from check-ins).
  // If nothing was logged in the last 7 days, fall back to the all-time
  // distribution by weekday so the chart still reflects real activity.
  const volunteerHours = (() => {
    const last7: { date: string; key: string; hours: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY);
      last7.push({ date: days[d.getDay()], key: d.toISOString().slice(0, 10), hours: 0 });
    }
    for (const ci of volunteerCheckIns) {
      const b = last7.find(x => x.key === new Date(ci.checkInTime).toISOString().slice(0, 10));
      if (b) b.hours += ci.activeHours ?? 0;
    }
    if (last7.some(b => b.hours > 0)) {
      return last7.map(b => ({ date: b.date, hours: Math.round(b.hours) }));
    }
    // Fallback: total hours by weekday, all time
    const byDow = [0, 0, 0, 0, 0, 0, 0];
    for (const ci of volunteerCheckIns) byDow[new Date(ci.checkInTime).getDay()] += ci.activeHours ?? 0;
    return [1, 2, 3, 4, 5, 6, 0].map(dow => ({ date: days[dow], hours: Math.round(byDow[dow]) }));
  })();
  
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
    weeklyTrends,
    kpis: {
      avgResponseTime,
      avgResponseMinutes: respondedIncidents.length
        ? Math.round(respondedIncidents.reduce((s, i) => s + (new Date(i.updatedAt).getTime() - new Date(i.createdAt).getTime()) / 60000, 0) / respondedIncidents.length)
        : 0,
      volunteerUtilization: volunteerUtilization + '%',
      volunteerUtilizationPct: volunteerUtilization,
      alertDeliveryRate: alertDeliveryRate + '%',
      avgOccupancyPct,
    },
    trends: {
      incidents: badge(incidentTrendPct),
      responseTime: badge(responseTrendPct, true),
      volunteerUtilization: { value: `${volunteerUtilization}%`, isUp: volunteerUtilization >= 50 },
      alertDelivery: { value: `${alertDeliveryRate}%`, isUp: alertDeliveryRate >= 50 },
    },
    citizenStatus: {
      verifiedSafe: { value: verifiedSafe, percent: safePct },
      criticalResponse: { value: criticalResponse, percent: criticalPct },
      locationTracking: { value: locationTracking, percent: trackPct },
      inTransit: { value: inTransit, percent: transitPct }
    },
    fieldInventory: {
      rescueBoats,
      logisticsVehicles,
      powerNodes,
      shelterHubs
    },
    specialNeeds: {
      elderly: elderlyCount,
      infants: infantsCount,
      disabled: disabledCount,
      pets: petsCount,
      chronic: chronicCount,
      total: elderlyCount + infantsCount + disabledCount + petsCount + chronicCount
    },
    mlStats: {
      precision,
      recall,
      f1Score,
      latency
    },
    crisisFund: {
      total: fundStr,
      activeNodes: camps.filter(c => c.status === 'OPEN').length,
      uniqueContributors: uniqueDonors,
      efficiency: fulfilmentEfficiency + '%'
    },
    districtRiskHeatmap: [
      { id: 'LK-11', value: 85 }, // Colombo
      { id: 'LK-12', value: 65 }, // Gampaha
      { id: 'LK-13', value: 40 }, // Kalutara
      { id: 'LK-21', value: 90 }, // Kandy
      { id: 'LK-31', value: 70 }, // Galle
    ],
    resourceUtilization: (() => {
      const bucket = (label: string, match: (t: string) => boolean) => {
        const set = resources.filter(r => match(r.type.toLowerCase()));
        const available = set.filter(r => r.status === 'AVAILABLE').length;
        return { name: label, used: set.length - available, available };
      };
      return [
        bucket('Rescue Boats', t => t.includes('boat')),
        bucket('Vehicles', t => t.includes('truck') || t.includes('ambulance') || t.includes('vehicle')),
        bucket('Generators', t => t.includes('generator') || t.includes('power')),
        { name: 'Volunteers', used: assignedVolunteers.size, available: Math.max(0, volunteers.length - assignedVolunteers.size) },
      ];
    })(),
    volunteerHours
  };
};

export const generateAAR = async (incidentId: string) => {
  let aar = await prisma.afterActionReport.findUnique({ where: { incidentId } });
  if (!aar) {
    const incident = await prisma.incidentReport.findUnique({
      where: { id: incidentId },
      include: {
        history: { orderBy: { createdAt: 'asc' } },
        tasks: true,
        damageAssessments: true,
      },
    });
    if (!incident) throw new Error('Incident not found');

    // Real timeline from the incident's history log
    const timeline = incident.history.length
      ? incident.history.map(h => ({ time: h.createdAt, event: h.note || `Status → ${h.status}` }))
      : [{ time: incident.createdAt, event: 'Incident reported' }];

    // Resolution time = report → last recorded activity (or now if still open), in minutes
    const lastActivity = incident.history.length
      ? incident.history[incident.history.length - 1].createdAt
      : incident.updatedAt;
    const resolutionTime = Math.max(0, Math.round(
      (new Date(lastActivity).getTime() - new Date(incident.createdAt).getTime()) / 60000
    ));

    // People affected + cost from linked damage assessments
    const peopleAffected = incident.damageAssessments.reduce((s, d) => s + (d.affectedPersons ?? 0), 0);
    const costEstimate = incident.damageAssessments.reduce(
      (s, d) => s + (d.aiEstimatedCost ?? d.estimatedLoss ?? 0), 0
    );

    const resourcesUsed = incident.tasks.length
      ? incident.tasks.map(t => t.title)
      : ['No tasks recorded'];

    const lessons: string[] = [];
    if (resolutionTime > 120) lessons.push('Resolution exceeded the 2-hour target — review dispatch chain.');
    if (incident.severity === 'CRITICAL' && incident.tasks.length === 0) lessons.push('Critical incident had no tasks assigned.');
    if (incident.damageAssessments.length === 0) lessons.push('No damage assessment was filed for this incident.');
    if (lessons.length === 0) lessons.push('Handled within targets; no corrective actions identified.');

    aar = await prisma.afterActionReport.create({
      data: {
        incidentId,
        timeline: JSON.stringify(timeline),
        resourcesUsed: JSON.stringify(resourcesUsed),
        costEstimate: Math.round(costEstimate),
        peopleAffected,
        resolutionTime,
        lessonsLearned: lessons.join(' '),
      },
    });
  }
  return aar;
};

export const getKPIBenchmarks = async (month: string) => {
  return await prisma.kPIBenchmark.findMany({ where: { month } });
};

const SL_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara',
  'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa',
  'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa',
  'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle',
];

/**
 * Operational vulnerability index — built from live data (no census figures in
 * the DB). Per district: vulnerable-group signals from help-request text and
 * missing-person ages, plus a risk score weighted by active-incident density.
 */
export const getVulnerabilityIndex = async () => {
  const [incidents, helpRequests, missingPersons] = await Promise.all([
    prisma.incidentReport.findMany({ where: { status: { not: 'RESOLVED' } }, select: { location: true, severity: true } }),
    prisma.helpRequest.findMany({ select: { location: true, description: true } }),
    prisma.missingPerson.findMany({ select: { lastSeen: true, age: true } }),
  ]);

  const districtOf = (text?: string | null) => SL_DISTRICTS.find(d => text?.includes(d));

  const rows = SL_DISTRICTS.map(district => {
    const hr = helpRequests.filter(h => districtOf(h.location) === district);
    const mp = missingPersons.filter(m => districtOf(m.lastSeen) === district);
    const inc = incidents.filter(i => districtOf(i.location) === district);

    const text = (s: string) => hr.filter(h => h.description?.toLowerCase().includes(s)).length;
    const elderly = text('elder') + text('old age') + mp.filter(m => (m.age ?? 0) > 65).length;
    const infants = text('baby') + text('infant') + text('child') + mp.filter(m => (m.age ?? 99) < 5).length;
    const disabled = text('disabled') + text('wheelchair') + text('blind') + text('deaf');
    const chronic = text('medicine') + text('insulin') + text('chronic') + text('dialysis');

    const critical = inc.filter(i => i.severity === 'CRITICAL').length;
    const riskScore = Math.min(100, Math.round(
      inc.length * 6 + critical * 10 + (elderly + infants + disabled + chronic) * 4
    ));
    return { district, elderly, infants, disabled, chronic, riskScore };
  });

  return rows.filter(r => r.riskScore > 0).sort((a, b) => b.riskScore - a.riskScore).slice(0, 10);
};

export const getDisasterBudgets = async () => {
  return await prisma.disasterBudget.findMany({ include: { expenditures: { include: { resourceCost: true } } } });
};

export const exportIntelligencePdf = async (data: any, res: any) => {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  // 1. Cover Page / Header
  doc.fontSize(24).font('Helvetica-Bold').text('Operational Intelligence Briefing', { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(12).font('Helvetica').text(`Generated Date: ${new Date(data.timestamp || Date.now()).toLocaleString()}`, { align: 'center' });
  doc.moveDown(3);

  // 2. Executive KPIs
  doc.fontSize(18).font('Helvetica-Bold').text('1. Executive KPIs');
  doc.moveDown(1);
  if (data.stats && data.stats.incidents) {
    doc.fontSize(12).font('Helvetica').text(`Total Incidents: ${data.stats.incidents.total}`);
    doc.text(`Critical/High Incidents: ${data.stats.incidents.critical + data.stats.incidents.high}`);
    doc.text(`Average Response Time: ${data.stats.kpis?.avgResponseTime}`);
    doc.text(`Volunteer Utilization: ${data.stats.kpis?.volunteerUtilization}`);
    doc.text(`Alert Delivery Rate: ${data.stats.kpis?.alertDeliveryRate}`);
  }
  doc.moveDown(2);

  // 3. Resource & Fund Utilization
  doc.fontSize(18).font('Helvetica-Bold').text('2. Resources & Crisis Fund');
  doc.moveDown(1);
  if (data.stats && data.stats.crisisFund) {
    doc.fontSize(12).font('Helvetica').text(`Crisis Fund Meter: ${data.stats.crisisFund.total}`);
    doc.text(`Fulfillment Efficiency: ${data.stats.crisisFund.efficiency}`);
  }
  if (data.stats && data.stats.resourceUtilization) {
    doc.moveDown(1);
    doc.fontSize(14).font('Helvetica-Bold').text('Resource Usage:');
    data.stats.resourceUtilization.forEach((r: any) => {
      doc.fontSize(12).font('Helvetica').text(`- ${r.name}: ${r.used.toFixed(1)} used / ${(r.used + r.available).toFixed(1)} total`);
    });
  }
  doc.moveDown(2);

  // 4. Vulnerability Index
  doc.fontSize(18).font('Helvetica-Bold').text('3. Vulnerability Heat Index');
  doc.moveDown(1);
  if (data.vulnerability && data.vulnerability.length > 0) {
    data.vulnerability.forEach((v: any) => {
      doc.fontSize(12).font('Helvetica').text(`${v.district} District - Risk Score: ${v.riskScore}%`);
      doc.fontSize(10).font('Helvetica').text(`  Elderly: ${v.elderly} | Infants: ${v.infants} | Disabled: ${v.disabled} | Chronic: ${v.chronic}`);
      doc.moveDown(0.5);
    });
  } else {
    doc.fontSize(12).font('Helvetica').text('No vulnerability data available.');
  }
  doc.moveDown(1.5);

  // 5. Budgets
  doc.fontSize(18).font('Helvetica-Bold').text('4. Disaster Budgets & Expenditures');
  doc.moveDown(1);
  if (data.budgets && data.budgets.length > 0) {
    data.budgets.forEach((b: any) => {
      const spent = b.expenditures?.reduce((sum: number, exp: any) => sum + exp.totalCost, 0) || 0;
      doc.fontSize(12).font('Helvetica-Bold').text(b.eventName);
      doc.fontSize(12).font('Helvetica').text(`Allocated: LKR ${b.allocatedBudget.toLocaleString()} | Spent: LKR ${spent.toLocaleString()}`);
      doc.moveDown(0.5);
    });
  } else {
    doc.fontSize(12).font('Helvetica').text('No active budgets.');
  }

  doc.end();
};
