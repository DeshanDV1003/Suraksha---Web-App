import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const createIncident = async (req: any, res: Response) => {
  try {
    const { title, description, location, latitude, longitude, category, images } = req.body;
    const reporterId = req.user.userId;

    const incident = await prisma.incidentReport.create({
      data: {
        title,
        description,
        location,
        latitude,
        longitude,
        category,
        images: images || [],
        reporterId,
      },
    });

    // Emit socket event for real-time update
    const io = req.app.get('socketio');
    io.emit('new-incident', incident);

    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getIncidents = async (req: Request, res: Response) => {
  try {
    const incidents = await prisma.incidentReport.findMany({
      include: {
        reporter: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getUserIncidents = async (req: any, res: Response) => {
  try {
    const reporterId = req.user.userId;
    const incidents = await prisma.incidentReport.findMany({
      where: { reporterId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const updateIncidentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const incident = await prisma.incidentReport.update({
      where: { id },
      data: { status },
    });

    // Emit socket event for update
    const io = req.app.get('socketio');
    io.emit('incident-updated', incident);

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const deleteIncident = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.incidentReport.delete({
      where: { id },
    });
    res.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getIncidentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const incident = await prisma.incidentReport.findUnique({
      where: { id },
      include: {
        reporter: {
          select: { name: true, email: true, phone: true },
        },
      },
    });
    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
