import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  findSafeZones,
  getAuthoritiesForDistrict,
  getActiveDangerZonesWithSafeZones,
  dangerRadiusKmForLevel,
} from '../services/safeZoneService';

const router = Router();

/**
 * GET /api/safe-zones?lat=&lng=&dangerRadius=&searchRadius=&maxResults=
 * Find safe public places near a coordinate.
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: 'lat and lng query params are required' });
      return;
    }
    const dangerRadius = parseFloat(req.query.dangerRadius as string) || 5;
    const searchRadius = parseFloat(req.query.searchRadius as string) || dangerRadius * 3;
    const maxResults   = parseInt(req.query.maxResults as string)    || 8;

    const places = await findSafeZones(lat, lng, dangerRadius, searchRadius, maxResults);
    res.json({ success: true, count: places.length, data: places });
  } catch (err) {
    console.error('[SafeZoneRoutes] GET /', err);
    res.status(500).json({ error: 'Failed to fetch safe zones' });
  }
});

/**
 * GET /api/safe-zones/active
 * Returns all active flood danger zones enriched with nearby safe places and authorities.
 */
router.get('/active', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const zones = await getActiveDangerZonesWithSafeZones();
    res.json({ success: true, count: zones.length, data: zones });
  } catch (err) {
    console.error('[SafeZoneRoutes] GET /active', err);
    res.status(500).json({ error: 'Failed to fetch active danger zones' });
  }
});

/**
 * GET /api/safe-zones/district/:district
 * Returns safe places for a named district.
 */
router.get('/district/:district', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const district = String(req.params.district);
    const places = await findSafeZones(0, 0, 0, 999, 50);
    const filtered = places.filter(p => p.district.toLowerCase() === district.toLowerCase());
    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch district safe zones' });
  }
});

/**
 * GET /api/authorities/district/:district
 * Returns authority contacts for a district.
 */
router.get('/authorities/:district', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const contacts = await getAuthoritiesForDistrict(String(req.params.district));
    res.json({ success: true, count: contacts.length, data: contacts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch authority contacts' });
  }
});

/**
 * GET /api/safe-zones/radius/:alertLevel
 * Returns the danger radius in km for a given alert level.
 */
router.get('/radius/:alertLevel', async (req: Request, res: Response): Promise<void> => {
  const km = dangerRadiusKmForLevel(String(req.params.alertLevel).toUpperCase());
  res.json({ alertLevel: req.params.alertLevel, dangerRadiusKm: km });
});

export default router;
