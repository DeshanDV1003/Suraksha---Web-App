/**
 * One-off repair: early seed runs stored procedurally-stepped coordinates
 * (lat = 6 + 0.3·i, lng = 80 + 0.15·i) for VolunteerLocation / EvacuationRoute /
 * ThreatProjection, which plot as a straight diagonal line across the island
 * (and into the sea). This rewrites them to realistic, scattered positions
 * anchored on real district centres. Safe to run repeatedly.
 *
 * Run: npx tsx prisma/fix-map-coords.ts
 */
import prisma from '../src/utils/prisma';

// Verified on-land administrative centres (lat, lng).
const DISTRICT_CENTER: Record<string, [number, number]> = {
  Colombo: [6.9271, 79.8612], Gampaha: [7.0873, 80.0144], Kalutara: [6.5854, 80.1300],
  Kandy: [7.2906, 80.6337], Matale: [7.4667, 80.6167], 'Nuwara Eliya': [6.9497, 80.7891],
  Galle: [6.1500, 80.2200], Matara: [6.0000, 80.5353], Hambantota: [6.2000, 81.1000],
  Jaffna: [9.6615, 80.0255], Kilinochchi: [9.3803, 80.3770], Mannar: [8.9770, 79.9040],
  Vavuniya: [8.7514, 80.4972], Mullaitivu: [9.2674, 80.8082], Batticaloa: [7.7102, 81.6300],
  Ampara: [7.2993, 81.6000], Trincomalee: [8.5874, 81.2152], Kurunegala: [7.4818, 80.3609],
  Puttalam: [8.0302, 79.8440], Anuradhapura: [8.3114, 80.4037], Polonnaruwa: [7.9403, 81.0188],
  Badulla: [6.9895, 81.0557], Monaragala: [6.8728, 81.3476], Ratnapura: [6.6828, 80.3992],
  Kegalle: [7.2513, 80.3464],
};
const CENTERS = Object.values(DISTRICT_CENTER);

const j = (v: number, amt = 0.06) => v + (Math.random() - 0.5) * 2 * amt;
const centerFor = (text: string): [number, number] => {
  for (const [d, c] of Object.entries(DISTRICT_CENTER)) if (text?.includes(d)) return c;
  return CENTERS[Math.floor(Math.random() * CENTERS.length)];
};

async function main() {
  console.log('\n🗺️  Repairing diagonal map coordinates...\n');

  const vls = await prisma.volunteerLocation.findMany({ select: { id: true } });
  for (const v of vls) {
    const [lat, lng] = CENTERS[Math.floor(Math.random() * CENTERS.length)];
    await prisma.volunteerLocation.update({ where: { id: v.id }, data: { latitude: j(lat), longitude: j(lng) } });
  }
  console.log(`   ✅ VolunteerLocation: ${vls.length} scattered across districts`);

  const routes = await prisma.evacuationRoute.findMany({ select: { id: true, name: true } });
  for (const r of routes) {
    const [lat, lng] = centerFor(r.name);
    await prisma.evacuationRoute.update({
      where: { id: r.id },
      data: {
        coordinates: [
          { lat: j(lat, 0.02), lng: j(lng, 0.02) },
          { lat: j(lat + 0.04, 0.02), lng: j(lng + 0.03, 0.02) },
          { lat: j(lat + 0.07, 0.02), lng: j(lng - 0.02, 0.02) },
        ],
      },
    });
  }
  console.log(`   ✅ EvacuationRoute: ${routes.length} rebuilt near their named district`);

  const projs = await prisma.threatProjection.findMany({ select: { id: true, name: true } });
  for (const p of projs) {
    const [lat, lng] = centerFor(p.name);
    await prisma.threatProjection.update({
      where: { id: p.id },
      data: {
        polygonCoords: [
          { lat: lat - 0.08, lng: lng - 0.08 }, { lat: lat + 0.08, lng: lng - 0.08 },
          { lat: lat + 0.08, lng: lng + 0.08 }, { lat: lat - 0.08, lng: lng + 0.08 },
        ],
      },
    });
  }
  console.log(`   ✅ ThreatProjection: ${projs.length} polygons re-centred`);

  console.log('\n✅ Done — no more diagonal.\n');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
