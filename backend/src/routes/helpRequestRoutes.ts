import { Router } from 'express';
import {
  createHelpRequest,
  getHelpRequests,
  getMyHelpRequests,
  registerAsVerifier,
  verifyAction,
  submitPublicRequest,
  handleSMSWebhook,
  assignResponder,
  updateRequestStatus,
  getClusteredRequests,
  checkEscalations
} from '../controllers/helpRequestController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/public', submitPublicRequest);
router.post('/webhook/sms', handleSMSWebhook);

// Auth required routes
router.post('/', authMiddleware, createHelpRequest);
router.get('/my', authMiddleware, getMyHelpRequests);
router.get('/', authMiddleware, getHelpRequests);

// Advanced Dispatch/Officer routes
router.patch('/:id/assign', authMiddleware, officerMiddleware, assignResponder);
router.patch('/:id/status', authMiddleware, updateRequestStatus);
router.get('/clusters', authMiddleware, officerMiddleware, getClusteredRequests);
router.post('/escalations/check', authMiddleware, officerMiddleware, checkEscalations);

// Legacy verifier
router.post('/verifier/register', authMiddleware, registerAsVerifier);
router.post('/verifier/verify', authMiddleware, verifyAction);

export default router;
