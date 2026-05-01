import { Router } from 'express';
import { getOperationalIntelligence } from '../controllers/analyticsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/operational-intelligence', authMiddleware, getOperationalIntelligence);

export default router;
