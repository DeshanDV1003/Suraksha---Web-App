import { Router } from 'express';
import { authMiddleware as authenticateToken } from '../middleware/auth';
import * as ctrl from '../controllers/rescueController';

const router = Router();
router.use(authenticateToken);

// Vehicles
router.get('/vehicles', ctrl.getVehicles);
router.get('/vehicles/area/:area', ctrl.getVehiclesByArea);
router.post('/vehicles', ctrl.createVehicle);
router.patch('/vehicles/:id/status', ctrl.updateVehicleStatus);
router.delete('/vehicles/:id', ctrl.deleteVehicle);

// Missions
router.get('/missions', ctrl.getMissions);
router.get('/missions/area/:area', ctrl.getMissionsByArea);
router.post('/missions', ctrl.createMission);
router.patch('/missions/:id/status', ctrl.updateMissionStatus);

// Safe zone check-in (citizens)
router.post('/safe-zone', ctrl.markSafeZone);
router.get('/safe-zone/me', ctrl.getUserSafeZoneStatus);
router.get('/safe-zone', ctrl.getSafeZoneCheckIns);

export default router;
