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

// 1. AI Face Recognition Mock
export const searchFace = async (imageUrl: string) => {
  // Simulate 3 seconds ML latency
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Fetch some random missing persons to mock as matches
  const missing = await prisma.missingPerson.findMany({
    where: { status: 'MISSING' },
    take: 5
  });

  return missing.map((person, index) => ({
    person,
    confidence: Math.max(0.4, 0.95 - (index * 0.12)) // Descending fake confidence
  }));
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
      if (person.age && resident.age && Math.abs(person.age - resident.age) <= 3) {
        score += 30;
      }
      if (person.gender === resident.gender) {
        score += 20;
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
