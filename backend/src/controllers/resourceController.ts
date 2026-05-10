import { Request, Response } from 'express';
import * as resourceService from '../services/resourceService';

/**
 * @swagger
 * tags:
 *   name: Resources
 *   description: Resource management and tracking
 */

/**
 * @swagger
 * /api/resources:
 *   get:
 *     summary: Get all resources
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of resources
 */
export const getResources = async (req: Request, res: Response) => {
  try {
    const resources = await resourceService.getAllResources();
    res.json(resources);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/resources:
 *   post:
 *     summary: Add a new resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - owner
 *               - location
 *               - capacity
 *               - contact
 *             properties:
 *               type: { type: string }
 *               owner: { type: string }
 *               location: { type: string }
 *               capacity: { type: string }
 *               contact: { type: string }
 *     responses:
 *       201:
 *         description: Resource added successfully
 */
export const createResource = async (req: Request, res: Response) => {
  try {
    const resource = await resourceService.createResource(req.body);

    // Emit socket event for real-time update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('resource_added', resource);
    }

    res.status(201).json(resource);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @swagger
 * /api/resources/{id}/status:
 *   patch:
 *     summary: Update resource status
 *     tags: [Resources]
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
 *               status: { type: string, enum: [AVAILABLE, IN_USE, UNAVAILABLE] }
 *     responses:
 *       200:
 *         description: Status updated
 */
export const updateResourceStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const resource = await resourceService.updateResourceStatus(id, status);
    res.json(resource);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
