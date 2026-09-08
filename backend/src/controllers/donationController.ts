import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { requireFields, sendError } from '../utils/apiError';

export const createDonation = async (req: any, res: Response): Promise<any> => {
  try {
    requireFields(req.body, ['donorName', 'type']);
    const userId = req.user ? req.user.userId : null;
    const {
      donorName,
      type,
      amount,
      itemsDescription,
      transactionId,
      paymentGateway,
      transactionDate,
      campId
    } = req.body;

    const parsedAmount = amount !== undefined && amount !== null && amount !== '' ? parseFloat(amount) : null;
    if (parsedAmount !== null && (isNaN(parsedAmount) || parsedAmount <= 0)) {
      return res.status(400).json({ message: 'Donation amount must be a positive number.' });
    }
    if (type === 'MONETARY' && (parsedAmount === null || parsedAmount <= 0)) {
      return res.status(400).json({ message: 'A monetary donation requires a positive amount.' });
    }

    const donation = await prisma.donation.create({
      data: {
        donorId: userId,
        donorName: donorName || (req.user ? req.user.name : 'Anonymous'),
        type,
        amount: parsedAmount,
        itemsDescription,
        transactionId,
        paymentGateway,
        transactionDate: transactionDate ? new Date(transactionDate) : null,
        campId
      }
    });

    return res.status(201).json(donation);
  } catch (error) {
    return sendError(res, error, 'Error creating donation');
  }
};

export const getDonations = async (req: Request, res: Response): Promise<any> => {
  try {
    const donations = await prisma.donation.findMany({
      include: {
        camp: { select: { id: true, name: true } },
        donor: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(donations);
  } catch (error) {
    return sendError(res, error, 'Error fetching donations');
  }
};

const DONATION_STATUSES = ['PENDING', 'RECEIVED', 'ALLOCATED'];

export const updateDonationStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!DONATION_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of ${DONATION_STATUSES.join(', ')}` });
    }

    const existing = await prisma.donation.findUnique({ where: { id: id as string } });
    if (!existing) return res.status(404).json({ message: 'Donation not found' });

    const donation = await prisma.donation.update({
      where: { id: id as string },
      data: { status }
    });

    return res.json(donation);
  } catch (error) {
    return sendError(res, error, 'Error updating donation status');
  }
};
