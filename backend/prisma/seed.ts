import prisma from '../src/utils/prisma';
import { Role, Status, Severity, AlertType, TokenStatus, DamageCategory, DamageLevel, VerifierRole, SupportType, SupportUrgency, SupportStatus } from './generated/client';

async function main() {
  console.log('Seeding database...');

  const users = await prisma.user.findMany();
  if (users.length === 0) {
    console.error('No users found. Please register at least one user first.');
    return;
  }

  const userId = users[0].id;
  const userIds = users.map(u => u.id);

  // 1. IncidentReport
  console.log('Seeding IncidentReports...');
  for (let i = 1; i <= 10; i++) {
    await prisma.incidentReport.create({
      data: {
        title: `Incident ${i}: ${['Flood', 'Fire', 'Landslide', 'Cyclone'][i % 4]} in Sector ${i}`,
        description: `This is a detailed description for incident report ${i}. Emergency response is being coordinated.`,
        location: `Region ${['North', 'South', 'East', 'West'][i % 4]}, District ${i}`,
        latitude: 6.9271 + (Math.random() - 0.5) * 0.1,
        longitude: 79.8612 + (Math.random() - 0.5) * 0.1,
        status: [Status.PENDING, Status.ASSIGNED, Status.IN_PROGRESS][i % 3],
        severity: [Severity.LOW, Severity.MEDIUM, Severity.HIGH, Severity.CRITICAL][i % 4],
        category: ['Natural Disaster', 'Medical', 'Infrastructure'][i % 3],
        reporterId: userIds[i % userIds.length],
      },
    });
  }

  // 2. Alert
  console.log('Seeding Alerts...');
  for (let i = 1; i <= 10; i++) {
    await prisma.alert.create({
      data: {
        title: `Emergency Alert ${i}`,
        message: `This is a public safety message regarding alert ${i}. Please follow evacuation orders.`,
        location: `Zone ${String.fromCharCode(65 + i)}`,
        type: [AlertType.INFO, AlertType.WARNING, AlertType.EMERGENCY][i % 3],
        active: i % 2 === 0,
      },
    });
  }

  // 3. ReliefCamp
  console.log('Seeding ReliefCamps...');
  for (let i = 1; i <= 10; i++) {
    await prisma.reliefCamp.create({
      data: {
        name: `Camp ${String.fromCharCode(65 + i)} - ${['Central', 'Annex', 'Stadium'][i % 3]}`,
        location: `Primary School ${i}, Road ${i * 10}`,
        latitude: 6.9 + (Math.random() * 0.2),
        longitude: 79.8 + (Math.random() * 0.2),
        currentOccupancy: i * 20,
        totalCapacity: 500,
        services: ['Food', 'Water', 'First Aid', 'Shelter'],
        status: i % 5 === 0 ? 'FULL' : 'OPEN',
      },
    });
  }

  // 4. Resource
  console.log('Seeding Resources...');
  for (let i = 1; i <= 10; i++) {
    await prisma.resource.create({
      data: {
        type: ['Ambulance', 'Boat', 'Truck', 'Generator'][i % 4],
        owner: `Organization ${String.fromCharCode(65 + i)}`,
        location: `Station ${i}`,
        capacity: `${i * 5} units`,
        status: i % 3 === 0 ? 'IN_USE' : 'AVAILABLE',
        contact: `+94 77 123 ${i}${i}${i}${i}`,
      },
    });
  }

  // 5. HelpRequest
  console.log('Seeding HelpRequests...');
  for (let i = 1; i <= 10; i++) {
    await prisma.helpRequest.create({
      data: {
        userId: userIds[i % userIds.length],
        type: ['Medical', 'Food', 'Rescue', 'Other'][i % 4],
        description: `Requesting immediate assistance for ${i} people at location ${i}.`,
        location: `Address Line ${i}`,
        priority: [Severity.MEDIUM, Severity.HIGH, Severity.CRITICAL][i % 3],
        status: Status.PENDING,
        peopleCount: i * 2,
      },
    });
  }

  // 6. MissingPerson
  console.log('Seeding MissingPersons...');
  for (let i = 1; i <= 10; i++) {
    await prisma.missingPerson.create({
      data: {
        name: `Person ${i}`,
        age: 20 + i,
        description: `Last seen wearing a ${['red', 'blue', 'green'][i % 3]} shirt near the river.`,
        lastSeen: `Location X, Sector ${i}`,
        reportedBy: userId,
        status: i % 4 === 0 ? 'FOUND' : 'MISSING',
      },
    });
  }

  // 7. Notification
  console.log('Seeding Notifications...');
  for (let i = 1; i <= 10; i++) {
    await prisma.notification.create({
      data: {
        userId: userId,
        title: `System Notification ${i}`,
        message: `This is notification ${i} for user. Please check your tasks.`,
        read: i % 2 === 0,
      },
    });
  }

  // 8. ReliefToken
  console.log('Seeding ReliefTokens...');
  for (let i = 1; i <= 10; i++) {
    const code = `REL-SEED-${i}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    await prisma.reliefToken.create({
      data: {
        code,
        qrCodeData: code,
        userId: userId,
        status: TokenStatus.ACTIVE,
        maxUsage: 3,
      },
    });
  }

  // 9. DamageAssessment
  console.log('Seeding DamageAssessments...');
  for (let i = 1; i <= 10; i++) {
    await prisma.damageAssessment.create({
      data: {
        reportedById: userId,
        location: `Street ${i}, Area ${i}`,
        category: [DamageCategory.RESIDENTIAL, DamageCategory.AGRICULTURAL, DamageCategory.UTILITY][i % 3],
        structuralDamage: [DamageLevel.MINOR, DamageLevel.MODERATE, DamageLevel.MAJOR][i % 3],
        estimatedLoss: i * 5000,
        notes: `Initial assessment for property ${i}.`,
      },
    });
  }

  // 10. PsychologicalSupportRequest
  console.log('Seeding PsychologicalSupportRequests...');
  for (let i = 1; i <= 10; i++) {
    await prisma.psychologicalSupportRequest.create({
      data: {
        userId: userId,
        type: [SupportType.GENERAL, SupportType.TRAUMA_CARE, SupportType.COUNSELING][i % 3],
        description: `Request for support due to recent events. Person ${i} is affected.`,
        urgency: [SupportUrgency.LOW, SupportUrgency.MEDIUM, SupportUrgency.HIGH][i % 3],
        status: SupportStatus.PENDING,
        anonymous: i % 2 === 0,
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
