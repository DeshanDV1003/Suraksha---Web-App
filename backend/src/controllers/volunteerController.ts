import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// ================================
// VOLUNTEER PROFILE
// ================================

export const upsertVolunteerProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { skills, availability } = req.body;

    const profile = await prisma.volunteerProfile.upsert({
      where: { userId },
      update: { skills, availability },
      create: { userId, skills, availability },
    });

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getVolunteerProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const profile = await prisma.volunteerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { name: true, email: true, phone: true }
        }
      }
    });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const listVolunteers = async (req: Request, res: Response) => {
  try {
    const volunteers = await prisma.volunteerProfile.findMany({
      include: {
        user: {
          select: { name: true, email: true, phone: true }
        }
      }
    });
    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

// ================================
// TASK MANAGEMENT
// ================================

export const createTask = async (req: any, res: Response) => {
  try {
    const assignedById = req.user.userId;
    const { title, description, incidentId, assignedToId, priority, dueDate } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        incidentId,
        assignedToId,
        assignedById,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    // Emit socket event
    const io = req.app.get('socketio');
    io.emit('new-task', task);

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getMyTasks = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const tasks = await prisma.task.findMany({
      where: { assignedToId: userId },
      include: {
        incident: true,
        assignedBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const updateTaskStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await prisma.task.update({
      where: { id },
      data: { status },
    });

    const io = req.app.get('socketio');
    io.emit('task-updated', task);

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
