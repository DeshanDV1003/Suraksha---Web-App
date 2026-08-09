import { Router } from 'express';
import { createSupplyRequest, getAllSupplyRequests, updateSupplyRequestStatus, getMySupplyRequests } from '../controllers/supplyRequestController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, createSupplyRequest);
router.get('/my', authMiddleware, getMySupplyRequests);
router.get('/', authMiddleware, officerMiddleware, getAllSupplyRequests);
router.patch('/:id/status', authMiddleware, officerMiddleware, updateSupplyRequestStatus);

export default router;
