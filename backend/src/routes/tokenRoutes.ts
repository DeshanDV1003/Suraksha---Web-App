import { Router } from 'express';
import { getTokens, createToken, useToken } from '../controllers/tokenController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getTokens);
router.post('/', authMiddleware, officerMiddleware, createToken);
router.post('/use', authMiddleware, officerMiddleware, useToken);

export default router;
