import prisma from '../utils/prisma';

// Helper to auto-score priority
const calculatePriority = (text: string) => {
  const t = text.toLowerCase();
  if (t.includes('blood') || t.includes('trapped') || t.includes('heart') || t.includes('dying')) return 'CRITICAL';
  if (t.includes('injury') || t.includes('fire') || t.includes('flood') || t.includes('pregnant')) return 'HIGH';
  return 'MEDIUM';
};

// 1. Citizen Self-Service Request Portal
export const submitPublicRequest = async (data: any) => {
  const priority = calculatePriority(`${data.type} ${data.description}`);
  const { name, phone, ...helpData } = data;

  return prisma.helpRequest.create({
    data: {
      ...helpData,
      priority,
      status: 'PENDING'
    }
  });
};

// Original authenticated method (kept for backward compatibility)
export const createHelpRequest = async (userId: string, data: any) => {
  return prisma.helpRequest.create({
    data: { ...data, userId }
  });
};

export const getHelpRequests = async () => {
  return prisma.helpRequest.findMany({
    include: {
      user: { select: { name: true, phone: true } },
      escalations: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getMyHelpRequests = async (userId: string) => {
  return prisma.helpRequest.findMany({
    where: { userId },
    include: { escalations: true },
    orderBy: { createdAt: 'desc' }
  });
};

// 2. WhatsApp & SMS Request Intake
export const handleSMSWebhook = async (payload: { From: string, Body: string }) => {
  // Mock SMS parser: Expects format "HELP [Type] [Location] [People Count]"
  const body = payload.Body.trim();
  const parts = body.split(' ');
  
  if (parts[0].toUpperCase() !== 'HELP') {
    return 'Invalid format. Send HELP [Type] [Location] [Count]';
  }

  const type = parts[1] || 'General';
  const count = parseInt(parts[parts.length - 1]) || 1;
  const location = parts.slice(2, parts.length - 1).join(' ') || 'Unknown Location';

  const request = await prisma.helpRequest.create({
    data: {
      phone: payload.From,
      type,
      location,
      peopleCount: count,
      description: `SMS Request: ${body}`,
      priority: calculatePriority(body),
      status: 'PENDING'
    }
  });

  return `Suraksha: Request received (ID: ${request.id.slice(-6)}). Responder dispatching soon.`;
};

// 3. Request Assignment & Dispatch Workflow
export const assignResponder = async (requestId: string, volunteerId: string) => {
  const req = await prisma.helpRequest.update({
    where: { id: requestId },
    data: { assignedVolunteerId: volunteerId, status: 'ASSIGNED' as any }
  });

  // Mock Notification to Responder
  console.log(`[PUSH NOTIFICATION] To Volunteer ${volunteerId}: You have been assigned to Help Request ${requestId}`);
  
  // Mock Notification to Citizen
  if (req.phone) {
    console.log(`[SMS OUT] To ${req.phone}: A responder has been assigned to your request.`);
  }

  return req;
};

export const updateRequestStatus = async (requestId: string, status: any) => {
  const req = await prisma.helpRequest.update({
    where: { id: requestId },
    data: { status }
  });

  if (req.phone) {
    console.log(`[SMS OUT] To ${req.phone}: Your request status is now ${status}.`);
  }

  return req;
};

// 4. Clustered Request View (Geographic)
export const getClusteredRequests = async () => {
  const pendingRequests = await prisma.helpRequest.findMany({
    where: { status: 'PENDING' as any, latitude: { not: null }, longitude: { not: null } }
  });

  // Simple mocking: group by rounding latitude/longitude to 2 decimal places (approx 1.1km grid)
  const clusters: Record<string, any[]> = {};
  
  pendingRequests.forEach(req => {
    if (!req.latitude || !req.longitude) return;
    const gridKey = `${req.latitude.toFixed(2)},${req.longitude.toFixed(2)}`;
    if (!clusters[gridKey]) clusters[gridKey] = [];
    clusters[gridKey].push(req);
  });

  return Object.keys(clusters).map(key => ({
    gridId: key,
    centerLat: parseFloat(key.split(',')[0]),
    centerLng: parseFloat(key.split(',')[1]),
    requestCount: clusters[key].length,
    requests: clusters[key]
  })).sort((a, b) => b.requestCount - a.requestCount); // Sort by highest density
};

// 5. Request Escalation Timer
export const checkEscalations = async () => {
  const now = new Date();
  
  const pendingRequests = await prisma.helpRequest.findMany({
    where: { status: 'PENDING' as any }
  });

  let escalatedCount = 0;

  for (const req of pendingRequests) {
    const minutesOld = (now.getTime() - req.createdAt.getTime()) / 60000;
    let newEscalationLevel = 'NONE';

    if (req.priority === 'CRITICAL' as any && minutesOld > 10) {
      newEscalationLevel = 'CRITICAL';
    } else if (req.priority === 'HIGH' as any && minutesOld > 30) {
      newEscalationLevel = 'HIGH';
    }

    if (newEscalationLevel !== 'NONE' && req.escalationLevel !== newEscalationLevel) {
      await prisma.helpRequest.update({
        where: { id: req.id },
        data: { escalationLevel: newEscalationLevel }
      });

      await prisma.helpRequestEscalation.create({
        data: {
          helpRequestId: req.id,
          level: newEscalationLevel,
          message: `Auto-escalated to ${newEscalationLevel} after ${Math.floor(minutesOld)} minutes unassigned.`
        }
      });

      // Send Mock SMS/Email to Supervisor
      console.log(`[ESCALATION ALERT - SMS/EMAIL] To Supervisor: Request ${req.id} escalated to ${newEscalationLevel}!`);
      
      escalatedCount++;
    }
  }

  return { escalatedCount };
};

// Legacy Verifier code
export const registerVerifier = async (userId: string, data: any) => prisma.localVerifier.create({ data: { userId, ...data } });
export const createVerifierAction = async (userId: string, data: any) => {
  const verifier = await prisma.localVerifier.findUnique({ where: { userId } });
  if (!verifier) throw new Error('Not registered');
  return prisma.verifierAction.create({ data: { verifierId: verifier.id, ...data } });
};
