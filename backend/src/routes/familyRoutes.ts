import { Router } from 'express';
import { updateMySafetyStatus, updateFamilyMemberStatus, getMyFamilyStatus, getSafetyRoster } from '../controllers/familyController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

// Citizen endpoints
router.post('/status', authMiddleware, updateMySafetyStatus);
router.post('/members', authMiddleware, updateFamilyMemberStatus);
router.patch('/members/:id', authMiddleware, updateFamilyMemberStatus);
router.get('/my-status', authMiddleware, getMyFamilyStatus);

// Officer endpoints
router.get('/roster', authMiddleware, officerMiddleware, getSafetyRoster);

export default router;
