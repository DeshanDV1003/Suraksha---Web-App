import prisma from '../utils/prisma';

export interface SearchHit {
  id: string;
  type: string;      // category label shown in the UI
  title: string;
  subtitle?: string;
  badge?: string;
  path: string;      // frontend route to open
  score: number;
}

const PER_CATEGORY = 6;
const STAFF_ROLES = ['ADMIN', 'DMC_OFFICER', 'FIELD_RESPONDER'];

/**
 * System-wide search. Runs one bounded query per entity in parallel, maps each
 * to a common hit shape, then ranks by title-match quality. Staff-only entities
 * (people, donations, hospitals, damage) are skipped for citizen/volunteer roles.
 */
export async function globalSearch(rawQ: string, role?: string): Promise<SearchHit[]> {
  const q = rawQ.trim();
  if (q.length < 2) return [];

  const c = { contains: q, mode: 'insensitive' as const };
  const staff = !!role && STAFF_ROLES.includes(role);

  const jobs: Promise<SearchHit[]>[] = [
    prisma.incidentReport.findMany({
      where: { OR: [{ title: c }, { description: c }, { location: c }, { category: c }] },
      orderBy: { createdAt: 'desc' }, take: PER_CATEGORY,
      select: { id: true, title: true, category: true, location: true, severity: true },
    }).then(rows => rows.map(r => ({
      id: r.id, type: 'Incidents', title: r.title || 'Untitled incident',
      subtitle: [r.category, r.location].filter(Boolean).join(' · '),
      badge: r.severity, path: '/incidents', score: 3,
    }))),

    prisma.alert.findMany({
      where: { OR: [{ title: c }, { message: c }, { locations: { has: q } }] },
      orderBy: { createdAt: 'desc' }, take: PER_CATEGORY,
      select: { id: true, title: true, message: true, type: true },
    }).then(rows => rows.map(r => ({
      id: r.id, type: 'Alerts', title: r.title || 'Alert',
      subtitle: r.message?.slice(0, 90), badge: r.type, path: '/suraksha-alerts', score: 3,
    }))),

    prisma.reliefCamp.findMany({
      where: { OR: [{ name: c }, { location: c }] }, take: PER_CATEGORY,
      select: { id: true, name: true, location: true, status: true, currentOccupancy: true, totalCapacity: true },
    }).then(rows => rows.map(r => ({
      id: r.id, type: 'Relief Camps', title: r.name,
      subtitle: `${r.location} · ${r.currentOccupancy}/${r.totalCapacity} occupancy`,
      badge: r.status, path: '/camps', score: 2,
    }))),

    prisma.missingPerson.findMany({
      where: { OR: [{ name: c }, { lastSeen: c }, { nic: c }, { contactName: c }] }, take: PER_CATEGORY,
      select: { id: true, name: true, lastSeen: true, age: true, status: true },
    }).then(rows => rows.map(r => ({
      id: r.id, type: 'Missing Persons', title: r.name || 'Unknown',
      subtitle: `Last seen: ${r.lastSeen || '—'}${r.age ? ` · Age ${r.age}` : ''}`,
      badge: r.status, path: '/missing-persons', score: 2,
    }))),

    prisma.helpRequest.findMany({
      where: { OR: [{ description: c }, { location: c }, { type: c }] },
      orderBy: { createdAt: 'desc' }, take: PER_CATEGORY,
      select: { id: true, description: true, type: true, location: true, status: true },
    }).then(rows => rows.map(r => ({
      id: r.id, type: 'Help Requests', title: r.description?.slice(0, 60) || 'Help request',
      subtitle: `${r.type || 'General'} · ${r.location || '—'}`, badge: r.status, path: '/help-requests', score: 2,
    }))),

    prisma.resource.findMany({
      where: { OR: [{ type: c }, { owner: c }, { location: c }] }, take: PER_CATEGORY,
      select: { id: true, type: true, owner: true, location: true, status: true },
    }).then(rows => rows.map(r => ({
      id: r.id, type: 'Resources', title: r.type,
      subtitle: `${r.owner} · ${r.location}`, badge: r.status, path: '/resources', score: 1,
    }))),

    prisma.task.findMany({
      where: { OR: [{ title: c }, { description: c }] },
      orderBy: { createdAt: 'desc' }, take: PER_CATEGORY,
      select: { id: true, title: true, description: true, status: true },
    }).then(rows => rows.map(r => ({
      id: r.id, type: 'Tasks', title: r.title,
      subtitle: r.description?.slice(0, 80), badge: r.status, path: '/tasks', score: 1,
    }))),

    prisma.riverWaterLevel.findMany({
      where: { OR: [{ riverName: c }, { stationName: c }, { district: c }] },
      distinct: ['gaugeId'], orderBy: { recordedAt: 'desc' }, take: PER_CATEGORY,
      select: { gaugeId: true, riverName: true, stationName: true, district: true, status: true },
    }).then(rows => rows.map(r => ({
      id: r.gaugeId, type: 'Water Monitor', title: `${r.riverName} @ ${r.stationName}`,
      subtitle: r.district, badge: r.status, path: '/water-monitor', score: 1,
    }))),

    prisma.publicSafePlace.findMany({
      where: { OR: [{ name: c }, { district: c }, { address: c }, { type: c }] }, take: PER_CATEGORY,
      select: { id: true, name: true, type: true, district: true },
    }).then(rows => rows.map(r => ({
      id: r.id, type: 'Safe Places', title: r.name,
      subtitle: `${r.type} · ${r.district}`, path: '/map', score: 1,
    }))),

    prisma.authorityContact.findMany({
      where: { OR: [{ name: c }, { role: c }, { district: c }, { phone: c }] }, take: PER_CATEGORY,
      select: { id: true, name: true, role: true, district: true, phone: true },
    }).then(rows => rows.map(r => ({
      id: r.id, type: 'Support Contacts', title: r.name,
      subtitle: `${r.role} · ${r.district} · ${r.phone}`, path: '/support', score: 1,
    }))),
  ];

  if (staff) {
    jobs.push(
      prisma.user.findMany({
        where: { OR: [{ name: c }, { email: c }, { phone: c }, { nic: c }, { region: c }] }, take: PER_CATEGORY,
        select: { id: true, name: true, email: true, role: true, region: true },
      }).then(rows => rows.map(r => ({
        id: r.id, type: 'People', title: r.name,
        subtitle: `${r.role} · ${r.email}${r.region ? ` · ${r.region}` : ''}`,
        badge: r.role, path: r.role === 'VOLUNTEER' ? '/volunteers' : '/users', score: 1,
      }))),

      prisma.donation.findMany({
        where: { OR: [{ donorName: c }, { itemsDescription: c }, { transactionId: c }] },
        orderBy: { createdAt: 'desc' }, take: PER_CATEGORY,
        select: { id: true, donorName: true, amount: true, itemsDescription: true },
      }).then(rows => rows.map(r => ({
        id: r.id, type: 'Donations', title: r.donorName,
        subtitle: r.amount ? `LKR ${r.amount.toLocaleString()}` : (r.itemsDescription?.slice(0, 60) || 'Donation'),
        path: '/donations', score: 1,
      }))),

      prisma.hospital.findMany({
        where: { OR: [{ name: c }, { location: c }] }, take: PER_CATEGORY,
        select: { id: true, name: true, location: true, availableBeds: true, totalBeds: true },
      }).then(rows => rows.map(r => ({
        id: r.id, type: 'Hospitals', title: r.name,
        subtitle: `${r.location} · ${r.availableBeds}/${r.totalBeds} beds`,
        path: '/hospital/capacity', score: 1,
      }))),

      prisma.damageAssessment.findMany({
        where: { OR: [{ location: c }, { notes: c }] },
        orderBy: { createdAt: 'desc' }, take: PER_CATEGORY,
        select: { id: true, location: true, category: true, estimatedLoss: true },
      }).then(rows => rows.map(r => ({
        id: r.id, type: 'Damage Assessments', title: r.location,
        subtitle: r.estimatedLoss ? `Est. loss LKR ${r.estimatedLoss.toLocaleString()}` : undefined,
        badge: r.category, path: '/damage-assessment', score: 1,
      }))),
    );
  }

  const settled = await Promise.allSettled(jobs);
  const hits: SearchHit[] = [];
  for (const s of settled) if (s.status === 'fulfilled') hits.push(...s.value);

  // Relevance: exact > prefix > substring title match
  const lq = q.toLowerCase();
  for (const h of hits) {
    const t = h.title.toLowerCase();
    if (t === lq) h.score += 10;
    else if (t.startsWith(lq)) h.score += 5;
    else if (t.includes(lq)) h.score += 2;
  }
  hits.sort((a, b) => b.score - a.score);

  // Collapse near-duplicates (e.g. repeated auto-generated flood alerts) — keep
  // the best-ranked hit per (category, title).
  const seen = new Set<string>();
  const deduped: SearchHit[] = [];
  for (const h of hits) {
    const key = `${h.type}::${h.title.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(h);
  }
  return deduped.slice(0, 40);
}
