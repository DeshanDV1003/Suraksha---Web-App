import prisma from '../utils/prisma';

export const createEvacuationRoute = async (data: any) => {
  return prisma.evacuationRoute.create({ data });
};

export const getEvacuationRoutes = async () => {
  return prisma.evacuationRoute.findMany({ orderBy: { updatedAt: 'desc' } });
};

export const createVolunteerLocation = async (data: any) => {
  return prisma.volunteerLocation.create({ data });
};

export const getVolunteerLocations = async () => {
  const locs = await prisma.volunteerLocation.findMany({ orderBy: { updatedAt: 'desc' } });
  const ids = [...new Set(locs.map(l => l.volunteerId))];
  const users = ids.length
    ? await prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, role: true, isFieldActive: true },
      })
    : [];
  const byId = new Map(users.map(u => [u.id, u]));
  return locs.map(l => ({ ...l, user: byId.get(l.volunteerId) ?? null }));
};

export const createThreatProjection = async (data: any) => {
  return prisma.threatProjection.create({ data });
};

export const getThreatProjections = async () => {
  return prisma.threatProjection.findMany({ where: { active: true } });
};

// Normalise whatever the client sends into a list of named routes with
// [lat, lng] waypoint pairs. Accepts either the real DB shape
// ({ routes: [{ name, type, status, coordinates: [{lat,lng}] }] }) or a bare
// array of those, or the legacy { primary: [[lat,lng]], alternate: [[lat,lng]] }.
function normaliseRoutes(routeData: any): Array<{ name: string; meta?: string; points: [number, number][] }> {
  const toPairs = (coords: any[]): [number, number][] =>
    (coords || [])
      .map((c: any) => (Array.isArray(c) ? c : [c?.lat, c?.lng]))
      .filter((p: any) => typeof p[0] === 'number' && typeof p[1] === 'number') as [number, number][];

  const list = Array.isArray(routeData) ? routeData : routeData?.routes;
  if (Array.isArray(list)) {
    return list.map((r: any, i: number) => ({
      name: r.name || `Route ${i + 1}`,
      meta: [r.type, r.status].filter(Boolean).join(' · ') || undefined,
      points: toPairs(r.coordinates || r.waypoints),
    }));
  }
  const out: Array<{ name: string; meta?: string; points: [number, number][] }> = [];
  if (routeData?.primary) out.push({ name: 'Primary Route', points: toPairs(routeData.primary) });
  if (routeData?.alternate) out.push({ name: 'Alternate Route', points: toPairs(routeData.alternate) });
  return out;
}

export const exportRoutePdf = async (routeData: any, res: any) => {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  doc.fontSize(24).font('Helvetica-Bold').text('Evacuation Route Report', { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(11).font('Helvetica').fillColor('#555')
    .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(2).fillColor('#000');

  const routes = normaliseRoutes(routeData);
  if (routes.length === 0) {
    doc.fontSize(12).font('Helvetica').text('No routes available to export.');
    doc.end();
    return;
  }

  routes.forEach((route, ri) => {
    doc.fontSize(15).font('Helvetica-Bold').text(`${ri + 1}. ${route.name}`);
    if (route.meta) doc.fontSize(10).font('Helvetica').fillColor('#666').text(route.meta).fillColor('#000');
    doc.moveDown(0.5);
    if (route.points.length === 0) {
      doc.fontSize(11).font('Helvetica').text('   No waypoints defined.');
    } else {
      route.points.forEach((p, i) => {
        doc.fontSize(11).font('Helvetica').text(`   ${i + 1}. ${p[0].toFixed(5)}, ${p[1].toFixed(5)}`);
      });
    }
    doc.moveDown(1.5);
  });

  doc.end();
};
