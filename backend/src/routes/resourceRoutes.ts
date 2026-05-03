import { Router } from 'express';
import { getResources, createResource, updateResourceStatus } from '../controllers/resourceController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', getResources);
router.post('/', authMiddleware, createResource);
router.patch('/:id/status', authMiddleware, officerMiddleware, updateResourceStatus);

export default router;
