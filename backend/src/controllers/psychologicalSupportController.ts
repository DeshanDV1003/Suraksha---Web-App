import { Request, Response } from 'express';
import * as supportService from '../services/psychologicalSupportService';

export const getWellbeingTrends = async (req: Request, res: Response) => {
  try {
    const trends = await supportService.getWellbeingTrends();
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get trends' });
  }
};

export const getCheckIns = async (req: Request, res: Response) => {
  try {
    const checkIns = await supportService.getCheckIns();
    res.json(checkIns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get check-ins' });
  }
};

export const updateCheckIn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, nextDate } = req.body;
    const checkIn = await supportService.updateCheckIn(id as string, status, nextDate);
    res.json(checkIn);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update check-in' });
  }
};

export const getGuides = async (req: Request, res: Response) => {
  try {
    const guides = await supportService.getGuides();
    res.json(guides);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get guides' });
  }
};

export const getGroupSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await supportService.getGroupSessions();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get group sessions' });
  }
};

export const createGroupSession = async (req: Request, res: Response) => {
  try {
    const session = await supportService.createGroupSession(req.body);
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group session' });
  }
};

export const joinGroupSession = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const participant = await supportService.joinGroupSession(id as string, userId);
    res.json(participant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to join group session' });
  }
};

export const getChatSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await supportService.getChatSessions();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get chat sessions' });
  }
};

export const acceptChatSession = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const counselorId = req.user.userId;
    const session = await supportService.acceptChatSession(id as string, counselorId);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept chat session' });
  }
};

export const endChatSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { moodAfter } = req.body;
    const session = await supportService.endChatSession(id as string, moodAfter);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to end chat session' });
  }
};

export const sendChatMessage = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const senderId = req.user.userId;
    const message = await supportService.saveChatMessage(id as string, senderId, content);
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save chat message' });
  }
};

export const createChatRequest = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { moodBefore } = req.body;
    const session = await supportService.createChatSession(userId, moodBefore);
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create chat request' });
  }
};

export const getMyChatSessions = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const sessions = await supportService.getMyChatSessions(userId);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get my chat sessions' });
  }
};

export const submitMoodLog = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { mood } = req.body;
    const log = await supportService.submitMoodLog(userId, mood);
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit mood' });
  }
};
