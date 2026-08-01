import { Router } from 'express';
import {
  getVolunteerProfile,
  addSkill,
  addTraining,
  checkIn,
  checkOut,
  submitWellbeing,
  getRecommendedIncidents,
  listVolunteers,
  createTask,
  getAllTasks,
  getMyTasks,
  updateTaskStatus
} from '../controllers/volunteerController';
import { authMiddleware, officerMiddleware } from '../middleware/auth';

const router = Router();

// Profile
router.get('/profile', authMiddleware, getVolunteerProfile);
router.post('/skills', authMiddleware, addSkill);
router.post('/trainings', authMiddleware, addTraining);

// Check-ins
router.post('/checkin', authMiddleware, checkIn);
router.post('/checkin/:checkInId/checkout', authMiddleware, checkOut);

// Wellbeing
router.post('/wellbeing', authMiddleware, submitWellbeing);

// Auto-matching
router.get('/recommended-incidents', authMiddleware, getRecommendedIncidents);

// Admin/Officer specific
router.get('/', authMiddleware, officerMiddleware, listVolunteers);

// Tasks
router.post('/tasks', authMiddleware, officerMiddleware, createTask);
router.get('/tasks/all', authMiddleware, officerMiddleware, getAllTasks);
router.get('/tasks/my', authMiddleware, getMyTasks);
router.patch('/tasks/:id/status', authMiddleware, updateTaskStatus);

export default router;
