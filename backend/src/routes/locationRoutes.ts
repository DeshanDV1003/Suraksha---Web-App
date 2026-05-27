import { Router } from 'express';
import { logLocation, getUserLastLocation, geocodeAddressHandler, reverseGeocodeHandler } from '../controllers/locationController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/log', authMiddleware, logLocation);
router.get('/user/:userId', authMiddleware, getUserLastLocation);
router.post('/geocode', authMiddleware, geocodeAddressHandler);
router.post('/reverse', authMiddleware, reverseGeocodeHandler);

export default router;
