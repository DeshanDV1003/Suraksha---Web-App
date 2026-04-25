import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// ================================
// RELIEF TOKENS (QR SYSTEM)
// ================================

export const issueReliefToken = async (req: any, res: Response) => {
  try {
    const { userId, campId, maxUsage, expiresAt } = req.body;
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const token = await prisma.reliefToken.create({
      data: {
        code,
        qrCodeData: `SURAKSHA-TOKEN-${code}`,
        userId,
        campId,
        maxUsage: maxUsage || 1,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }
    });

    res.status(201).json(token);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

export const claimReliefToken = async (req: any, res: Response) => {
  try {
    const { code, itemType, quantity, proofImage, campId, notes } = req.body;
    const claimedBy = req.user.userId;

    const token = await prisma.reliefToken.findUnique({
      where: { code },
      include: { claims: true }
    });

    if (!token) return res.status(404).json({ message: 'Token not found' });
    if (token.status !== 'ACTIVE') return res.status(400).json({ message: 'Token is not active' });
    if (token.usageCount >= token.maxUsage) return res.status(400).json({ message: 'Token usage limit reached' });

    const claim = await prisma.reliefTokenClaim.create({
      data: {
        tokenId: token.id,
        claimedBy,
        itemType,
        quantity,
        proofImage,
        campId,
        notes
      }
    });

    // Update token status
    const newUsageCount = token.usageCount + 1;
    const newStatus = newUsageCount >= token.maxUsage ? 'FULLY_USED' : 'PARTIALLY_USED';

    await prisma.reliefToken.update({
      where: { id: token.id },
      data: { 
        usageCount: newUsageCount,
        status: newStatus
      }
    });

    res.status(201).json(claim);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};

// ================================
// DISTRIBUTIONS (LEGACY TOKEN SYSTEM)
// ================================

export const recordDistribution = async (req: any, res: Response) => {
  try {
    const { tokenId, itemType, quantity, location, proofImage } = req.body;
    const deliveredBy = req.user.userId;

    const distribution = await prisma.distribution.create({
      data: {
        tokenId,
        itemType,
        quantity,
        deliveredBy,
        location,
        proofImage
      }
    });

    res.status(201).json(distribution);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
};
