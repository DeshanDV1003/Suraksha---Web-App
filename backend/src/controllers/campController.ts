import { Request, Response } from 'express';
import * as campService from '../services/campService';

export const createCamp = async (req: Request, res: Response) => {
  try {
    const { name, location, latitude, longitude, totalCapacity, services } = req.body;
    const camp = await campService.createCamp({
      name,
      location,
      latitude: latitude ? parseFloat(latitude.toString()) : null,
      longitude: longitude ? parseFloat(longitude.toString()) : null,
      totalCapacity: parseInt(totalCapacity.toString()),
      services: services || [],
    });
    res.status(201).json(camp);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getCamps = async (req: Request, res: Response) => {
  try {
    const camps = await campService.getAllCamps();
    res.json(camps);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const updateOccupancy = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { currentOccupancy } = req.body;
    const camp = await campService.updateCampOccupancy(id, parseInt(currentOccupancy.toString()));
    res.json(camp);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
