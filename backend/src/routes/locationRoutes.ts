import { Router } from 'express';
import { logLocation, getUserLastLocation } from '../controllers/locationController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/log', authMiddleware, logLocation);
router.get('/user/:userId', authMiddleware, getUserLastLocation);

export default router;
