import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const createCamp = async (req: Request, res: Response) => {
  try {
    const { name, location, latitude, longitude, totalCapacity, services } = req.body;

    const camp = await prisma.reliefCamp.create({
      data: {
        name,
        location,
        latitude: latitude ? parseFloat(latitude.toString()) : null,
        longitude: longitude ? parseFloat(longitude.toString()) : null,
        totalCapacity: parseInt(totalCapacity.toString()),
        services: services || [],
      },
    });

    res.status(201).json(camp);
  } catch (error) {
    console.error('CREATE_CAMP_ERROR:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getCamps = async (req: Request, res: Response) => {
  try {
    const camps = await prisma.reliefCamp.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    res.json(camps);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const updateOccupancy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { currentOccupancy, waitTime } = req.body;

    const camp = await prisma.reliefCamp.update({
      where: { id: id as string },
      data: { 
        currentOccupancy: parseInt(currentOccupancy.toString()), 
        waitTime 
      },
    });

    res.json(camp);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
