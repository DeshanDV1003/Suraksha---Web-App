import { Router } from 'express';
import { createAlert, getAlerts, deactivateAlert, deleteAlert, getDeliveryStats, acknowledgeAlert } from '../controllers/alertController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, adminMiddleware, createAlert);
router.get('/', getAlerts);
router.get('/:id/delivery', authMiddleware, adminMiddleware, getDeliveryStats);
router.post('/:id/acknowledge', authMiddleware, acknowledgeAlert);
router.patch('/:id/deactivate', authMiddleware, adminMiddleware, deactivateAlert);
router.delete('/:id', authMiddleware, adminMiddleware, deleteAlert);

export default router;
