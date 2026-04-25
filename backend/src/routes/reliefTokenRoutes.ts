import { Router } from 'express';
import { 
  issueReliefToken, 
  claimReliefToken, 
  recordDistribution 
} from '../controllers/reliefTokenController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

router.post('/issue', authMiddleware, officerMiddleware, issueReliefToken);
router.post('/claim', authMiddleware, claimReliefToken);
router.post('/distribution', authMiddleware, recordDistribution);

export default router;
