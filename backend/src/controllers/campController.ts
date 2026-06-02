import { Request, Response } from 'express';
import * as campService from '../services/campService';
import { InventoryItemType, ReferralStatus } from '../../prisma/generated/client';

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

export const getCampById = async (req: Request, res: Response) => {
  try {
    const camp = await campService.getCampById(req.params.id as string);
    if (!camp) return res.status(404).json({ message: 'Camp not found' });
    res.json(camp);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const updateOccupancy = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { currentOccupancy } = req.body;
    const result = await campService.updateCampOccupancy(id, parseInt(currentOccupancy.toString()));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

// --- Residents ---
export const getResidents = async (req: Request, res: Response) => {
  try {
    const residents = await campService.getCampResidents(req.params.id as string);
    res.json(residents);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const addResident = async (req: Request, res: Response) => {
  try {
    const result = await campService.addCampResident(req.params.id as string, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const checkoutResident = async (req: Request, res: Response) => {
  try {
    const resident = await campService.checkoutResident(req.params.residentId as string);
    res.json(resident);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

// --- Inventory ---
export const updateInventory = async (req: Request, res: Response) => {
  try {
    const { itemType, quantity, threshold } = req.body;
    const inv = await campService.updateCampInventory(req.params.id as string, itemType as InventoryItemType, parseInt(quantity), threshold ? parseInt(threshold) : undefined);
    res.json(inv);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

// --- Schedule ---
export const addSchedule = async (req: Request, res: Response) => {
  try {
    const schedule = await campService.addCampSchedule(req.params.id as string, req.body);
    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    await campService.deleteCampSchedule(req.params.scheduleId as string);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

// --- Referrals ---
export const addReferral = async (req: Request, res: Response) => {
  try {
    const referral = await campService.createHospitalReferral(req.params.id as string, req.body);
    res.status(201).json(referral);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const updateReferral = async (req: Request, res: Response) => {
  try {
    const referral = await campService.updateReferralStatus(req.params.referralId as string, req.body.status as ReferralStatus);
    res.json(referral);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

// --- Transfers ---
export const createTransfer = async (req: Request, res: Response) => {
  try {
    const { toCampId, peopleCount } = req.body;
    const transfer = await campService.createTransferRequest(req.params.id as string, toCampId, parseInt(peopleCount));
    res.status(201).json(transfer);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const updateTransfer = async (req: Request, res: Response) => {
  try {
    const transfer = await campService.updateTransferRequestStatus(req.params.transferId as string, req.body.status);
    res.json(transfer);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
