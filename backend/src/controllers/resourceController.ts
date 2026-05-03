import { Request, Response } from 'express';
import * as resourceService from '../services/resourceService';

export const getResources = async (req: Request, res: Response) => {
  try {
    const resources = await resourceService.getAllResources();
    res.json(resources);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createResource = async (req: Request, res: Response) => {
  try {
    const resource = await resourceService.createResource(req.body);

    // Emit socket event for real-time update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('resource_added', resource);
    }

    res.status(201).json(resource);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateResourceStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const resource = await resourceService.updateResourceStatus(id, status);
    res.json(resource);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
