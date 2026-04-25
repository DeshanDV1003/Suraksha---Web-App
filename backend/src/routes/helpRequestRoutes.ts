import { Router } from 'express';
import { 
  createHelpRequest, 
  getHelpRequests, 
  registerAsVerifier, 
  verifyAction 
} from '../controllers/helpRequestController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, createHelpRequest);
router.get('/', authMiddleware, getHelpRequests);

router.post('/verifier/register', authMiddleware, registerAsVerifier);
router.post('/verifier/verify', authMiddleware, verifyAction);

export default router;
