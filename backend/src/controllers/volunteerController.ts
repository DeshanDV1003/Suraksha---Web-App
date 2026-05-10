import { Request, Response } from 'express';
import * as volunteerService from '../services/volunteerService';

/**
 * @swagger
 * tags:
 *   name: Volunteers
 *   description: Volunteer management and task assignment
 */

/**
 * @swagger
 * /api/volunteers/profile:
 *   post:
 *     summary: Create or update volunteer profile
 *     tags: [Volunteers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skills: { type: array, items: { type: string } }
 *               availability: { type: boolean }
 *     responses:
 *       200:
 *         description: Profile updated
 */
export const upsertVolunteerProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const profile = await volunteerService.upsertVolunteerProfile(userId, req.body);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/volunteers/profile:
 *   get:
 *     summary: Get current user's volunteer profile
 *     tags: [Volunteers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Volunteer profile
 */
export const getVolunteerProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const profile = await volunteerService.getVolunteerProfile(userId);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/volunteers:
 *   get:
 *     summary: List all volunteers
 *     tags: [Volunteers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of volunteers
 */
export const listVolunteers = async (req: Request, res: Response) => {
  try {
    const volunteers = await volunteerService.listAllVolunteers();
    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/volunteers/tasks:
 *   post:
 *     summary: Create and assign a task
 *     tags: [Volunteers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               incidentId: { type: string }
 *               assignedToId: { type: string }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH, CRITICAL] }
 *               dueDate: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Task created
 */
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

/**
 * @swagger
 * /api/volunteers/tasks/my:
 *   get:
 *     summary: Get tasks assigned to current user
 *     tags: [Volunteers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tasks
 */
export const getMyTasks = async (req: any, res: Response) => {
  try {
    const tasks = await volunteerService.getTasksByVolunteer(req.user.userId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/volunteers/tasks/{id}/status:
 *   patch:
 *     summary: Update task status
 *     tags: [Volunteers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status: { type: string, enum: [PENDING, ASSIGNED, IN_PROGRESS, RESOLVED] }
 *     responses:
 *       200:
 *         description: Task status updated
 */
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
