import { Router } from 'express';
import { getUsers, updateUserRole, deleteUser, updateProfile, getMe } from '../controllers/userController';
import { authMiddleware, adminMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, officerMiddleware, getUsers);
router.get('/me', authMiddleware, getMe);
router.patch('/profile', authMiddleware, updateProfile);
router.patch('/:id/role', authMiddleware, adminMiddleware, updateUserRole);
router.delete('/:id', authMiddleware, adminMiddleware, deleteUser);

export default router;
