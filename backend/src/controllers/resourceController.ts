import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getResources = async (req: Request, res: Response) => {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(resources);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createResource = async (req: Request, res: Response) => {
  try {
    const { type, owner, location, capacity, status, contact } = req.body;
    const resource = await prisma.resource.create({
      data: {
        type,
        owner,
        location,
        capacity,
        status: status || 'AVAILABLE',
        contact,
      },
    });

    // Emit socket event for real-time update
    const io = req.app.get('socketio');
    io.emit('resource_added', resource);

    res.status(201).json(resource);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateResourceStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const resource = await prisma.resource.update({
      where: { id: id as string },
      data: { status },
    });
    res.json(resource);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
