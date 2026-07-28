import prisma from '../utils/prisma';

// ── Haversine distance in metres ────────────────────────────────────────────
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function totalKm(waypoints: [number, number][]): number {
  let km = 0;
  for (let i = 1; i < waypoints.length; i++) {
    km += haversineM(waypoints[i-1][0], waypoints[i-1][1], waypoints[i][0], waypoints[i][1]) / 1000;
  }
  return Math.round(km * 10) / 10;
}

// ── Quadratic Bézier route generation ───────────────────────────────────────
// deviationDeg shifts the midpoint perpendicular to the direct line.
// Positive = left of direction of travel, negative = right.
function generateRoute(
  from: [number, number],
  to:   [number, number],
  deviationDeg: number,
  numPoints = 10,
): [number, number][] {
  const dlat = to[0] - from[0];
  const dlng = to[1] - from[1];
  const len  = Math.sqrt(dlat ** 2 + dlng ** 2) || 1;

  // Unit perpendicular (90° CCW of direction of travel)
  const perpLat = -dlng / len;
  const perpLng =  dlat / len;

  // Control point at midpoint displaced laterally by deviationDeg
  const ctrlLat = (from[0] + to[0]) / 2 + deviationDeg * perpLat;
  const ctrlLng = (from[1] + to[1]) / 2 + deviationDeg * perpLng;

  const pts: [number, number][] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const lat = (1 - t) ** 2 * from[0] + 2 * (1 - t) * t * ctrlLat + t ** 2 * to[0];
    const lng = (1 - t) ** 2 * from[1] + 2 * (1 - t) * t * ctrlLng + t ** 2 * to[1];
    pts.push([lat, lng]);
  }
  return pts;
}

// ── Hazard model ─────────────────────────────────────────────────────────────
interface Hazard {
  id:         string;
  name:       string;
  type:       'INCIDENT' | 'FLOOD' | 'THREAT';
  severity:   string;
  lat:        number;
  lng:        number;
  radiusM:    number;  // hazard influence radius
  maxPenalty: number;  // penalty at 0m distance
}

// Score a single route — returns 0-100 (higher = safer)
function scoreRoute(waypoints: [number, number][], hazards: Hazard[]): {
  score: number;
  hazardsNearby: Array<{ name: string; type: string; distanceKm: number }>;
} {
  let totalPenalty = 0;
  const hitSet = new Map<string, { name: string; type: string; distanceKm: number }>();

  for (const [wLat, wLng] of waypoints) {
    for (const h of hazards) {
      const dist = haversineM(wLat, wLng, h.lat, h.lng);
      if (dist < h.radiusM) {
        const proximity = 1 - dist / h.radiusM; // 1 at 0 m, 0 at radiusM
        totalPenalty += h.maxPenalty * proximity;
        if (!hitSet.has(h.id)) {
          hitSet.set(h.id, { name: h.name, type: h.type, distanceKm: Math.round(dist / 100) / 10 });
        }
      }
    }
  }

  const avgPenalty = totalPenalty / waypoints.length;
  const score = Math.max(0, Math.min(100, Math.round(100 - avgPenalty)));
  return { score, hazardsNearby: Array.from(hitSet.values()) };
}

function riskLabel(score: number): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
  if (score >= 80) return 'LOW';
  if (score >= 60) return 'MODERATE';
  if (score >= 40) return 'HIGH';
  return 'CRITICAL';
}

// ── Main export ──────────────────────────────────────────────────────────────

export interface SafeRouteRequest {
  fromLat:    number;
  fromLng:    number;
  toLat?:     number;
  toLng?:     number;
  destType?:  'SAFE_ZONE' | 'CAMP' | 'CUSTOM';
}

