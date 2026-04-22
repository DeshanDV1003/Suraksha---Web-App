import { Router } from 'express';
import { createCamp, getCamps, updateOccupancy } from '../controllers/campController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, officerMiddleware, createCamp);
router.get('/', getCamps);
router.patch('/:id/occupancy', authMiddleware, officerMiddleware, updateOccupancy);

export default router;
