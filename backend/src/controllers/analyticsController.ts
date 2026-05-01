import { Request, Response } from 'express';
import * as analyticsService from '../services/analyticsService';

export const getOperationalIntelligence = async (req: Request, res: Response) => {
  try {
    const stats = await analyticsService.getOperationalIntelligence();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
