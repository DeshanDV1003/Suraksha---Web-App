/**
 * Restores the original accurate GPS coordinates for all seeded relief camps.
 * The fix_coordinates.ts script mistakenly overwrote these with district centroids.
 */
import { PrismaClient } from '../prisma/generated/client';

const prisma = new PrismaClient();

// Exact coordinates from seed.ts — real GPS positions for each camp
const CAMP_COORDS: Record<string, [number, number]> = {
  'Colombo Racecourse Evacuation Centre': [6.9020, 79.8612],
  'Kandy Dharmaraja Camp':               [7.2906, 80.6337],
  'Galle Esplanade Relief Camp':         [6.0535, 80.2210],
  'Ratnapura District Camp':             [6.6828, 80.3992],
  'Batticaloa Lagoon Camp':              [7.7170, 81.6924],
  'Matara Southern Camp':                [5.9549, 80.5550],
  'Kurunegala North Western Camp':       [7.4818, 80.3609],
  'Nuwara Eliya Hill Camp':              [6.9497, 80.7891],
  'Ampara Eastern Shelter':              [7.2993, 81.6747],
  'Trincomalee Harbour Camp':            [8.5874, 81.2152],
  'Hambantota Southern Coast Camp':      [6.1241, 81.1185],
  'Badulla Uva Province Camp':           [6.9895, 81.0557],
  'Jaffna Northern Relief Centre':       [9.6615, 80.0255],
  'Kegalle District Shelter':            [7.2513, 80.3464],
  'Anuradhapura North Central Camp':     [8.3114, 80.4037],
};

async function main() {
  const camps = await prisma.reliefCamp.findMany({ select: { id: true, name: true, latitude: true, longitude: true } });
  console.log(`Found ${camps.length} camps in DB`);

  let fixed = 0;
  let skipped = 0;

  for (const camp of camps) {
    const coords = CAMP_COORDS[camp.name];
    if (!coords) {
      console.log(`  ⚠ No coords entry for: "${camp.name}" — skipping`);
      skipped++;
      continue;
    }
    const [lat, lng] = coords;
    await prisma.reliefCamp.update({
      where: { id: camp.id },
      data: { latitude: lat, longitude: lng },
    });
    console.log(`  ✓ ${camp.name}: (${lat}, ${lng})`);
    fixed++;
  }

  console.log(`\nDone — restored ${fixed} camps, skipped ${skipped}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
