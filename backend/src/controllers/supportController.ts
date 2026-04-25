import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const createSupportRequest = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { type, description, urgency, anonymous, location, affectedCount } = req.body;

    const request = await prisma.psychologicalSupportRequest.create({
      data: {
        userId,
        type,
        description,
        urgency,
        anonymous,
        location,
        affectedCount
      }
    });

    const io = req.app.get('socketio');
    io.emit('new-support-request', request);

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getSupportRequests = async (req: Request, res: Response) => {
  try {
    const requests = await prisma.psychologicalSupportRequest.findMany({
      include: {
        user: { 
          select: { name: true, phone: true } 
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Filter out user info if anonymous? Or handle in frontend. 
    // Here we'll return as is, but could mask if anonymous.
    const maskedRequests = requests.map(r => {
      if (r.anonymous) {
        return { ...r, user: { name: 'Anonymous', phone: 'Hidden' } };
      }
      return r;
    });

    res.json(maskedRequests);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const updateSupportStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes, assignedToId } = req.body;

    const request = await prisma.psychologicalSupportRequest.update({
      where: { id },
      data: { 
        status, 
        notes, 
        assignedToId 
      }
    });

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
