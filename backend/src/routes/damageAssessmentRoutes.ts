import { Router } from 'express';
import { 
  getDamageAssessments, 
  reportDamage,
  deleteDamageAssessment
} from '../controllers/damageAssessmentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/damage', getDamageAssessments);
router.post('/damage', authMiddleware, reportDamage);
router.delete('/damage/:id', authMiddleware, deleteDamageAssessment);

export default router;
