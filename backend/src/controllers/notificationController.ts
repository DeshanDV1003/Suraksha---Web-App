import { Request, Response } from 'express';
import * as notificationService from '../services/notificationService';

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notification management
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get current user's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
export const getMyNotifications = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const notifications = await notificationService.getUserNotifications(userId);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
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
 *         description: Notification marked as read
 */
export const markAsRead = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markNotificationRead(id);
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
