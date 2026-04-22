import { Router } from 'express';
import { createAlert, getAlerts, deactivateAlert, deleteAlert } from '../controllers/alertController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, adminMiddleware, createAlert);
router.get('/', getAlerts);
router.patch('/:id/deactivate', authMiddleware, adminMiddleware, deactivateAlert);
router.delete('/:id', authMiddleware, adminMiddleware, deleteAlert);

export default router;
