import { Response } from 'express';
import prisma from '../utils/prisma';

export const createSupplyRequest = async (req: any, res: Response): Promise<any> => {
  try {
    const requesterId = req.user.userId;
    const { campId, itemType, quantity, urgency, notes } = req.body;
    if (!itemType || !quantity) {
      return res.status(400).json({ message: 'itemType and quantity are required' });
    }
    const request = await prisma.campSupplyRequest.create({
      data: {
        requesterId,
        campId: campId || null,
        itemType,
        quantity: parseInt(quantity),
        urgency: urgency || 'MEDIUM',
        notes: notes || null,
      },
      include: { requester: { select: { id: true, name: true, role: true } }, camp: { select: { id: true, name: true } } },
    });
    return res.status(201).json(request);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating supply request', error });
  }
};

export const getAllSupplyRequests = async (req: any, res: Response): Promise<any> => {
  try {
    const { status, urgency } = req.query;
    const where: any = {};
    if (status) where.status = String(status);
    if (urgency) where.urgency = String(urgency);
    const requests = await prisma.campSupplyRequest.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true, role: true, phone: true } },
        camp: { select: { id: true, name: true, location: true } },
      },
      orderBy: [
        { urgency: 'desc' },
        { createdAt: 'desc' },
      ],
    });
    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching supply requests', error });
  }
};

export const updateSupplyRequestStatus = async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const VALID_STATUSES = ['PENDING', 'APPROVED', 'DISPATCHED', 'FULFILLED', 'REJECTED'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    const updated = await prisma.campSupplyRequest.update({
      where: { id },
      data: { status },
      include: { requester: { select: { id: true, name: true } }, camp: { select: { id: true, name: true } } },
    });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating supply request status', error });
  }
};

export const getMySupplyRequests = async (req: any, res: Response): Promise<any> => {
  try {
    const requesterId = req.user.userId;
    const requests = await prisma.campSupplyRequest.findMany({
      where: { requesterId },
      include: { camp: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching your supply requests', error });
  }
};
