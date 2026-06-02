import { Request, Response } from 'express';
import * as mapService from '../services/mapService';

export const createEvacuationRoute = async (req: Request, res: Response) => {
  try {
    const route = await mapService.createEvacuationRoute(req.body);
    res.status(201).json(route);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getEvacuationRoutes = async (req: Request, res: Response) => {
  try {
    const routes = await mapService.getEvacuationRoutes();
    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const createVolunteerLocation = async (req: Request, res: Response) => {
  try {
    const loc = await mapService.createVolunteerLocation(req.body);
    res.status(201).json(loc);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getVolunteerLocations = async (req: Request, res: Response) => {
  try {
    const locs = await mapService.getVolunteerLocations();
    res.json(locs);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const createThreatProjection = async (req: Request, res: Response) => {
  try {
    const proj = await mapService.createThreatProjection(req.body);
    res.status(201).json(proj);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getThreatProjections = async (req: Request, res: Response) => {
  try {
    const projs = await mapService.getThreatProjections();
    res.json(projs);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
