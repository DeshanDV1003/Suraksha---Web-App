import { Router } from 'express';
import { updateMySafetyStatus, updateFamilyMemberStatus, getMyFamilyStatus, getSafetyRoster, adminOverrideFamilyMember, deleteFamilyMember } from '../controllers/familyController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

// Citizen endpoints
router.post('/status', authMiddleware, updateMySafetyStatus);
router.post('/members', authMiddleware, updateFamilyMemberStatus);
router.patch('/members/:id', authMiddleware, updateFamilyMemberStatus);
router.delete('/members/:id', authMiddleware, deleteFamilyMember);
router.get('/my-status', authMiddleware, getMyFamilyStatus);

// Officer endpoints
router.get('/roster', authMiddleware, officerMiddleware, getSafetyRoster);
router.patch('/admin/members/:id', authMiddleware, officerMiddleware, adminOverrideFamilyMember);

export default router;
