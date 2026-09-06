import prisma from '../utils/prisma';

// ── Scoring weights (must sum to 100) ────────────────────────────────────────
const WEIGHT_LOCATION = 40;  // within 1 km
const WEIGHT_CATEGORY = 30;  // exact category match
const WEIGHT_TIME     = 20;  // within 6 hours
const WEIGHT_NLP      = 10;  // shared NLP entities

const LOCATION_THRESHOLD_M  = 1000;  // 1 km
const TIME_WINDOW_MS         = 6 * 60 * 60 * 1000;  // 6 hours
const MIN_SCORE_TO_SAVE      = 50;   // only persist links with score ≥ 50

function haversineMetres(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nlpEntityOverlap(a: any, b: any): number {
  if (!a || !b) return 0;
  const extractNames = (entities: any): Set<string> => {
    const names = new Set<string>();
    if (Array.isArray(entities)) {
      entities.forEach((e: any) => {
        if (e?.text) names.add(String(e.text).toLowerCase());
        if (e?.value) names.add(String(e.value).toLowerCase());
      });
    } else if (typeof entities === 'object') {
      Object.values(entities).flat().forEach((e: any) => {
        if (typeof e === 'string') names.add(e.toLowerCase());
        else if (e?.text) names.add(String(e.text).toLowerCase());
      });
    }
    return names;
  };

  const setA = extractNames(a);
  const setB = extractNames(b);
  if (setA.size === 0 || setB.size === 0) return 0;

  let overlap = 0;
  setA.forEach(v => { if (setB.has(v)) overlap++; });
  return overlap / Math.max(setA.size, setB.size);
}

/**
 * Run after a new incident is saved. Finds similar existing reports and
 * persists IncidentDuplicateLink rows for any pair scoring ≥ MIN_SCORE_TO_SAVE.
 * This is always called fire-and-forget — never awaited from the controller.
 */
export async function detectAndSaveDuplicates(newIncident: any): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - TIME_WINDOW_MS);

    // Fetch candidates: same category, created within the time window, not itself
    const candidates = await prisma.incidentReport.findMany({
      where: {
        id:        { not: newIncident.id },
        category:  newIncident.category,
        createdAt: { gte: cutoff },
        status:    { notIn: ['RESOLVED'] },
      },
      select: {
        id: true, latitude: true, longitude: true,
        category: true, createdAt: true, nlpEntities: true,
      },
    });

    for (const candidate of candidates) {
      // Avoid creating duplicate links if one already exists in either direction
      const existing = await prisma.incidentDuplicateLink.findFirst({
        where: {
          OR: [
            { reportId: newIncident.id, canonicalId: candidate.id },
            { reportId: candidate.id,   canonicalId: newIncident.id },
          ],
        },
      });
      if (existing) continue;

      let score = 0;
      const reasons: string[] = [];
      let distanceM: number | null = null;

      // 1. Location proximity
      if (
        newIncident.latitude != null && newIncident.longitude != null &&
        candidate.latitude   != null && candidate.longitude   != null
      ) {
        distanceM = haversineMetres(
          newIncident.latitude, newIncident.longitude,
          candidate.latitude,   candidate.longitude,
        );
        if (distanceM <= LOCATION_THRESHOLD_M) {
          // Scale: full points at 0m, tapering to 0 at threshold
          const locationScore = WEIGHT_LOCATION * (1 - distanceM / LOCATION_THRESHOLD_M);
          score += locationScore;
          reasons.push('LOCATION');
        }
      }

      // 2. Category (already filtered, so always true here — award full points)
      score += WEIGHT_CATEGORY;
      reasons.push('CATEGORY');

      // 3. Time proximity
      const ageDiff = Math.abs(
        new Date(newIncident.createdAt).getTime() - new Date(candidate.createdAt).getTime(),
      );
      if (ageDiff <= TIME_WINDOW_MS) {
        const timeScore = WEIGHT_TIME * (1 - ageDiff / TIME_WINDOW_MS);
        score += timeScore;
        reasons.push('TIME');
      }

      // 4. NLP entity overlap
      const overlap = nlpEntityOverlap(newIncident.nlpEntities, candidate.nlpEntities);
      if (overlap > 0) {
        score += WEIGHT_NLP * overlap;
        reasons.push('NLP');
      }

      if (score < MIN_SCORE_TO_SAVE) continue;

      // The older report is the "canonical" (primary); the newer is the possible duplicate
      const isNewNewer =
        new Date(newIncident.createdAt) >= new Date(candidate.createdAt);
      const reportId    = isNewNewer ? newIncident.id : candidate.id;
      const canonicalId = isNewNewer ? candidate.id   : newIncident.id;

      await prisma.incidentDuplicateLink.create({
        data: {
          reportId,
          canonicalId,
          score:    Math.round(score),
          distanceM,
          reasons,
          status:   'PENDING',
        },
      });

      console.log(
        `[DupDetect] Linked #${reportId.slice(0,6)} → #${canonicalId.slice(0,6)} ` +
        `score=${Math.round(score)} reasons=[${reasons.join(',')}]`,
      );
    }
  } catch (err: any) {
    console.error('[DupDetect] Error during detection:', err.message);
  }
}

/**
 * Fetch all duplicate links for a specific incident (as either report or canonical).
 */
export async function getDuplicateLinksForIncident(incidentId: string) {
  return prisma.incidentDuplicateLink.findMany({
    where: {
      OR: [
        { reportId:    incidentId },
        { canonicalId: incidentId },
      ],
    },
    include: {
      report:    { select: { id: true, title: true, location: true, category: true, severity: true, createdAt: true } },
      canonical: { select: { id: true, title: true, location: true, category: true, severity: true, createdAt: true } },
    },
    orderBy: { score: 'desc' },
  });
}

/**
 * Fetch all PENDING duplicate links (admin dashboard view).
 */
export async function getAllPendingDuplicateLinks() {
  return prisma.incidentDuplicateLink.findMany({
    where: { status: 'PENDING' },
    include: {
      report:    { select: { id: true, title: true, location: true, category: true, severity: true, createdAt: true } },
      canonical: { select: { id: true, title: true, location: true, category: true, severity: true, createdAt: true } },
    },
    orderBy: { score: 'desc' },
  });
}

/**
 * Update the status of a duplicate link: CONFIRMED or DISMISSED.
 */
export async function updateDuplicateLinkStatus(linkId: string, status: 'CONFIRMED' | 'DISMISSED') {
  return prisma.incidentDuplicateLink.update({
    where: { id: linkId },
    data:  { status },
  });
}

// ─── Exposed for unit tests (no behavioural impact) ───────────────────────────
export const __test__ = { haversineMetres, nlpEntityOverlap };
