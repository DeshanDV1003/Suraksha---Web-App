import express from 'express';
import * as mapController from '../controllers/mapController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.post('/safe-route', authMiddleware, mapController.getSafeRoute);
router.post('/routes', mapController.createEvacuationRoute);
router.get('/routes', mapController.getEvacuationRoutes);
router.post('/routes/export/pdf', mapController.exportRoutePdf);

router.post('/volunteers', mapController.createVolunteerLocation);
router.get('/volunteers', mapController.getVolunteerLocations);

router.post('/projections', mapController.createThreatProjection);
router.get('/projections', mapController.getThreatProjections);

export default router;