export async function computeSafeRoutes(req: SafeRouteRequest) {
  const { fromLat, fromLng } = req;

  // ── 1. Determine destination ─────────────────────────────────────────────
  let destLat: number;
  let destLng: number;
  let destName: string;
  let destType: string;

  if (req.toLat != null && req.toLng != null && req.destType === 'CUSTOM') {
    destLat  = req.toLat;
    destLng  = req.toLng;
    destName = 'Custom Destination';
    destType = 'CUSTOM';
  } else if (req.destType === 'CAMP') {
    // Nearest relief camp
    const camps = await prisma.reliefCamp.findMany({ where: { status: 'OPEN' } });
    const nearest = camps
      .filter(c => c.latitude && c.longitude)
      .map(c => ({ ...c, dist: haversineM(fromLat, fromLng, c.latitude!, c.longitude!) }))
      .sort((a, b) => a.dist - b.dist)[0];
    if (!nearest) throw new Error('No open relief camps found');
    destLat  = nearest.latitude!;
    destLng  = nearest.longitude!;
    destName = nearest.name;
    destType = 'CAMP';
  } else {
    // Default: nearest safe place (public safe zone)
    const places = await prisma.publicSafePlace.findMany();
    const nearest = places
      .map(p => ({ ...p, dist: haversineM(fromLat, fromLng, p.latitude, p.longitude) }))
      .sort((a, b) => a.dist - b.dist)[0];
    if (!nearest) {
      // Fallback to nearest camp
      const camps = await prisma.reliefCamp.findMany();
      const camp  = camps
        .filter(c => c.latitude && c.longitude)
        .map(c => ({ ...c, dist: haversineM(fromLat, fromLng, c.latitude!, c.longitude!) }))
        .sort((a, b) => a.dist - b.dist)[0];
      if (!camp) throw new Error('No safe destinations found');
      destLat = camp.latitude!;
      destLng = camp.longitude!;
      destName = camp.name;
      destType = 'CAMP';
    } else {
      destLat  = nearest.latitude;
      destLng  = nearest.longitude;
      destName = nearest.name;
      destType = 'SAFE_ZONE';
    }
  }

  // ── 2. Gather hazards ────────────────────────────────────────────────────
  const [incidents, rivers, threats] = await Promise.all([
    prisma.incidentReport.findMany({
      where: {
        latitude:  { not: null },
        longitude: { not: null },
        severity:  { in: ['CRITICAL', 'HIGH', 'MEDIUM'] },
        status:    { notIn: ['RESOLVED'] },
      },
      select: { id: true, title: true, severity: true, latitude: true, longitude: true },
    }),
    prisma.riverWaterLevel.findMany({
      where: { status: { in: ['MAJOR_FLOOD', 'MINOR_FLOOD', 'ALERT'] } },
      select: { id: true, riverName: true, stationName: true, status: true, latitude: true, longitude: true },
    }),
    prisma.threatProjection.findMany({
      where: { active: true },
      select: { id: true, name: true, riskLevel: true, polygonCoords: true },
    }),
  ]);

  const hazards: Hazard[] = [];

  incidents.forEach(i => {
    if (!i.latitude || !i.longitude) return;
    const { maxPenalty, radiusM } =
      i.severity === 'CRITICAL' ? { maxPenalty: 35, radiusM: 2500 } :
      i.severity === 'HIGH'     ? { maxPenalty: 20, radiusM: 2000 } :
                                  { maxPenalty:  8, radiusM: 1200 };
    hazards.push({ id: i.id, name: i.title, type: 'INCIDENT', severity: i.severity!, lat: i.latitude, lng: i.longitude, radiusM, maxPenalty });
  });

  rivers.forEach(r => {
    const { maxPenalty, radiusM } =
      r.status === 'MAJOR_FLOOD' ? { maxPenalty: 40, radiusM: 3000 } :
      r.status === 'MINOR_FLOOD' ? { maxPenalty: 25, radiusM: 2000 } :
                                   { maxPenalty: 10, radiusM: 1500 };
    hazards.push({ id: r.id, name: `${r.riverName} @ ${r.stationName}`, type: 'FLOOD', severity: r.status, lat: r.latitude, lng: r.longitude, radiusM, maxPenalty });
  });

  // Threat projections: use centroid of polygon coords
  threats.forEach(t => {
    try {
      const coords: number[][] = Array.isArray(t.polygonCoords) ? t.polygonCoords : JSON.parse(t.polygonCoords as any);
      if (!coords.length) return;
      const avgLat = coords.reduce((s, c) => s + c[0], 0) / coords.length;
      const avgLng = coords.reduce((s, c) => s + c[1], 0) / coords.length;
      hazards.push({ id: t.id, name: t.name, type: 'THREAT', severity: t.riskLevel, lat: avgLat, lng: avgLng, radiusM: 3000, maxPenalty: 20 });
    } catch { /* skip malformed */ }
  });

  // ── 3. Generate 3 candidate routes ───────────────────────────────────────
  const directDistKm = haversineM(fromLat, fromLng, destLat, destLng) / 1000;
  // Deviation scales with distance — 6% of straight-line distance, minimum 0.02°
  const devDeg = Math.max(0.02, directDistKm * 0.008);

  const candidates: { name: string; deviation: number; color: string }[] = [
    { name: 'Direct',      deviation: 0,       color: '#2563eb' },
    { name: 'Via Left',    deviation: +devDeg, color: '#16a34a' },
    { name: 'Via Right',   deviation: -devDeg, color: '#d97706' },
  ];

  const from: [number, number] = [fromLat, fromLng];
  const to:   [number, number] = [destLat, destLng];

  const routes = candidates.map(({ name, deviation, color }) => {
    const waypoints = generateRoute(from, to, deviation);
    const { score, hazardsNearby } = scoreRoute(waypoints, hazards);
    const km = totalKm(waypoints);
    return {
      name,
      color,
      waypoints,
      score,
      risk:          riskLabel(score),
      estimatedKm:   km,
      hazardsNearby,
    };
  });

  // Sort: safest first
  routes.sort((a, b) => b.score - a.score);

  // Rename based on final ranking
  const rankNames = ['Primary Safe Route', 'Alternate Route', 'Third Option'];
  routes.forEach((r, i) => { r.name = rankNames[i]; });

  return {
    from:        { lat: fromLat, lng: fromLng },
    destination: { name: destName, lat: destLat, lng: destLng, type: destType },
    routes,
    hazards: hazards.map(h => ({
      id: h.id, name: h.name, type: h.type, severity: h.severity,
      lat: h.lat, lng: h.lng, radiusM: h.radiusM,
    })),
    directDistKm: Math.round(directDistKm * 10) / 10,
    generatedAt: new Date(),
  };
}
