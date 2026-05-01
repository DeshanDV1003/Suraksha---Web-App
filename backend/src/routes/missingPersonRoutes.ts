import { Router } from 'express';
import { 
  getMissingPersons, 
  reportMissingPerson, 
  updateMissingPersonStatus,
  deleteMissingPerson
} from '../controllers/missingPersonController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', getMissingPersons);
router.post('/', authMiddleware, reportMissingPerson);
router.patch('/:id/status', authMiddleware, updateMissingPersonStatus);
router.delete('/:id', authMiddleware, deleteMissingPerson);

export default router;
