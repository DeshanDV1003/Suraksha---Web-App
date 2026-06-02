import express from 'express';
import * as mapController from '../controllers/mapController';

const router = express.Router();

router.post('/routes', mapController.createEvacuationRoute);
router.get('/routes', mapController.getEvacuationRoutes);

router.post('/volunteers', mapController.createVolunteerLocation);
router.get('/volunteers', mapController.getVolunteerLocations);

router.post('/projections', mapController.createThreatProjection);
router.get('/projections', mapController.getThreatProjections);

export default router;
