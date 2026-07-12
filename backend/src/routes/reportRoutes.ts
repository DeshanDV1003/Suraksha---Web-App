import { Router } from 'express';
import { exportReport } from '../controllers/ReportController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

// Endpoint for exporting reports. 
// Requires authentication. Role authorization is handled within the controller or here.
router.post('/export', authMiddleware, exportReport);

export default router;
