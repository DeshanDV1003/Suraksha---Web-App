import { Router } from 'express';
import { 
  issueReliefToken, 
  claimReliefToken, 
  getReliefTokens,
  getReliefTokenByCode,
  createDonorCampaign,
  getDonorCampaigns,
  getFraudAnalytics
} from '../controllers/reliefTokenController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

// Tokens Core
router.get('/', authMiddleware, officerMiddleware, getReliefTokens);
router.post('/issue', authMiddleware, officerMiddleware, issueReliefToken);
router.get('/:code', authMiddleware, getReliefTokenByCode);
router.post('/claim', authMiddleware, claimReliefToken);

// Analytics & Fraud
router.get('/analytics/fraud', authMiddleware, officerMiddleware, getFraudAnalytics);

// Donor Campaigns
router.post('/donors', authMiddleware, officerMiddleware, createDonorCampaign);
router.get('/donors/all', authMiddleware, officerMiddleware, getDonorCampaigns);

export default router;
