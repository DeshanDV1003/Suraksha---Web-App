import { Request, Response } from 'express';
import * as alertService from '../services/alertService';
import { notifyAdmins, sendAlertPushToAll, sendAlertPushToRegion } from '../services/notificationService';

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

    // Broadcast to ALL connected clients — each client's GlobalAlertListener
    // checks the user's geolocation against the alert's coordinates and only
    // shows the popup if they are within the broadcast radius.
    const io = req.app.get('socketio');
    const radiusKm = req.body.broadcastRadiusKm || 50;
    io.emit('new-alert', { ...alert, broadcastRadiusKm: radiusKm });

    // Notify users — EMERGENCY alerts go to everyone (including mobile push),
    // other types only notify admin/staff roles
    const pushTitle = `🚨 ${alert.title}`;
    const pushBody = `${alert.message}${alert.locations?.length ? ` — ${alert.locations[0]}` : ''}`;
    if (alert.type === 'EMERGENCY') {
      // EMERGENCY: push to everyone
      sendAlertPushToAll(pushTitle, pushBody, { alertId: alert.id, type: alert.type }).catch(() => {});
    } else if ((alert.type as string) === 'WARNING' || (alert.type as string) === 'FLOOD' || (alert.type as string) === 'EVACUATION') {
      // WARNING/FLOOD/EVACUATION: push to affected regions only
      sendAlertPushToRegion(pushTitle, pushBody, alert.locations, { alertId: alert.id, type: alert.type }).catch(() => {});
    } else {
      notifyAdmins(pushTitle, pushBody).catch(() => {});
    }

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

export const getDeliveryStats = async (req: any, res: Response) => {
  try {
    const stats = await alertService.getAlertDeliveryStats(req.params.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const acknowledgeAlert = async (req: any, res: Response) => {
  try {
    const result = await alertService.acknowledgeAlert(req.params.id, req.user.userId);
    res.json({ message: 'Acknowledged', result });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
