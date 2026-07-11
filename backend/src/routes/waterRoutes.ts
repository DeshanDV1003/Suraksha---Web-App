import { Router } from 'express';
import prisma from '../utils/prisma';

const router = Router();

// Get recent rainfall data
router.get('/rainfall', async (req, res) => {
  try {
    const recent = await prisma.rainfallReading.findMany({
      take: 100,
      orderBy: { recordedAt: 'desc' }
    });
    res.json(recent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rainfall data' });
  }
});

// Get recent river data
router.get('/river', async (req, res) => {
  try {
    const recent = await prisma.riverWaterLevel.findMany({
      take: 100,
      orderBy: { recordedAt: 'desc' }
    });
    res.json(recent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch river data' });
  }
});

// Get mappings
router.get('/downstream-mapping', async (req, res) => {
  try {
    const mappings = await prisma.downstreamMapping.findMany();
    res.json(mappings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mappings' });
  }
});

// Create/Update mapping
router.post('/downstream-mapping', async (req, res) => {
  const { gaugeId, riverName, stationName, targetDistricts } = req.body;
  try {
    const mapping = await prisma.downstreamMapping.upsert({
      where: { gaugeId },
      update: { riverName, stationName, targetDistricts },
      create: { gaugeId, riverName, stationName, targetDistricts }
    });
    res.json(mapping);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update mapping' });
  }
});

export default router;
