import { Router } from 'express';
import { getUsers, updateUserRole, deleteUser, updateProfile } from '../controllers/userController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, adminMiddleware, getUsers);
router.patch('/profile', authMiddleware, updateProfile);
router.patch('/:id/role', authMiddleware, adminMiddleware, updateUserRole);
router.delete('/:id', authMiddleware, adminMiddleware, deleteUser);

export default router;
