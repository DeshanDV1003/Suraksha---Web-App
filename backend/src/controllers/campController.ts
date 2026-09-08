import { Request, Response } from 'express';
import * as campService from '../services/campService';
import { InventoryItemType, ReferralStatus } from '../../prisma/generated/client';
import { getIO } from '../utils/socketInstance';

export const createCamp = async (req: Request, res: Response) => {
  try {
    const { name, location, latitude, longitude, totalCapacity, services } = req.body;
    const capacity = parseInt(String(totalCapacity));
    if (!name || !location || isNaN(capacity) || capacity <= 0) {
      return res.status(400).json({ message: 'name, location and a positive totalCapacity are required' });
    }
    const camp = await campService.createCamp({
      name,
      location,
      latitude: latitude ? parseFloat(latitude.toString()) : null,
      longitude: longitude ? parseFloat(longitude.toString()) : null,
      totalCapacity: capacity,
      services: Array.isArray(services) ? services : [],
    });
    res.status(201).json(camp);
  } catch (error) {
    console.error('[camps]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCamps = async (req: Request, res: Response) => {
  try {
    const camps = await campService.getAllCamps();
    res.json(camps);
  } catch (error) {
    console.error('[camps]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCampById = async (req: Request, res: Response) => {
  try {
    const camp = await campService.getCampById(req.params.id as string);
    if (!camp) return res.status(404).json({ message: 'Camp not found' });
    res.json(camp);
  } catch (error) {
    console.error('[camps]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateOccupancy = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { currentOccupancy } = req.body;
    const occ = parseInt(String(currentOccupancy));
    if (isNaN(occ) || occ < 0) {
      return res.status(400).json({ message: 'currentOccupancy must be a non-negative number.' });
    }
    const camp = await campService.getCampById(id);
    if (!camp) return res.status(404).json({ message: 'Camp not found.' });
    if (occ > camp.totalCapacity) {
      return res.status(400).json({ message: `Occupancy (${occ}) cannot exceed the camp's total capacity (${camp.totalCapacity}).` });
    }
    const result = await campService.updateCampOccupancy(id, occ);
    res.json(result);
  } catch (error) {
    console.error('[camps]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// --- Residents ---
export const getResidents = async (req: Request, res: Response) => {
  try {
    const residents = await campService.getCampResidents(req.params.id as string);
    res.json(residents);
  } catch (error) {
    console.error('[camps]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addResident = async (req: Request, res: Response) => {
  try {
    const result = await campService.addCampResident(req.params.id as string, req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('[camps]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const checkoutResident = async (req: Request, res: Response) => {
  try {
    const resident = await campService.checkoutResident(req.params.residentId as string);
    res.json(resident);
  } catch (error) {
    console.error('[camps]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// --- Inventory ---
const INVENTORY_ITEMS = ['FOOD', 'WATER', 'MEDICAL', 'BLANKETS', 'HYGIENE'];

export const updateInventory = async (req: Request, res: Response) => {
  try {
    const { itemType, quantity, threshold } = req.body;
    if (!INVENTORY_ITEMS.includes(itemType)) {
      return res.status(400).json({ message: `itemType must be one of ${INVENTORY_ITEMS.join(', ')}` });
    }
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({ message: 'quantity must be a non-negative number' });
    }
    const inv = await campService.updateCampInventory(req.params.id as string, itemType as InventoryItemType, qty, threshold ? parseInt(threshold) : undefined);
    res.json(inv);
  } catch (error) {
    console.error('[camps]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// --- Schedule ---
export const addSchedule = async (req: Request, res: Response) => {
  try {
    const schedule = await campService.addCampSchedule(req.params.id as string, req.body);
    res.status(201).json(schedule);
  } catch (error) {
    console.error('[camps]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    await campService.deleteCampSchedule(req.params.scheduleId as string);
    res.json({ success: true });
  } catch (error) {
    console.error('[camps]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// --- Referrals ---
export const addReferral = async (req: Request, res: Response) => {
  try {
    const referral = await campService.createHospitalReferral(req.params.id as string, req.body);
    // Notify hospital staff in real-time if referral was assigned to a specific hospital
    if (referral.hospitalId) {
      try {
        getIO().to(`hospital:${referral.hospitalId}`).emit('new-referral', referral);
      } catch (_) {}
    }
    res.status(201).json(referral);
  } catch (error) {
    console.error('[camps]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateReferral = async (req: Request, res: Response) => {
  try {
    const referral = await campService.updateReferralStatus(req.params.referralId as string, req.body.status as ReferralStatus);
    res.json(referral);
  } catch (error) {
    console.error('[camps]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// --- Transfers ---
export const getAllTransfers = async (_req: Request, res: Response) => {
  try {
    const transfers = await campService.getAllTransferRequests();
    res.json(transfers);
  } catch (error) {
    console.error('[camps]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTransferSuggestions = async (_req: Request, res: Response) => {
  try {
    const suggestions = await campService.getTransferSuggestions();
    res.json(suggestions);
  } catch (error) {
    console.error('[camps]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTransfer = async (req: Request, res: Response) => {
  try {
    const { toCampId, peopleCount } = req.body;
    const transfer = await campService.createTransferRequest(req.params.id as string, toCampId, parseInt(peopleCount));
    res.status(201).json(transfer);
  } catch (error) {
    console.error('[camps]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTransfer = async (req: Request, res: Response) => {
  try {
    const transfer = await campService.updateTransferRequestStatus(req.params.transferId as string, req.body.status);
    res.json(transfer);
  } catch (error) {
    console.error('[camps]', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
