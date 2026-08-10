import { Router } from 'express';
import { getLatestDistrictRainfall, SL_DISTRICTS } from '../services/rainfallWeatherService';

const router = Router();

// Latest rainfall per district — used by MapPage rainfall overlay
router.get('/districts', async (_req, res) => {
  try {
    const readings = await getLatestDistrictRainfall();
    res.json(readings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch district rainfall' });
  }
});

// District metadata (names + coordinates) — useful for map setup
router.get('/district-list', (_req, res) => {
  res.json(SL_DISTRICTS);
});

export default router;
