import prisma from '../utils/prisma';

const DAY_MS = 86_400_000;
const SLA_MINUTES = 30; // an incident not actioned within 30 min counts as an SLA breach

const SL_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle',
];
const LANDSLIDE_PRONE = ['Ratnapura', 'Kegalle', 'Badulla', 'Nuwara Eliya', 'Kandy', 'Kalutara', 'Matale'];

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const districtsIn = (loc?: string | null) =>
  loc ? SL_DISTRICTS.filter(d => loc.includes(d)) : [];

/**
 * Header stat-card badges: real "new in the last 7 days" counts. Unambiguous
 * additions rather than net deltas, so the badge never contradicts the total.
 */
async function computeTrends() {
  const since7 = new Date(Date.now() - 7 * DAY_MS);

  const [incNew, volNew, campNew, helpNew] = await Promise.all([
    prisma.incidentReport.count({ where: { createdAt: { gte: since7 } } }),
    prisma.user.count({ where: { role: 'VOLUNTEER', createdAt: { gte: since7 } } }),
    prisma.reliefCamp.count({ where: { createdAt: { gte: since7 } } }),
    prisma.helpRequest.count({ where: { createdAt: { gte: since7 } } }),
  ]);

  const badge = (n: number) => ({ value: n > 0 ? `+${n}` : '0', isUp: n > 0 });

  return {
    incidents: badge(incNew),
    volunteers: badge(volNew),
    camps: badge(campNew),
    helpRequests: badge(helpNew),
  };
}

/**
 * Data-driven 72-hour threat outlook. Composite risk per district from three
 * live signals: recent rainfall accumulation, ML river-level predictions, and
 * active-incident density. Replaces the old static seed rows.
 */
