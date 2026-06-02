import { Request, Response } from 'express';
import * as volunteerService from '../services/volunteerService';

export const getVolunteerProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const profile = await volunteerService.getVolunteerProfile(userId);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const addSkill = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const skill = await volunteerService.addSkill(userId, req.body);
    res.status(201).json(skill);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const addTraining = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const training = await volunteerService.addTraining(userId, req.body);
    res.status(201).json(training);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const checkIn = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const checkin = await volunteerService.checkIn(userId, req.body);
    res.status(201).json(checkin);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const checkOut = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const checkout = await volunteerService.checkOut(userId, req.params.checkInId);
    res.json(checkout);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const submitWellbeing = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const survey = await volunteerService.submitWellbeing(userId, req.body);
    res.status(201).json(survey);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getRecommendedIncidents = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const incidents = await volunteerService.getRecommendedIncidents(userId);
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const listVolunteers = async (req: Request, res: Response) => {
  try {
    const volunteers = await volunteerService.listAllVolunteers();
    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

// Legacy
export const createTask = async (req: any, res: Response) => {
  try {
    const task = await volunteerService.createTask({ ...req.body, assignedById: req.user.userId });
    const io = req.app.get('socketio');
    io.emit('new-task', task);
    res.status(201).json(task);
  } catch (error) { res.status(500).json({ message: 'Internal server error', error }); }
};

export const getMyTasks = async (req: any, res: Response) => {
  try {
    const tasks = await volunteerService.getTasksByVolunteer(req.user.userId);
    res.json(tasks);
  } catch (error) { res.status(500).json({ message: 'Internal server error', error }); }
};

export const updateTaskStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const task = await volunteerService.updateTaskStatus(id, status);
    const io = req.app.get('socketio');
    io.emit('task-updated', task);
    res.json(task);
  } catch (error) { res.status(500).json({ message: 'Internal server error', error }); }
};
