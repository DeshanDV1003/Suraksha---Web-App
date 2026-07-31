import { Router } from 'express';
import {
  issueReliefToken,
  claimReliefToken,
  getReliefTokens,
  getMyReliefTokens,
  getReliefTokenByCode,
  createDonorCampaign,
  getDonorCampaigns,
  getFraudAnalytics
} from '../controllers/reliefTokenController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

// Tokens Core — static routes MUST come before /:code wildcard
router.get('/', authMiddleware, officerMiddleware, getReliefTokens);
router.get('/my', authMiddleware, getMyReliefTokens);
router.post('/issue', authMiddleware, officerMiddleware, issueReliefToken);
router.post('/claim', authMiddleware, claimReliefToken);

// Analytics & Fraud (static — must be before /:code)
router.get('/analytics/fraud', authMiddleware, officerMiddleware, getFraudAnalytics);

// Donor Campaigns (static — must be before /:code)
router.post('/donors', authMiddleware, officerMiddleware, createDonorCampaign);
router.get('/donors/all', authMiddleware, officerMiddleware, getDonorCampaigns);

// Wildcard — must be LAST
router.get('/:code', authMiddleware, getReliefTokenByCode);

export default router;
