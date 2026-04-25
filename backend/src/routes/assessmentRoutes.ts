import { Router } from 'express';
import { 
  reportDamage, 
  getDamageAssessments, 
  reportMissingPerson, 
  getMissingPersons, 
  updateMissingPersonStatus 
} from '../controllers/assessmentController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

// Damage
router.post('/damage', authMiddleware, reportDamage);
router.get('/damage', authMiddleware, getDamageAssessments);

// Missing Persons
router.post('/missing', authMiddleware, reportMissingPerson);
router.get('/missing', authMiddleware, getMissingPersons);
router.patch('/missing/:id/status', authMiddleware, officerMiddleware, updateMissingPersonStatus);

export default router;
