import { Router } from 'express';
import { getMyNotifications, markAsRead } from '../controllers/notificationController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/my', authMiddleware, getMyNotifications);
router.patch('/:id/read', authMiddleware, markAsRead);

export default router;
