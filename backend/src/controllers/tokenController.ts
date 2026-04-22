import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import crypto from 'crypto';

export const getTokens = async (req: Request, res: Response) => {
  try {
    const tokens = await prisma.token.findMany({
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tokens);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createToken = async (req: Request, res: Response) => {
  try {
    const { userId, type } = req.body;
    
    // Generate unique code SRK-YEAR-RANDOM
    const year = new Date().getFullYear();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    const code = `SRK-${year}-${random}`;

    const token = await prisma.token.create({
      data: {
        code,
        userId,
        type: type || 'RELIEF',
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    res.status(201).json(token);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const useToken = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    
    const token = await prisma.token.findUnique({
      where: { code }
    });

    if (!token) {
      return res.status(404).json({ message: 'Token not found' });
    }

    if (token.status !== 'ACTIVE') {
      return res.status(400).json({ message: `Token is already ${token.status}` });
    }

    const updatedToken = await prisma.token.update({
      where: { code },
      data: { status: 'USED' }
    });

    res.json(updatedToken);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
