import { Request, Response } from 'express';
import * as incidentService from '../services/incidentService';

export const createIncident = async (req: any, res: Response) => {
  try {
    const reporterId = req.user.userId;
    const incident = await incidentService.createIncident({ ...req.body, reporterId });

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
    const incidents = await incidentService.getAllIncidents();
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getUserIncidents = async (req: any, res: Response) => {
  try {
    const reporterId = req.user.userId;
    const incidents = await incidentService.getIncidentsByUser(reporterId);
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const updateIncidentStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const incident = await incidentService.updateIncidentStatus(id, status);

    // Emit socket event for update
    const io = req.app.get('socketio');
    io.emit('incident-updated', incident);

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const deleteIncident = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await incidentService.deleteIncident(id);
    res.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getIncidentById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const incident = await incidentService.getIncidentById(id);
    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
