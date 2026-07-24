/**
 * Safe Zone Service
 * Finds safe public places near a danger zone, checks if they are inside
 * the danger radius, and returns ordered alternatives.
 */
import prisma from '../utils/prisma';

const EARTH_KM = 6371;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return EARTH_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface SafePlace {
  id: string;
  name: string;
  type: string;
  district: string;
  address: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
  capacity: number | null;
  distanceKm: number;
  isInDangerZone: boolean;
  mapsUrl: string;
  deepLink: string;
}

export interface AuthorityInfo {
  id: string;
  role: string;
  name: string;
  phone: string;
  phone2: string | null;
  email: string | null;
  district: string;
}

/**
 * Returns up to `maxResults` safe places near (lat, lng) within `searchRadiusKm`.
 * Places inside `dangerRadiusKm` of the origin are flagged as in danger zone.
 * Results are sorted: safe places first, ordered by distance.
 */
export async function findSafeZones(
  lat: number,
  lng: number,
  dangerRadiusKm: number = 5,
  searchRadiusKm: number = 15,
  maxResults: number = 8,
): Promise<SafePlace[]> {
  const all = await prisma.publicSafePlace.findMany();

  const nearby = all
    .map((p) => {
      const dist = haversineKm(lat, lng, p.latitude, p.longitude);
      return { ...p, distanceKm: dist };
    })
    .filter((p) => p.distanceKm <= searchRadiusKm)
    .map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      district: p.district,
      address: p.address,
      phone: p.phone,
      latitude: p.latitude,
      longitude: p.longitude,
      capacity: p.capacity,
      distanceKm: Math.round(p.distanceKm * 10) / 10,
      isInDangerZone: p.distanceKm <= dangerRadiusKm,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`,
      deepLink: `suraksha://safezone?lat=${p.latitude}&lng=${p.longitude}&name=${encodeURIComponent(p.name)}&type=${p.type}`,
    }))
    .sort((a, b) => {
      // Safe (outside danger zone) first, then by distance
      if (a.isInDangerZone !== b.isInDangerZone) return a.isInDangerZone ? 1 : -1;
      return a.distanceKm - b.distanceKm;
    });

  return nearby.slice(0, maxResults);
}

/**
 * Returns authority contacts for a district.
 */
export async function getAuthoritiesForDistrict(district: string): Promise<AuthorityInfo[]> {
  const contacts = await prisma.authorityContact.findMany({
    where: {
      isActive: true,
      district: { contains: district, mode: 'insensitive' },
    },
    orderBy: { role: 'asc' },
  });

  return contacts.map((c) => ({
    id: c.id,
    role: c.role,
    name: c.name,
    phone: c.phone,
    phone2: c.phone2,
    email: c.email,
    district: c.district,
  }));
}

/**
 * Danger radius in km based on alert level.
 */
export function dangerRadiusKmForLevel(level: string): number {
  switch (level) {
    case 'CRITICAL': return 10;
    case 'WARNING':  return 6;
    case 'WATCH':    return 3;
    default:         return 2;
  }
}

/**
 * Get active flood danger zones from current river/rainfall alerts.
 * Returns list of {district, lat, lng, alertLevel, dangerRadiusKm, safeZones}.
 */
export async function getActiveDangerZonesWithSafeZones(): Promise<any[]> {
  const rivers = await prisma.riverWaterLevel.findMany({
    where: {
      status: { in: ['ALERT', 'MINOR_FLOOD', 'MAJOR_FLOOD'] },
      recordedAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    },
    orderBy: { recordedAt: 'desc' },
    distinct: ['gaugeId'],
  });

  const zones = await Promise.all(
    rivers.map(async (r) => {
      const level =
        r.status === 'MAJOR_FLOOD'
          ? 'CRITICAL'
          : r.status === 'MINOR_FLOOD'
          ? 'WARNING'
          : 'WATCH';
      const radius = dangerRadiusKmForLevel(level);
      const safeZones = await findSafeZones(r.latitude, r.longitude, radius, radius * 3);
      const authorities = await getAuthoritiesForDistrict(r.district);

      return {
        gaugeId: r.gaugeId,
        riverName: r.riverName,
        stationName: r.stationName,
        district: r.district,
        latitude: r.latitude,
        longitude: r.longitude,
        alertLevel: level,
        waterLevelMetres: r.waterLevelMetres,
        dangerRadiusKm: radius,
        safeZones,
        authorities,
      };
    }),
  );

  return zones;
}
