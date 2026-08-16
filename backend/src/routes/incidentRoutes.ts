import { Router } from 'express';
import {
  createIncident,
  getIncidents,
  getUserIncidents,
  updateIncidentStatus,
  getIncidentById,
  deleteIncident,
  getPendingDuplicates,
  getDuplicatesForIncident,
  resolveDuplicateLink,
  triggerSOS,
  addImages,
} from '../controllers/incidentController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.post('/sos', authMiddleware, triggerSOS);
router.post('/', authMiddleware, createIncident);
router.get('/', authMiddleware, getIncidents);
router.get('/my', authMiddleware, getUserIncidents);
// Duplicate detection — must come before /:id to avoid route conflict
router.get('/duplicates/pending', authMiddleware, adminMiddleware, getPendingDuplicates);
router.get('/:id/duplicates', authMiddleware, getDuplicatesForIncident);
router.patch('/duplicates/:linkId', authMiddleware, adminMiddleware, resolveDuplicateLink);
router.get('/:id', authMiddleware, getIncidentById);
router.patch('/:id/status', authMiddleware, updateIncidentStatus);
router.patch('/:id/images', authMiddleware, addImages);
router.delete('/:id', authMiddleware, adminMiddleware, deleteIncident);

export default router;
