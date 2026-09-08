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

router.get('/damage', authMiddleware, getDamageAssessments);
router.post('/damage', authMiddleware, reportDamage);
router.delete('/damage/:id', authMiddleware, officerMiddleware, deleteDamageAssessment);

router.post('/damage/ai-classify', authMiddleware, aiClassifyImage);
// The verification workflow (escalate / approve compensation / reject) is officer-only
router.patch('/damage/:id/workflow', authMiddleware, officerMiddleware, updateWorkflowStatus);
router.get('/damage/district-report', authMiddleware, getDistrictSummaryReport);

export default router;
