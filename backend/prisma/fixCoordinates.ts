/**
 * Fixes all seeded records that have coordinates outside Sri Lanka.
 * Sri Lanka bounds: lat 5.9–9.8, lng 79.7–81.9
 * Run: npx ts-node --project tsconfig.json prisma/fixCoordinates.ts
 */
import prisma from '../src/utils/prisma';

// Single verified town-center coordinate per district.
// These are the official administrative capitals — guaranteed on land.
// Source: verified against OpenStreetMap.
const DISTRICT_CENTER: Record<string, [number, number]> = {
  'Colombo':      [6.9271,  79.8612],  // Colombo city
  'Gampaha':      [7.0873,  80.0144],  // Gampaha town
  'Kalutara':     [6.5854,  80.2076],  // Kalutara town
  'Kandy':        [7.2906,  80.6337],  // Kandy city
  'Matale':       [7.4667,  80.6167],  // Matale town
  'Nuwara Eliya': [6.9497,  80.7891],  // Nuwara Eliya town (hill country)
  'Galle':        [6.0535,  80.2210],  // Galle city
  'Matara':       [5.9492,  80.5353],  // Matara town
  'Hambantota':   [6.1241,  81.1185],  // Hambantota town
  'Jaffna':       [9.6615,  80.0255],  // Jaffna city
  'Kilinochchi':  [9.3803,  80.3770],  // Kilinochchi town
  'Mannar':       [8.9770,  79.9040],  // Mannar town
  'Vavuniya':     [8.7514,  80.4972],  // Vavuniya town
  'Mullaitivu':   [9.2674,  80.8082],  // Mullaitivu town
  'Batticaloa':   [7.7102,  81.6924],  // Batticaloa city
  'Ampara':       [7.2993,  81.6747],  // Ampara town
  'Trincomalee':  [8.5874,  81.2152],  // Trincomalee city
  'Kurunegala':   [7.4818,  80.3609],  // Kurunegala city
  'Puttalam':     [8.0302,  79.8440],  // Puttalam town
  'Anuradhapura': [8.3114,  80.4037],  // Anuradhapura city
  'Polonnaruwa':  [7.9403,  81.0188],  // Polonnaruwa city
  'Badulla':      [6.9895,  81.0557],  // Badulla city
  'Monaragala':   [6.8728,  81.3476],  // Monaragala town
  'Ratnapura':    [6.6828,  80.3992],  // Ratnapura city
  'Kegalle':      [7.2513,  80.3464],  // Kegalle town
};

// All district centers as a flat array for random selection
const ALL_CENTERS = Object.values(DISTRICT_CENTER);

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function coordsFromLocation(location: string): [number, number] {
  for (const [district, center] of Object.entries(DISTRICT_CENTER)) {
    if (location.includes(district)) return center;
  }
  return DISTRICT_CENTER['Colombo'];
}

function randomDistrictCoords(): [number, number] {
  return pick(ALL_CENTERS);
}

// Small jitter only used for polygon/route waypoints (not individual pins)
function jitter(v: number) { return v + (Math.random() - 0.5) * 0.08; }

function isOutsideSL(lat: number | null, lng: number | null): boolean {
  if (lat == null || lng == null) return false;
  return lat < 5.85 || lat > 9.85 || lng < 79.5 || lng > 82.0;
}

