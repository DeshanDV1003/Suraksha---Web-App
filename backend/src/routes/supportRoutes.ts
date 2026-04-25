import { Router } from 'express';
import { 
  createSupportRequest, 
  getSupportRequests, 
  updateSupportStatus 
} from '../controllers/supportController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, createSupportRequest);
router.get('/', authMiddleware, officerMiddleware, getSupportRequests);
router.patch('/:id/status', authMiddleware, officerMiddleware, updateSupportStatus);

export default router;
