import { PrismaClient } from '../prisma/generated/client';

const prisma = new PrismaClient();

// Inland centroids for all 25 Sri Lanka districts — coastal districts use inland town coords
const DISTRICT_COORDS: Record<string, [number, number]> = {
  'Colombo':      [6.9271, 79.8612],
  'Gampaha':      [7.0873, 79.9996],
  'Kalutara':     [6.6300, 80.1300], // inland from coast
  'Kandy':        [7.2906, 80.6337],
  'Matale':       [7.4675, 80.6234],
  'Nuwara Eliya': [6.9497, 80.7891],
  'Galle':        [6.2200, 80.3500], // inland — Baddegama area
  'Matara':       [6.1400, 80.6000], // inland — Akuressa area
  'Hambantota':   [6.3500, 81.0000], // inland — Tissamaharama area
  'Jaffna':       [9.6615, 80.0255],
  'Kilinochchi':  [9.3803, 80.3770],
  'Mannar':       [8.9761, 79.9044],
  'Vavuniya':     [8.7514, 80.4971],
  'Mullaitivu':   [9.0000, 80.8000], // inland
  'Batticaloa':   [7.7102, 81.5500], // slightly inland
  'Ampara':       [7.2987, 81.5000], // slightly inland
  'Trincomalee':  [8.5000, 81.0000], // inland
  'Kurunegala':   [7.4818, 80.3609],
  'Puttalam':     [8.0362, 79.9000], // slightly inland
  'Anuradhapura': [8.3408, 80.4164],
  'Polonnaruwa':  [7.9403, 81.0188],
  'Badulla':      [6.9934, 81.0550],
  'Monaragala':   [6.8667, 81.3471],
  'Ratnapura':    [6.6934, 80.3849],
  'Kegalle':      [7.2513, 80.3464],
};

const DISTRICT_LIST = Object.keys(DISTRICT_COORDS);

// Deterministic but bounded jitter — max ±0.025° (~2.7 km), won't push into sea
function jitter(id: string, idx: number): number {
  let h = 0;
  for (let k = 0; k < id.length; k++) h = (h * 31 + id.charCodeAt(k)) >>> 0;
  return (Math.sin(h * 1.3 + idx * 2.7) * 0.025);
}

function coordsForRecord(i: number, id: string): [number, number] {
  const district = DISTRICT_LIST[i % DISTRICT_LIST.length];
  const base = DISTRICT_COORDS[district];
  return [base[0] + jitter(id, 0), base[1] + jitter(id, 1)];
}

async function main() {
  const incidents = await prisma.incidentReport.findMany({ select: { id: true, location: true } });
  console.log(`Fixing ${incidents.length} incident coordinates...`);
  for (let i = 0; i < incidents.length; i++) {
    // Try to match location string to a known district
    const loc = incidents[i].location || '';
    const matched = DISTRICT_LIST.find(d => loc.toLowerCase().includes(d.toLowerCase()));
    const district = matched || DISTRICT_LIST[i % DISTRICT_LIST.length];
    const base = DISTRICT_COORDS[district];
    const lat = base[0] + jitter(incidents[i].id, 0);
    const lng = base[1] + jitter(incidents[i].id, 1);
    await prisma.incidentReport.update({ where: { id: incidents[i].id }, data: { latitude: lat, longitude: lng } });
  }
  console.log(`✓ Fixed ${incidents.length} incidents`);

  const camps = await prisma.reliefCamp.findMany({ select: { id: true, location: true } });
  console.log(`Fixing ${camps.length} camp coordinates...`);
  for (let i = 0; i < camps.length; i++) {
    const loc = camps[i].location || '';
    const matched = DISTRICT_LIST.find(d => loc.toLowerCase().includes(d.toLowerCase()));
    const district = matched || DISTRICT_LIST[(i + 3) % DISTRICT_LIST.length];
    const base = DISTRICT_COORDS[district];
    const lat = base[0] + jitter(camps[i].id, 2);
    const lng = base[1] + jitter(camps[i].id, 3);
    await prisma.reliefCamp.update({ where: { id: camps[i].id }, data: { latitude: lat, longitude: lng } });
  }
  console.log(`✓ Fixed ${camps.length} camps`);

  console.log('\nDone — all points now use inland district centroids with small jitter.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