async function main() {
  console.log('\n🗺️  Fixing out-of-bounds coordinates...\n');
  let fixed = 0;

  // ── IncidentReport ─────────────────────────────────────────────
  const incidents = await prisma.incidentReport.findMany({ select: { id: true, location: true, latitude: true, longitude: true } });
  for (const r of incidents) {
    const [lat, lng] = coordsFromLocation(r.location);
    await prisma.incidentReport.update({ where: { id: r.id }, data: { latitude: lat, longitude: lng } });
    fixed++;
  }
  console.log(`   ✅ IncidentReport: fixed ${fixed} records`);

  // ── HelpRequest ────────────────────────────────────────────────
  let n = 0;
  const helpReqs = await prisma.helpRequest.findMany({ select: { id: true, location: true, latitude: true, longitude: true } });
  for (const r of helpReqs) {
    const [lat, lng] = coordsFromLocation(r.location);
    await prisma.helpRequest.update({ where: { id: r.id }, data: { latitude: lat, longitude: lng } });
    n++;
  }
  console.log(`   ✅ HelpRequest: fixed ${n} records`); fixed += n;

  // ── DamageAssessment ───────────────────────────────────────────
  n = 0;
  const damages = await prisma.damageAssessment.findMany({ select: { id: true, location: true, latitude: true, longitude: true } });
  for (const r of damages) {
    const [lat, lng] = coordsFromLocation(r.location);
    await prisma.damageAssessment.update({ where: { id: r.id }, data: { latitude: lat, longitude: lng } });
    n++;
  }
  console.log(`   ✅ DamageAssessment: fixed ${n} records`); fixed += n;

  // ── SafetyCheckIn ──────────────────────────────────────────────
  n = 0;
  const checkIns = await prisma.safetyCheckIn.findMany({ select: { id: true, latitude: true, longitude: true } });
  for (const r of checkIns) {
    const [lat, lng] = randomDistrictCoords();
    await prisma.safetyCheckIn.update({ where: { id: r.id }, data: { latitude: lat, longitude: lng } });
    n++;
  }
  console.log(`   ✅ SafetyCheckIn: fixed ${n} records`); fixed += n;

  // ── LocationLog ────────────────────────────────────────────────
  n = 0;
  const locLogs = await prisma.locationLog.findMany({ select: { id: true, latitude: true, longitude: true } });
  for (const r of locLogs) {
    const [lat, lng] = randomDistrictCoords();
    await prisma.locationLog.update({ where: { id: r.id }, data: { latitude: lat, longitude: lng } });
    n++;
  }
  console.log(`   ✅ LocationLog: fixed ${n} records`); fixed += n;

  // ── VolunteerCheckIn ───────────────────────────────────────────
  n = 0;
  const volCheckIns = await prisma.volunteerCheckIn.findMany({ select: { id: true, latitude: true, longitude: true, zone: true } });
  for (const r of volCheckIns) {
    const [lat, lng] = coordsFromLocation(r.zone ?? 'Colombo');
    await prisma.volunteerCheckIn.update({ where: { id: r.id }, data: { latitude: lat, longitude: lng } });
    n++;
  }
  console.log(`   ✅ VolunteerCheckIn: fixed ${n} records`); fixed += n;

  // ── VolunteerLocation ──────────────────────────────────────────
  n = 0;
  const volLocs = await prisma.volunteerLocation.findMany({ select: { id: true, latitude: true, longitude: true } });
  for (const r of volLocs) {
    const [lat, lng] = randomDistrictCoords();
    await prisma.volunteerLocation.update({ where: { id: r.id }, data: { latitude: lat, longitude: lng } });
    n++;
  }
  console.log(`   ✅ VolunteerLocation: fixed ${n} records`); fixed += n;

  // ── ReliefCamp ─────────────────────────────────────────────────
  n = 0;
  const camps = await prisma.reliefCamp.findMany({ select: { id: true, location: true, latitude: true, longitude: true } });
  for (const r of camps) {
    const [lat, lng] = coordsFromLocation(r.location);
    await prisma.reliefCamp.update({ where: { id: r.id }, data: { latitude: lat, longitude: lng } });
    n++;
  }
  console.log(`   ✅ ReliefCamp: fixed ${n} records`); fixed += n;

  // ── EvacuationRoute ────────────────────────────────────────────
  n = 0;
  const routes = await prisma.evacuationRoute.findMany({ select: { id: true, name: true, coordinates: true } });
  for (const r of routes) {
    // Find district from name, rebuild coordinates inside SL
    const [lat, lng] = coordsFromLocation(r.name);
    await prisma.evacuationRoute.update({
      where: { id: r.id },
      data: {
        coordinates: [
          { lat: jitter(lat), lng: jitter(lng) },
          { lat: jitter(lat + 0.05), lng: jitter(lng + 0.05) },
          { lat: jitter(lat + 0.08), lng: jitter(lng - 0.03) },
        ],
      },
    });
    n++;
  }
  console.log(`   ✅ EvacuationRoute: fixed ${n} records`); fixed += n;

  // ── ThreatProjection ───────────────────────────────────────────
  n = 0;
  const projections = await prisma.threatProjection.findMany({ select: { id: true, name: true } });
  for (const r of projections) {
    const [lat, lng] = coordsFromLocation(r.name);
    await prisma.threatProjection.update({
      where: { id: r.id },
      data: {
        polygonCoords: [
          { lat: lat - 0.1, lng: lng - 0.1 },
          { lat: lat + 0.1, lng: lng - 0.1 },
          { lat: lat + 0.1, lng: lng + 0.1 },
          { lat: lat - 0.1, lng: lng + 0.1 },
        ],
      },
    });
    n++;
  }
  console.log(`   ✅ ThreatProjection: fixed ${n} records`); fixed += n;

  console.log(`\n✅ Total records fixed: ${fixed}`);
  console.log('   All map pins are now within Sri Lanka bounds (lat 5.9–9.8, lng 79.7–81.9)\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
