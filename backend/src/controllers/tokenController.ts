import { Request, Response } from 'express';
import * as tokenService from '../services/tokenService';

export const getTokens = async (req: Request, res: Response) => {
  try {
    const tokens = await tokenService.listTokens();
    res.json(tokens);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createToken = async (req: Request, res: Response) => {
  try {
    const { userId, type } = req.body;
    const token = await tokenService.createToken(userId, type);
    res.status(201).json(token);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const useToken = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const token = await tokenService.useToken(code);
    res.json(token);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
