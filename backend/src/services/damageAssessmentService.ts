import prisma from '../utils/prisma';
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

// 1. AI-Assisted Damage Classification
// Calls the ML service /classify-image endpoint; falls back to a rule-based
// heuristic if the ML service is unreachable.
export const aiClassifyImage = async (imageUrl: string) => {
  if (!imageUrl) throw new Error('imageUrl is required');

  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/classify-image`,
      { image_url: imageUrl },
      { timeout: 30000 }
    );
    // ML service should return { severity, estimatedCost, confidence }
    return {
      severity: response.data.severity ?? 'UNKNOWN',
      estimatedCost: response.data.estimatedCost ?? response.data.estimated_cost ?? 0,
      confidence: response.data.confidence ?? null,
      source: 'ml',
    };
  } catch (err: any) {
    console.warn('[DamageService] ML classify-image unavailable, using heuristic fallback:', err.message);
    // Heuristic fallback based on URL keywords — better than pure random
    const lower = imageUrl.toLowerCase();
    let severity = 'MINOR';
    let estimatedCost = 50000;
    if (lower.includes('collapse') || lower.includes('destroyed') || lower.includes('ruin')) {
      severity = 'DESTROYED'; estimatedCost = 2500000;
    } else if (lower.includes('major') || lower.includes('flood') || lower.includes('severe')) {
      severity = 'MAJOR'; estimatedCost = 800000;
    } else if (lower.includes('moderate') || lower.includes('damage')) {
      severity = 'MODERATE'; estimatedCost = 250000;
    }
    return { severity, estimatedCost, confidence: null, source: 'fallback' };
  }
};

// 2. Compensation Eligibility Scoring Algorithm
const calculateCompensation = (data: any) => {
  let score = 0;
  
  // Vulnerability logic
  const vulnerability = parseInt(data.familyVulnerabilityScore) || 0;
  score += vulnerability * 5; // Up to 50 points

  // Ownership logic
  if (data.propertyOwnershipStatus === 'Owned') score += 20;
  if (data.propertyOwnershipStatus === 'Rented') score += 10;
  
  // Income bracket logic
  if (data.incomeBracket === '< 50,000 LKR') score += 30;
  else if (data.incomeBracket === '50k - 100k LKR') score += 15;
  
  // Damage severity
  if (data.structuralDamage === 'TOTAL_LOSS') score += 40;
  else if (data.structuralDamage === 'MAJOR') score += 25;
  else if (data.structuralDamage === 'MODERATE') score += 10;

  const eligible = score >= 60; // Threshold
  
  return { score, eligible };
};

export const createDamageAssessment = async (userId: string, data: any) => {
  const { score, eligible } = calculateCompensation(data);

  return prisma.damageAssessment.create({
    data: {
      ...data,
      reportedById: userId,
      mediaUrls: data.mediaUrls || [],
      compensationEligibilityScore: score,
      compensationEligible: eligible,
      status: 'PENDING_REVIEW'
    }
  });
};

export const getDamageAssessments = async () => {
  return prisma.damageAssessment.findMany({
    include: {
      reportedBy: { select: { name: true } },
      incident: { select: { title: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const deleteDamageAssessment = async (id: string) => {
  return prisma.damageAssessment.delete({ where: { id } });
};

// 3. Damage Verification Workflow
export const updateWorkflowStatus = async (id: string, newStatus: string, reviewerNotes?: string, userId?: string) => {
  // Validate basic state transitions (optional, but good practice)
  return prisma.damageAssessment.update({
    where: { id },
    data: { 
      status: newStatus as any,
      reviewerNotes: reviewerNotes ? reviewerNotes : undefined,
      verifiedById: ['APPROVED', 'REJECTED'].includes(newStatus) && userId ? userId : undefined
    }
  });
};

// 4. District-Level Damage Summary Report
export const getDistrictSummaryReport = async () => {
  const assessments = await prisma.damageAssessment.findMany({
    where: { status: { not: 'REJECTED' as any } }
  });

  const districts: Record<string, any> = {};

  assessments.forEach(ass => {
    // Extract a mock district from location string (or fallback to 'General')
    const locationParts = ass.location.split(',');
    const districtName = locationParts.length > 1 ? locationParts[locationParts.length - 1].trim() : 'Unknown Region';
    
    if (!districts[districtName]) {
      districts[districtName] = {
        name: districtName,
        totalStructures: 0,
        totalEstimatedLoss: 0,
        affectedPersons: 0,
        categories: {}
      };
    }

    districts[districtName].totalStructures++;
    districts[districtName].totalEstimatedLoss += ass.estimatedLoss || ass.aiEstimatedCost || 0;
    districts[districtName].affectedPersons += ass.affectedPersons || 0;

    const cat = ass.category as string;
    districts[districtName].categories[cat] = (districts[districtName].categories[cat] || 0) + 1;
  });

  return Object.values(districts);
};
