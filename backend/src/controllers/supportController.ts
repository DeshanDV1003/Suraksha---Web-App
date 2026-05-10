import { Request, Response } from 'express';
import * as supportService from '../services/supportService';

/**
 * @swagger
 * tags:
 *   name: PsychologicalSupport
 *   description: Psychological support and counseling requests
 */

/**
 * @swagger
 * /api/support:
 *   post:
 *     summary: Create a new psychological support request
 *     tags: [PsychologicalSupport]
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
 *               - description
 *             properties:
 *               type: { type: string, enum: [COUNSELING, CHILD_SUPPORT, TRAUMA_CARE, GRIEF_SUPPORT, GENERAL] }
 *               description: { type: string }
 *               urgency: { type: string, enum: [LOW, MEDIUM, HIGH, CRITICAL] }
 *               anonymous: { type: boolean }
 *               location: { type: string }
 *               affectedCount: { type: integer }
 *     responses:
 *       201:
 *         description: Request created successfully
 */
export const createSupportRequest = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const request = await supportService.createSupportRequest(userId, req.body);

    const io = req.app.get('socketio');
    io.emit('new-support-request', request);

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/support:
 *   get:
 *     summary: Get all psychological support requests
 *     tags: [PsychologicalSupport]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of support requests (Anonymous requests are masked)
 */
export const getSupportRequests = async (req: Request, res: Response) => {
  try {
    const requests = await supportService.getSupportRequests();
    
    const maskedRequests = requests.map((r: any) => {
      if (r.anonymous) {
        return { ...r, user: { name: 'Anonymous', phone: 'Hidden' } };
      }
      return r;
    });

    res.json(maskedRequests);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/support/{id}/status:
 *   patch:
 *     summary: Update support request status
 *     tags: [PsychologicalSupport]
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
 *             properties:
 *               status: { type: string, enum: [PENDING, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED] }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Status updated
 */
export const updateSupportStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const request = await supportService.updateSupportStatus(id, req.body);
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
