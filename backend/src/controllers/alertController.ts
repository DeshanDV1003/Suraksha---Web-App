import { Request, Response } from 'express';
import * as alertService from '../services/alertService';

export const createAlert = async (req: Request, res: Response) => {
  try {
    const alert = await alertService.createAlert(req.body);

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
    const alerts = await alertService.getAlerts();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const deactivateAlert = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const alert = await alertService.deactivateAlert(id);
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const deleteAlert = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await alertService.deleteAlert(id);
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
