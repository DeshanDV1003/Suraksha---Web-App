import { Router } from 'express';
import { getOperationalIntelligence, generateAAR, getKPIBenchmarks, getVulnerabilityIndex, getDisasterBudgets } from '../controllers/analyticsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/operational-intelligence', authMiddleware, getOperationalIntelligence);
router.post('/aar/:incidentId', authMiddleware, generateAAR);
router.get('/kpis', authMiddleware, getKPIBenchmarks);
router.get('/vulnerability', authMiddleware, getVulnerabilityIndex);
router.get('/budgets', authMiddleware, getDisasterBudgets);

export default router;
