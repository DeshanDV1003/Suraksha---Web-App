import { Request, Response } from 'express';
import * as notificationService from '../services/notificationService';

export const getMyNotifications = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const notifications = await notificationService.getUserNotifications(userId);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const markAsRead = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markNotificationRead(id);
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
