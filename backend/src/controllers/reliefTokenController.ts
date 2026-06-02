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

export const getReliefTokens = async (req: Request, res: Response) => {
  try {
    const tokens = await reliefTokenService.getReliefTokens();
    res.json(tokens);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getReliefTokenByCode = async (req: Request, res: Response) => {
  try {
    const token = await reliefTokenService.getReliefTokenByCode(req.params.code as string);
    if (!token) return res.status(404).json({ message: 'Token not found' });
    res.json(token);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const createDonorCampaign = async (req: Request, res: Response) => {
  try {
    const campaign = await reliefTokenService.createDonorCampaign(req.body);
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getDonorCampaigns = async (req: Request, res: Response) => {
  try {
    const campaigns = await reliefTokenService.getDonorCampaigns();
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getFraudAnalytics = async (req: Request, res: Response) => {
  try {
    const analytics = await reliefTokenService.getFraudAnalytics();
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
