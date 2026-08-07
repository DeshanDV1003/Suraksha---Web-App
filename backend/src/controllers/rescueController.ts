import { Request, Response } from 'express';
import * as rescue from '../services/rescueService';

export const createVehicle = async (req: Request, res: Response) => {
  try {
    const vehicle = await rescue.createVehicle({ ...req.body, assignedById: (req as any).user?.userId });
    res.status(201).json(vehicle);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const getVehicles = async (_req: Request, res: Response) => {
  try { res.json(await rescue.getVehicles()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const getVehiclesByArea = async (req: Request, res: Response) => {
  try { res.json(await rescue.getVehiclesByArea(String(req.params.area))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const updateVehicleStatus = async (req: Request, res: Response) => {
  try { res.json(await rescue.updateVehicleStatus(String(req.params.id), req.body.status)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const deleteVehicle = async (req: Request, res: Response) => {
  try { await rescue.deleteVehicle(String(req.params.id)); res.json({ success: true }); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const createMission = async (req: Request, res: Response) => {
  try {
    const mission = await rescue.createMission({ ...req.body, assignedById: (req as any).user?.userId });
    res.status(201).json(mission);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const getMissions = async (_req: Request, res: Response) => {
  try { res.json(await rescue.getMissions()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const getMissionsByArea = async (req: Request, res: Response) => {
  try { res.json(await rescue.getMissionsByArea(String(req.params.area))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const updateMissionStatus = async (req: Request, res: Response) => {
  try {
    const mission = await rescue.updateMissionStatus(String(req.params.id), req.body.status, req.body.evacuatedCount);
    res.json(mission);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const markSafeZone = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const checkIn = await rescue.markSafeZone(userId, req.body.missionId, req.body.campId, req.body.notes);
    res.status(201).json(checkIn);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
};

export const getSafeZoneCheckIns = async (_req: Request, res: Response) => {
  try { res.json(await rescue.getSafeZoneCheckIns()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
};

export const getUserSafeZoneStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    res.json(await rescue.getUserSafeZoneStatus(userId));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
};
