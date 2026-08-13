import { Router } from 'express';
import {
  getWellbeingTrends,
  getCheckIns,
  updateCheckIn,
  getGuides,
  getGroupSessions,
  createGroupSession,
  joinGroupSession,
  getChatSessions,
  acceptChatSession,
  endChatSession,
  sendChatMessage,
  createChatRequest,
  getMyChatSessions,
  submitMoodLog
} from '../controllers/psychologicalSupportController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Dashboard & Trends
router.get('/trends', authMiddleware, getWellbeingTrends);

// Check-Ins
router.get('/checkins', authMiddleware, getCheckIns);
router.patch('/checkins/:id', authMiddleware, updateCheckIn);

// Guides
router.get('/guides', authMiddleware, getGuides);

// Group Therapy
router.get('/groups', authMiddleware, getGroupSessions);
router.post('/groups', authMiddleware, createGroupSession);
router.post('/groups/:id/join', authMiddleware, joinGroupSession);

// Chat Sessions
router.get('/chat/my', authMiddleware, getMyChatSessions);
router.get('/chat', authMiddleware, getChatSessions);
router.post('/chat', authMiddleware, createChatRequest);
router.patch('/chat/:id/accept', authMiddleware, acceptChatSession);
router.patch('/chat/:id/end', authMiddleware, endChatSession);
router.post('/chat/:id/message', authMiddleware, sendChatMessage);

// Mood Log
router.post('/mood', authMiddleware, submitMoodLog);

export default router;
