import prisma from '../src/utils/prisma';
import geohash from 'ngeohash';

// Sri Lanka Bounding Box
const SL_BBOX = {
  minLat: 5.9,
  maxLat: 9.9,
  minLon: 79.6,
  maxLon: 81.9,
};

async function main() {
  console.log('Starting Sector Seeding...');

  // 1. Generate Grid Sectors using Geohash (Length 5: ~4.9km x 4.9km)
  // This will create a grid over the entire bounding box of Sri Lanka.
  const geohashes = geohash.bboxes(SL_BBOX.minLat, SL_BBOX.minLon, SL_BBOX.maxLat, SL_BBOX.maxLon, 5);
  
  console.log(`Generated ${geohashes.length} grid sectors (geohash length 5). Inserting into database...`);
  
  const gridSectors = geohashes.map(hash => ({
    id: hash,
    name: `Grid-${hash}`,
    type: 'GRID',
  }));

  // Batch insert to avoid overwhelming the connection
  for (let i = 0; i < gridSectors.length; i += 1000) {
    const batch = gridSectors.slice(i, i + 1000);
    await prisma.sector.createMany({
      data: batch,
      skipDuplicates: true,
    });
    console.log(`Inserted batch ${i} to ${i + batch.length}...`);
  }
  console.log('Grid Sectors inserted.');

  // 2. Insert Mock Administrative Sectors (GN Divisions)
  console.log('Inserting Mock Administrative Sectors (GN Divisions)...');
  const mockGNDivisions = [
    {
      id: 'GN-COL-001',
      name: 'Colombo 01 (Fort)',
      type: 'ADMINISTRATIVE',
      district: 'Colombo',
      province: 'Western',
      polygonData: {
        type: 'Polygon',
        coordinates: [[
          [79.843, 6.932],
          [79.851, 6.935],
          [79.853, 6.928],
          [79.845, 6.925],
          [79.843, 6.932]
        ]]
      }
    },
    {
      id: 'GN-GAL-001',
      name: 'Galle Fort',
      type: 'ADMINISTRATIVE',
      district: 'Galle',
      province: 'Southern',
      polygonData: {
        type: 'Polygon',
        coordinates: [[
          [80.215, 6.025],
          [80.223, 6.025],
          [80.223, 6.031],
          [80.215, 6.031],
          [80.215, 6.025]
        ]]
      }
    }
  ];

  await prisma.sector.createMany({
    data: mockGNDivisions,
    skipDuplicates: true,
  });
  console.log('Mock Administrative Sectors inserted.');
  
  console.log('Sector Seeding Completed Successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
