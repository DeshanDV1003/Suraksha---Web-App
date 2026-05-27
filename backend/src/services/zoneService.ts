import * as turf from '@turf/turf';
import fs from 'fs';
import path from 'path';

let districtGeoJSON: any = null;

try {
  const cwdGeojsonPath = path.join(process.cwd(), 'data/srilanka_districts.geojson');
  const dirnameGeojsonPath = path.join(__dirname, '../../data/srilanka_districts.geojson');
  
  const geojsonPath = fs.existsSync(cwdGeojsonPath) ? cwdGeojsonPath : dirnameGeojsonPath;

  if (fs.existsSync(geojsonPath)) {
    districtGeoJSON = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
    console.log('✓ Loaded Sri Lanka district boundary map successfully');
  } else {
    console.warn(`⚠️ Warning: srilanka_districts.geojson not found at ${cwdGeojsonPath} or ${dirnameGeojsonPath}`);
  }
} catch (err: any) {
  console.error('Failed to load district boundaries:', err.message);
}

export interface ZoneDetails {
  zoneId: string | null;
  zoneName: string;
  province: string | null;
  level: string;
}

export function findZoneForCoordinates(lat: number, lng: number): ZoneDetails {
  if (!districtGeoJSON) {
    return { zoneId: null, zoneName: 'Unknown Zone', province: null, level: 'unknown' };
  }

  const point = turf.point([lng, lat]);

  for (const feature of districtGeoJSON.features) {
    try {
      if (turf.booleanPointInPolygon(point, feature)) {
        return {
          zoneId: feature.properties.ADM2_PCODE || null,
          zoneName: feature.properties.ADM2_EN || 'Unknown District',
          province: feature.properties.ADM1_EN || null,
          level: 'district'
        };
      }
    } catch (err) {
      continue;
    }
  }

  return { zoneId: null, zoneName: 'Unknown Zone', province: null, level: 'unknown' };
}
