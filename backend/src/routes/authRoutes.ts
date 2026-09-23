import { Router } from 'express';
import { register, login, changePassword, setup2FA, verify2FA, disable2FA, googleLogin, savePushToken } from '../controllers/authController';
import { authMiddleware, optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/register', optionalAuth, register);
router.post('/login', login);
router.post('/google', googleLogin);
router.patch('/push-token', authMiddleware, savePushToken);
router.post('/change-password', authMiddleware, changePassword);
router.post('/2fa/setup', authMiddleware, setup2FA);
router.post('/2fa/verify', authMiddleware, verify2FA);
router.post('/2fa/disable', authMiddleware, disable2FA);

export default router;
