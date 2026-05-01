import { Request, Response } from 'express';
import * as reliefTokenService from '../services/reliefTokenService';

export const issueReliefToken = async (req: any, res: Response) => {
  try {
    const token = await reliefTokenService.issueReliefToken(req.body);
    res.status(201).json(token);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const claimReliefToken = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const claim = await reliefTokenService.claimReliefToken({ ...req.body, claimedBy: userId });
    res.status(201).json(claim);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const recordDistribution = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const distribution = await reliefTokenService.recordDistribution(userId, req.body);
    res.status(201).json(distribution);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
