import { Router } from 'express';
import { getResources, createResource, updateResourceStatus, deleteResource } from '../controllers/resourceController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getResources);
router.post('/', authMiddleware, createResource);
router.patch('/:id/status', authMiddleware, officerMiddleware, updateResourceStatus);
router.delete('/:id', authMiddleware, officerMiddleware, deleteResource);

export default router;
