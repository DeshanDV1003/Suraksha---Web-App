import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const updateUserRole = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const deleteUser = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id }
    });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
export const updateProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { name, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, phone },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        volunteerProfile: true,
        reliefTokens: true,
        helpRequests: true,
        supportRequests: true,
        assignedTasks: true,
      }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
