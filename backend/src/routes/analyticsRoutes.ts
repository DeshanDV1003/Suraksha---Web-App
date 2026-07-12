import { Router } from 'express';
import { getOperationalIntelligence, generateAAR, getKPIBenchmarks, getVulnerabilityIndex, getDisasterBudgets, exportIntelligencePdf } from '../controllers/analyticsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/operational-intelligence', authMiddleware, getOperationalIntelligence);
router.post('/aar/:incidentId', authMiddleware, generateAAR);
router.get('/kpis', authMiddleware, getKPIBenchmarks);
router.get('/vulnerability', authMiddleware, getVulnerabilityIndex);
router.get('/budgets', authMiddleware, getDisasterBudgets);
router.post('/export/pdf', authMiddleware, exportIntelligencePdf);

export default router;
