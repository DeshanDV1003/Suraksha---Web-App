import prisma from '../utils/prisma';

export const issueReliefToken = async (data: any) => {
  const { userId, campId, maxUsage, expiresAt } = data;
  const code = `REL-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  
  return prisma.reliefToken.create({
    data: {
      userId,
      campId,
      code,
      qrCodeData: code, // In a real app, this might be a signed JWT or similar
      maxUsage: maxUsage || 1,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    }
  });
};

export const claimReliefToken = async (data: any) => {
  const { code, claimedBy, itemType, quantity, campId, notes } = data;
  
  const token = await prisma.reliefToken.findUnique({
    where: { code }
  });

  if (!token) throw new Error('Token not found');
  if (token.status !== 'ACTIVE') throw new Error('Token is not active');
  if (token.expiresAt && new Date() > token.expiresAt) throw new Error('Token has expired');
  if (token.usageCount >= token.maxUsage) throw new Error('Token usage limit reached');

  const claim = await prisma.reliefTokenClaim.create({
    data: {
      tokenId: token.id,
      claimedBy,
      itemType,
      quantity,
      campId,
      notes
    }
  });

  const newUsageCount = token.usageCount + 1;
  const newStatus = newUsageCount >= token.maxUsage ? 'FULLY_USED' : 'PARTIALLY_USED';

  await prisma.reliefToken.update({
    where: { id: token.id },
    data: { 
      usageCount: newUsageCount,
      status: newStatus as any
    }
  });

  return claim;
};

export const recordDistribution = async (deliveredBy: string, data: any) => {
  const { tokenId, itemType, quantity, location, proofImage } = data;
  return prisma.distribution.create({
    data: {
      tokenId,
      itemType,
      quantity,
      deliveredBy,
      location,
      proofImage
    }
  });
};

export const getReliefTokenByCode = async (code: string) => {
  return prisma.reliefToken.findUnique({
    where: { code },
    include: { 
      user: { select: { name: true, phone: true } },
      claims: true
    }
  });
};
