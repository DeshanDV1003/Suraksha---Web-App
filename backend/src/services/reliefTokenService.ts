import prisma from '../utils/prisma';
import QRCode from 'qrcode';
import { TokenCategory, TokenStatus } from '../../prisma/generated/client';

export const issueReliefToken = async (data: any) => {
  const { userId, campId, maxUsage, expiresAt, categories, isHouseholdBundle, householdId, donorId } = data;
  const code = `SRK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  
  // Generate QR code data URI
  const qrCodeDataURI = await QRCode.toDataURL(code);

  return prisma.reliefToken.create({
    data: {
      userId,
      campId,
      code,
      qrCodeData: qrCodeDataURI,
      maxUsage: maxUsage || 1,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      categories: categories || [],
      isHouseholdBundle: isHouseholdBundle || false,
      householdId: householdId || null,
      donorId: donorId || null,
      status: 'ACTIVE'
    }
  });
};

export const claimReliefToken = async (data: any) => {
  const { code, claimedBy, itemType, quantity, campId, notes, locationLat, locationLng } = data;
  
  const token = await prisma.reliefToken.findUnique({
    where: { code },
    include: { claims: true }
  });

  if (!token) throw new Error('Token not found');
  if (token.status !== 'ACTIVE' && token.status !== 'PARTIALLY_USED') throw new Error(`Token is ${token.status}`);
  if (token.expiresAt && new Date() > token.expiresAt) throw new Error('Token has expired');
  if (token.usageCount >= token.maxUsage) throw new Error('Token usage limit reached');

  // Basic Fraud Detection Heuristic
  let fraudRiskScore = token.fraudRiskScore;
  const now = new Date();
  
  // Rule 1: Multiple claims in short window (< 1 hour)
  const recentClaims = token.claims.filter(c => (now.getTime() - new Date(c.claimedAt).getTime()) < 3600000);
  if (recentClaims.length > 0) {
    fraudRiskScore += 0.3 * recentClaims.length;
  }

  // Rule 2: Large distance between consecutive claims
  if (locationLat && locationLng && token.claims.length > 0) {
    const lastClaim = token.claims[token.claims.length - 1];
    if (lastClaim.locationLat && lastClaim.locationLng) {
       // very rough coordinate distance check
       const dist = Math.abs(lastClaim.locationLat - locationLat) + Math.abs(lastClaim.locationLng - locationLng);
       if (dist > 0.5) { // Roughly > 50km
         fraudRiskScore += 0.5;
       }
    }
  }

  // Create claim
  const claim = await prisma.reliefTokenClaim.create({
    data: {
      tokenId: token.id,
      claimedBy,
      itemType,
      quantity: quantity || 1,
      campId,
      notes,
      locationLat: locationLat ? parseFloat(locationLat.toString()) : null,
      locationLng: locationLng ? parseFloat(locationLng.toString()) : null
    }
  });

  const newUsageCount = token.usageCount + 1;
  const newStatus: TokenStatus = newUsageCount >= token.maxUsage ? 'FULLY_USED' : 'PARTIALLY_USED';

  await prisma.reliefToken.update({
    where: { id: token.id },
    data: { 
      usageCount: newUsageCount,
      status: newStatus,
      fraudRiskScore: Math.min(1.0, fraudRiskScore) // cap at 1.0 (100%)
    }
  });

  return claim;
};

export const getReliefTokens = async () => {
  return prisma.reliefToken.findMany({
    include: {
      user: { select: { name: true, phone: true } },
      donor: true,
      claims: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getReliefTokensByUser = async (userId: string) => {
  return prisma.reliefToken.findMany({
    where: { userId },
    include: { claims: true },
    orderBy: { createdAt: 'desc' }
  });
};

export const getReliefTokenByCode = async (code: string) => {
  return prisma.reliefToken.findUnique({
    where: { code },
    include: { 
      user: { select: { name: true, phone: true } },
      claims: true,
      donor: true
    }
  });
};

export const createDonorCampaign = async (data: any) => {
  return prisma.donorCampaign.create({
    data: {
      donorName: data.donorName,
      contributionAmount: parseFloat(data.contributionAmount.toString()),
      targetCategories: data.targetCategories || []
    }
  });
};

export const getDonorCampaigns = async () => {
  return prisma.donorCampaign.findMany({
    include: {
      tokens: { include: { claims: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getFraudAnalytics = async () => {
  const highRiskTokens = await prisma.reliefToken.findMany({
    where: { fraudRiskScore: { gte: 0.5 } },
    include: { user: true, claims: true }
  });
  return highRiskTokens;
};
