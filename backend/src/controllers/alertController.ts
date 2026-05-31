import { Request, Response } from 'express';
import * as alertService from '../services/alertService';

/**
 * @swagger
 * tags:
 *   name: Alerts
 *   description: Emergency alerts and notifications
 */

/**
 * @swagger
 * /api/alerts:
 *   post:
 *     summary: Create a new emergency alert
 *     tags: [Alerts]
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
 *               - message
 *               - location
 *             properties:
 *               title: { type: string }
 *               message: { type: string }
 *               location: { type: string }
 *               type: { type: string, enum: [INFO, WARNING, EMERGENCY] }
 *     responses:
 *       201:
 *         description: Alert created successfully
 */
export const createAlert = async (req: Request, res: Response) => {
  try {
    const alert = await alertService.createAlert(req.body);

    // Emit socket event for real-time alert with broadcast radius (in km)
    const io = req.app.get('socketio');
    io.emit('new-alert', { ...alert, broadcastRadiusKm: 20 });

    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: Get all active alerts
 *     tags: [Alerts]
 *     responses:
 *       200:
 *         description: List of alerts
 */
export const getAlerts = async (req: Request, res: Response) => {
  try {
    const alerts = await alertService.getAlerts();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/alerts/{id}/deactivate:
 *   patch:
 *     summary: Deactivate an alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert deactivated
 */
export const deactivateAlert = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const alert = await alertService.deactivateAlert(id);
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/alerts/{id}:
 *   delete:
 *     summary: Delete an alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert deleted
 */
export const deleteAlert = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await alertService.deleteAlert(id);
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
