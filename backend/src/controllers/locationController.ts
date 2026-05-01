import { Request, Response } from 'express';
import * as locationService from '../services/locationService';

export const logLocation = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { latitude, longitude } = req.body;
    const log = await locationService.saveLocationLog(userId, latitude, longitude);
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getUserLastLocation = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const location = await locationService.getLatestUserLocation(userId as string);
    res.json(location);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
