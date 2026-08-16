import prisma from '../utils/prisma';

export const createMissingPerson = async (userId: string | null, data: any) => {
  return prisma.missingPerson.create({
    data: {
      ...data,
      reportedBy: userId // Can be null for public submissions
    }
  });
};

export const getMissingPersons = async () => {
  return prisma.missingPerson.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

export const updateMissingPersonStatus = async (id: string, status: string) => {
  return prisma.missingPerson.update({
    where: { id },
    data: { status }
  });
};

export const deleteMissingPerson = async (id: string) => {
  return prisma.missingPerson.delete({ where: { id } });
};

// 1. AI Face Recognition — DeepFace via ML service
export const searchFace = async (queryImageBase64: string) => {
  // Fetch all MISSING persons that have a photo stored
  const missing = await prisma.missingPerson.findMany({
    where: { status: 'MISSING', photo: { not: null } },
  });

  if (missing.length === 0) return [];

  const candidates = missing
    .filter((p: any) => p.photo)
    .map((p: any) => ({ person_id: p.id, photo: p.photo as string }));

  let mlMatches: { person_id: string; confidence: number; verified: boolean }[] = [];

  try {
    const mlRes = await fetch('http://localhost:8000/match-face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query_image: queryImageBase64, candidates }),
    });

    if (!mlRes.ok) throw new Error(`ML service responded ${mlRes.status}`);
    const mlData: any = await mlRes.json();
    mlMatches = mlData.matches ?? [];
  } catch (err: any) {
    console.error('[Face Match] ML service call failed:', err);
    const isOffline = err.code === 'ECONNREFUSED' || err.cause?.code === 'ECONNREFUSED' || err.message?.includes('fetch failed');
    throw new Error(isOffline
      ? 'ML_OFFLINE'
      : `ML service error: ${err.message}`);
  }

  // Join ML results with full person records
  const personMap = new Map(missing.map((p: any) => [p.id, p]));
  return mlMatches
    .map((m) => ({ person: personMap.get(m.person_id), confidence: m.confidence, verified: m.verified }))
    .filter((r) => r.person != null);
};

// 2. Family Reunification Workflow
export const triggerReunification = async (id: string, newStatus: string, notes: string) => {
  const person = await prisma.missingPerson.findUnique({ where: { id } });
  if (!person) throw new Error('Person not found');

  if (newStatus === 'IN_PROGRESS' && person.contactPhone) {
    // Mock sending SMS
    console.log(`[SMS MOCK] To ${person.contactPhone}: Great news! ${person.name} has been located. A reunification officer will contact you shortly.`);
  }

  return prisma.missingPerson.update({
    where: { id },
    data: {
      reunificationStatus: newStatus,
      reunificationNotes: notes ? `${person.reunificationNotes || ''}\n[${new Date().toISOString()}] ${notes}` : person.reunificationNotes,
      status: newStatus === 'REUNITED' ? 'FOUND' : person.status
    }
  });
};

// 3. Hospitals & Camps Cross-Reference
export const runCrossReference = async () => {
  const missing = await prisma.missingPerson.findMany({ where: { status: 'MISSING' } });
  const campResidents = await prisma.campResident.findMany();
  // If we had hospital records, we'd pull them here too

  const matches: any[] = [];

  missing.forEach(person => {
    // Very simple mock matching algorithm based on first name or age
    campResidents.forEach(resident => {
      let score = 0;
      if (person.name.toLowerCase().includes(resident.name.toLowerCase()) || resident.name.toLowerCase().includes(person.name.toLowerCase())) {
        score += 50;
      }
      if (resident.nic && person.nic && resident.nic === person.nic) {
        score += 50;
      }

      if (score >= 50) {
        matches.push({
          missingPerson: person,
          matchedRecord: { type: 'CAMP_RESIDENT', data: resident },
          matchScore: score
        });
      }
    });
  });

  // Sort matches by score descending
  return matches.sort((a, b) => b.matchScore - a.matchScore);
};
