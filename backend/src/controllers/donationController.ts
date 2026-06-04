import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const createDonation = async (req: any, res: Response): Promise<any> => {
  try {
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

    const donation = await prisma.donation.create({
      data: {
        donorId: userId,
        donorName: donorName || (req.user ? req.user.name : 'Anonymous'),
        type,
        amount: amount ? parseFloat(amount) : null,
        itemsDescription,
        transactionId,
        paymentGateway,
        transactionDate: transactionDate ? new Date(transactionDate) : null,
        campId
      }
    });

    return res.status(201).json(donation);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating donation', error });
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
    return res.status(500).json({ message: 'Error fetching donations', error });
  }
};

export const updateDonationStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const donation = await prisma.donation.update({
      where: { id: id as string },
      data: { status }
    });

    return res.json(donation);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating donation status', error });
  }
};
