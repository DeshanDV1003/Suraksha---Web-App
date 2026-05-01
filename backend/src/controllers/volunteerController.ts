import { Request, Response } from 'express';
import * as volunteerService from '../services/volunteerService';

export const upsertVolunteerProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const profile = await volunteerService.upsertVolunteerProfile(userId, req.body);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getVolunteerProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const profile = await volunteerService.getVolunteerProfile(userId);
    res.json(profile);
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

export const createTask = async (req: any, res: Response) => {
  try {
    const task = await volunteerService.createTask({
      ...req.body,
      assignedById: req.user.userId
    });

    const io = req.app.get('socketio');
    io.emit('new-task', task);

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getMyTasks = async (req: any, res: Response) => {
  try {
    const tasks = await volunteerService.getTasksByVolunteer(req.user.userId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const updateTaskStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const task = await volunteerService.updateTaskStatus(id, status);

    const io = req.app.get('socketio');
    io.emit('task-updated', task);

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
