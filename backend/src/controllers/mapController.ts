import { Request, Response } from 'express';
import * as mapService from '../services/mapService';
import { computeSafeRoutes } from '../services/safeRouteService';

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

export const getSafeRoute = async (req: Request, res: Response) => {
  try {
    const { fromLat, fromLng, toLat, toLng, destType } = req.body;
    if (fromLat == null || fromLng == null) {
      return res.status(400).json({ message: 'fromLat and fromLng are required' });
    }
    const result = await computeSafeRoutes({
      fromLat:  parseFloat(fromLat),
      fromLng:  parseFloat(fromLng),
      toLat:    toLat != null ? parseFloat(toLat) : undefined,
      toLng:    toLng != null ? parseFloat(toLng) : undefined,
      destType: destType || 'SAFE_ZONE',
    });
    res.json(result);
  } catch (error: any) {
    console.error('Safe route error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const exportRoutePdf = async (req: Request, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Evacuation_Route.pdf"');
    await mapService.exportRoutePdf(req.body, res);
  } catch (error) {
    console.error('Failed to export route PDF', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error', error });
    }
  }
};
