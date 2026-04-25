import { Router } from 'express';
import { 
  upsertVolunteerProfile, 
  getVolunteerProfile, 
  listVolunteers, 
  createTask, 
  getMyTasks, 
  updateTaskStatus 
} from '../controllers/volunteerController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

// Profile
router.post('/profile', authMiddleware, upsertVolunteerProfile);
router.get('/profile', authMiddleware, getVolunteerProfile);
router.get('/list', authMiddleware, officerMiddleware, listVolunteers);

// Tasks
router.post('/tasks', authMiddleware, officerMiddleware, createTask);
router.get('/tasks/my', authMiddleware, getMyTasks);
router.patch('/tasks/:id/status', authMiddleware, updateTaskStatus);

export default router;
