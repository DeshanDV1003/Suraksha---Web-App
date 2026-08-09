import { Router } from 'express';
import { logLocation, getUserLastLocation, geocodeAddressHandler, reverseGeocodeHandler, getFieldTeamLocations } from '../controllers/locationController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/field-team', authMiddleware, getFieldTeamLocations);
router.post('/log', authMiddleware, logLocation);
router.get('/user/:userId', authMiddleware, getUserLastLocation);
router.post('/geocode', authMiddleware, geocodeAddressHandler);
router.post('/reverse', authMiddleware, reverseGeocodeHandler);

export default router;
