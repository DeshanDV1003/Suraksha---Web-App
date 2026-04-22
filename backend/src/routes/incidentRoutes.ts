import { Router } from 'express';
import { 
  createIncident, 
  getIncidents, 
  getUserIncidents, 
  updateIncidentStatus,
  getIncidentById,
  deleteIncident
} from '../controllers/incidentController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, createIncident);
router.get('/', authMiddleware, getIncidents);
router.get('/my', authMiddleware, getUserIncidents);
router.get('/:id', authMiddleware, getIncidentById);
router.patch('/:id/status', authMiddleware, updateIncidentStatus);
router.delete('/:id', authMiddleware, adminMiddleware, deleteIncident);

export default router;
