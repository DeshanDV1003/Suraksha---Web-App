import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, adminMiddleware, getAuditLogs);

export default router;
