import { Router } from 'express';
import { 
  getMissingPersons, 
  reportMissingPerson, 
  updateMissingPersonStatus,
  deleteMissingPerson,
  searchFace,
  triggerReunification,
  runCrossReference
} from '../controllers/missingPersonController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

// Public routes (no auth required)
router.get('/public', getMissingPersons);
router.post('/public', reportMissingPerson);

// Auth required routes
router.get('/', authMiddleware, getMissingPersons);
router.post('/', authMiddleware, reportMissingPerson);
router.patch('/:id/status', authMiddleware, updateMissingPersonStatus);
// Deleting a case record is destructive — officer only
router.delete('/:id', authMiddleware, officerMiddleware, deleteMissingPerson);

// Advanced Missing Persons routes
router.post('/search-face', authMiddleware, searchFace);
router.patch('/:id/reunify', authMiddleware, triggerReunification);
router.get('/cross-reference', authMiddleware, runCrossReference);

export default router;
