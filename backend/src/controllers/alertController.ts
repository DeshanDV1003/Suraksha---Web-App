import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const createAlert = async (req: Request, res: Response) => {
  try {
    const { title, message, location, type } = req.body;

    const alert = await prisma.alert.create({
      data: {
        title,
        message,
        location,
        type: type || 'INFO',
      },
    });

    // Emit socket event for real-time alert
    const io = req.app.get('socketio');
    io.emit('new-alert', alert);

    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getAlerts = async (req: Request, res: Response) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const deactivateAlert = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const alert = await prisma.alert.update({
      where: { id },
      data: { active: false },
    });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const deleteAlert = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.alert.delete({
      where: { id },
    });
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