async function computeThreatForecasts() {
  const now = Date.now();

  const [rain, preds, gauges, activeInc] = await Promise.all([
    prisma.rainfallReading.findMany({
      where: { recordedAt: { gte: new Date(now - DAY_MS) } },
      orderBy: { recordedAt: 'desc' },
      select: { district: true, cumulativeRain24h: true, cumulativeRain72h: true, riskLevel: true },
    }),
    prisma.waterLevelPrediction.findMany({
      select: { gaugeId: true, alertLevel: true, confidence: true },
    }),
    prisma.riverWaterLevel.findMany({
      distinct: ['gaugeId'],
      select: { gaugeId: true, district: true },
    }),
    prisma.incidentReport.findMany({
      where: { status: { not: 'RESOLVED' } },
      select: { location: true, severity: true },
    }),
  ]);

  // Signal 1 — latest rainfall snapshot per district
  const rainByDistrict = new Map<string, { r72: number; risk: string }>();
  for (const r of rain) {
    if (!rainByDistrict.has(r.district)) {
      rainByDistrict.set(r.district, { r72: r.cumulativeRain72h, risk: r.riskLevel });
    }
  }

  // Signal 2 — worst river alert level per district
  const gaugeDistrict = new Map(gauges.map(g => [g.gaugeId, g.district]));
  const waterRank: Record<string, number> = { NONE: 0, WATCH: 1, WARNING: 2, CRITICAL: 3 };
  const waterByDistrict = new Map<string, { level: string; conf: number }>();
  for (const p of preds) {
    const d = gaugeDistrict.get(p.gaugeId);
    if (!d) continue;
    const prev = waterByDistrict.get(d);
    if (!prev || (waterRank[p.alertLevel] ?? 0) > (waterRank[prev.level] ?? 0)) {
      waterByDistrict.set(d, { level: p.alertLevel, conf: p.confidence });
    }
  }

  // Signal 3 — active-incident pressure per district (CRITICAL counts double)
  const incByDistrict = new Map<string, number>();
  for (const inc of activeInc) {
    for (const d of districtsIn(inc.location)) {
      incByDistrict.set(d, (incByDistrict.get(d) ?? 0) + (inc.severity === 'CRITICAL' ? 2 : 1));
    }
  }

  const rainRisk: Record<string, number> = { NORMAL: 0, WATCH: 0.1, WARNING: 0.25, DANGER: 0.4 };
  const waterRisk: Record<string, number> = { NONE: 0, WATCH: 0.2, WARNING: 0.35, CRITICAL: 0.5 };

  const scored = SL_DISTRICTS.map(district => {
    const rn = rainByDistrict.get(district);
    const wt = waterByDistrict.get(district);
    const ic = incByDistrict.get(district) ?? 0;

    let score = 0;
    let threatType = 'Flood Risk';

    if (rn) {
      score += Math.min(0.4, rn.r72 / 300); // ~300 mm / 72 h ≈ severe
      score += rainRisk[rn.risk] ?? 0;
    }
    if (wt) {
      score += (waterRisk[wt.level] ?? 0) * (0.6 + 0.4 * wt.conf);
      if (wt.level !== 'NONE') threatType = 'River Flooding';
    }
    score += Math.min(0.25, ic * 0.05);
    if (ic > 0 && !rn && !wt) threatType = 'Elevated Incident Activity';

    if (LANDSLIDE_PRONE.includes(district) && rn && rn.r72 > 50) {
      threatType = 'Landslide Risk';
      score += 0.1;
    }

    return { district, threatType, score };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored.map((s, i) => ({
    district: s.district,
    threatType: s.threatType,
    confidence: clamp01(0.4 + s.score * 0.55),
    severity: s.score > 0.55 ? 'CRITICAL' : s.score > 0.3 ? 'HIGH' : 'MEDIUM',
    forecastTime: new Date(now + (12 + i * 6) * 3_600_000).toISOString(),
  }));
}

export const getDashboardStats = async () => {
  const now = Date.now();

  const [
    incidents,
    volunteers,
    camps,
    helpRequests,
    missingPersons,
    alerts,
    latestShift,
    resources,
    trends,
    threatForecasts,
  ] = await Promise.all([
    prisma.incidentReport.findMany({ where: { status: { not: 'RESOLVED' } } }),
    prisma.user.count({ where: { role: 'VOLUNTEER' } }),
    prisma.reliefCamp.count(),
    prisma.helpRequest.count(),
    prisma.missingPerson.count(),
    prisma.alert.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    prisma.shiftHandover.findFirst({ orderBy: { shiftTime: 'desc' } }),
    prisma.resource.findMany(),
    computeTrends(),
    computeThreatForecasts(),
  ]);

  // ── Response-time stats (real) ─────────────────────────────────────────────
  const respondedIncidents = await prisma.incidentReport.findMany({
    where: { status: { in: ['IN_PROGRESS', 'RESOLVED', 'ASSIGNED', 'EN_ROUTE', 'ON_SITE'] } },
    select: { createdAt: true, updatedAt: true },
  });

  const responseMinutes = respondedIncidents.map(
    inc => (new Date(inc.updatedAt).getTime() - new Date(inc.createdAt).getTime()) / 60000,
  );

  let avgResponseTime = '0m';
  let avgResponseMinutes = 0;
  if (responseMinutes.length > 0) {
    avgResponseMinutes = Math.round(responseMinutes.reduce((a, b) => a + b, 0) / responseMinutes.length);
    avgResponseTime = avgResponseMinutes > 60
      ? `${Math.floor(avgResponseMinutes / 60)}h ${avgResponseMinutes % 60}m`
      : `${avgResponseMinutes}m`;
  }

  const slaBreaches = responseMinutes.filter(m => m > SLA_MINUTES).length;

  // Response-time trend — real average per calendar week over the last 7 weeks
  const WEEK_MS = 7 * DAY_MS;
  const weekBuckets: { start: number; end: number; label: string; vals: number[] }[] = [];
  for (let i = 6; i >= 0; i--) {
    const end = now - i * WEEK_MS;
    const start = end - WEEK_MS;
    weekBuckets.push({
      start,
      end,
      label: new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      vals: [],
    });
  }
  const recentResponded = await prisma.incidentReport.findMany({
    where: {
      status: { in: ['IN_PROGRESS', 'RESOLVED', 'ASSIGNED', 'EN_ROUTE', 'ON_SITE'] },
      updatedAt: { gte: new Date(now - 7 * WEEK_MS) },
    },
    select: { createdAt: true, updatedAt: true },
  });
  for (const inc of recentResponded) {
    const ts = inc.updatedAt.getTime();
    const bucket = weekBuckets.find(b => ts >= b.start && ts < b.end);
    if (bucket) bucket.vals.push((ts - inc.createdAt.getTime()) / 60000);
  }
  const responseTimeTrend = weekBuckets.map(b => ({
    day: b.label,
    time: b.vals.length ? Math.round(b.vals.reduce((a, c) => a + c, 0) / b.vals.length) : 0,
  }));

  // Response-time trend badge — last 7 days vs the 7 before that
  const [avgRecent, avgPrev] = await Promise.all([
    prisma.incidentReport.findMany({
      where: {
        status: { in: ['IN_PROGRESS', 'RESOLVED', 'ASSIGNED', 'EN_ROUTE', 'ON_SITE'] },
        updatedAt: { gte: new Date(now - 7 * DAY_MS) },
      },
      select: { createdAt: true, updatedAt: true },
    }),
    prisma.incidentReport.findMany({
      where: {
        status: { in: ['IN_PROGRESS', 'RESOLVED', 'ASSIGNED', 'EN_ROUTE', 'ON_SITE'] },
        updatedAt: { gte: new Date(now - 14 * DAY_MS), lt: new Date(now - 7 * DAY_MS) },
      },
      select: { createdAt: true, updatedAt: true },
    }),
  ]);
  const meanMin = (rows: { createdAt: Date; updatedAt: Date }[]) =>
    rows.length ? rows.reduce((s, r) => s + (r.updatedAt.getTime() - r.createdAt.getTime()) / 60000, 0) / rows.length : 0;
  const responseDelta = Math.round(meanMin(avgRecent) - meanMin(avgPrev));
  const responseTrend = avgPrev.length
    ? { value: `${responseDelta > 0 ? '+' : ''}${responseDelta}m`, isUp: responseDelta > 0 }
    : { value: '—', isUp: false };

  // ── Secondary stats (real) ────────────────────────────────────────────────
  const [
    resourcesTotal,
    resourcesBoats,
    resourcesVehicles,
    familyUpdatesTotal,
    familyUpdatesSafe,
    tokenClaimsTotal,
    duplicatesPrevented,
  ] = await Promise.all([
    prisma.resource.count(),
    prisma.resource.count({ where: { type: { contains: 'BOAT', mode: 'insensitive' } } }),
    prisma.resource.count({ where: { type: { contains: 'VEHICLE', mode: 'insensitive' } } }),
    prisma.safetyCheckIn.count(),
    prisma.safetyCheckIn.count({ where: { status: 'SAFE', createdAt: { gte: new Date(now - DAY_MS) } } }),
    prisma.reliefTokenClaim.count(),
    prisma.incidentDuplicateLink.count(),
  ]);

  // ── Resource balance by district (real, dynamic) ──────────────────────────
  const activeDistricts = [
    ...new Set([
      ...resources.flatMap(r => districtsIn(r.location)),
      ...incidents.flatMap(i => districtsIn(i.location)),
    ]),
  ];
  const balanceDistricts = (activeDistricts.length ? activeDistricts : ['Colombo', 'Gampaha', 'Kalutara', 'Galle'])
    .slice(0, 6);
  const resourceBalance = balanceDistricts.map(district => ({
    district,
    resources: resources.filter(r => r.location?.includes(district)).length,
    incidents: incidents.filter(i => i.location?.includes(district)).length,
  }));

  return {
    activeIncidents: incidents.length,
    volunteersActive: volunteers,
    reliefCamps: camps,
    helpRequests,
    missingPersons,
    avgResponseTime,
    avgResponseMinutes,
    slaBreaches,
    trends: { ...trends, responseTime: responseTrend },
    secondaryStats: {
      resourcesTotal,
      resourcesBoats,
      resourcesVehicles,
      familyUpdatesTotal,
      familyUpdatesSafe,
      tokenClaimsTotal,
      duplicatesPrevented,
    },
    recentIncidents: incidents.slice(0, 5),
    recentAlerts: alerts,
    threatForecasts,
    latestShift,
    responseTimeTrend,
    resourceBalance,
  };
};
