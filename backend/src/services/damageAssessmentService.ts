import prisma from '../utils/prisma';

// 1. AI-Assisted Damage Classification (Mock)
export const aiClassifyImage = async (imageUrl: string) => {
  // Simulate 3 seconds ML latency
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Fake ML output based on random chance
  const rand = Math.random();
  let severity = 'MINOR';
  let cost = 50000; // LKR
  
  if (rand > 0.8) {
    severity = 'DESTROYED';
    cost = 2500000;
  } else if (rand > 0.5) {
    severity = 'MAJOR';
    cost = 800000;
  } else if (rand > 0.2) {
    severity = 'MODERATE';
    cost = 250000;
  }

  return { severity, estimatedCost: cost };
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
