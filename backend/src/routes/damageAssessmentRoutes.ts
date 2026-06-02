import { Router } from 'express';
import { 
  getDamageAssessments, 
  reportDamage,
  deleteDamageAssessment,
  aiClassifyImage,
  updateWorkflowStatus,
  getDistrictSummaryReport
} from '../controllers/damageAssessmentController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

router.get('/damage', getDamageAssessments);
router.post('/damage', authMiddleware, reportDamage);
router.delete('/damage/:id', authMiddleware, deleteDamageAssessment);

router.post('/damage/ai-classify', authMiddleware, aiClassifyImage);
router.patch('/damage/:id/workflow', authMiddleware, updateWorkflowStatus);
router.get('/damage/district-report', authMiddleware, getDistrictSummaryReport);

export default router;
