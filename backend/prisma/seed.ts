import prisma from '../src/utils/prisma';
import bcrypt from 'bcryptjs';
import {
  Role, Status, Severity, AlertType, TokenStatus, TokenCategory,
  DamageCategory, DamageLevel, SupportType, SupportUrgency, SupportStatus,
  WaterRiskLevel, RiverStatus, WaterTrend, DonationType, DonationStatus, SafetyStatus,
  InventoryItemType, ReferralStatus, VerifierRole, VerificationResult,
} from './generated/client';

// ── Reference data ─────────────────────────────────────────────────
const D = ['Colombo','Gampaha','Kalutara','Kandy','Matale','Nuwara Eliya','Galle','Matara','Hambantota','Jaffna','Kilinochchi','Mannar','Vavuniya','Mullaitivu','Batticaloa','Ampara','Trincomalee','Kurunegala','Puttalam','Anuradhapura','Polonnaruwa','Badulla','Monaragala','Ratnapura','Kegalle'];
const P = ['Western','Western','Western','Central','Central','Central','Southern','Southern','Southern','Northern','Northern','Northern','Northern','Northern','Eastern','Eastern','Eastern','North Western','North Western','North Central','North Central','Uva','Uva','Sabaragamuwa','Sabaragamuwa'];
const RIVERS   = ['Mahaweli','Kelani','Kalu','Gin','Nilwala','Deduru Oya','Walawe','Maha Oya'];
const STATIONS = ['Peradeniya','Hanwella','Norwood','Alawwa','Putupaula','Ellagawa','Magura','Daraniyagala'];
const CATS     = ['Flood','Landslide','Cyclone','Fire','Medical Emergency','Infrastructure Failure','Drought','Tsunami Warning'];
const SVCS     = ['Food','Water','First Aid','Shelter','Counseling','Sanitation','Baby Care','Medication'];
// Inland district centroids — coastal districts use inland town coords to avoid sea placement
const DISTRICT_COORDS: [number, number][] = [
  [6.9271, 79.8612], // Colombo
  [7.0873, 79.9996], // Gampaha
  [6.6300, 80.1300], // Kalutara (inland)
  [7.2906, 80.6337], // Kandy
  [7.4675, 80.6234], // Matale
  [6.9497, 80.7891], // Nuwara Eliya
  [6.2200, 80.3500], // Galle (inland – Baddegama)
  [6.1400, 80.6000], // Matara (inland – Akuressa)
  [6.3500, 81.0000], // Hambantota (inland – Tissamaharama)
  [9.6615, 80.0255], // Jaffna
  [9.3803, 80.3770], // Kilinochchi
  [8.9761, 79.9044], // Mannar
  [8.7514, 80.4971], // Vavuniya
  [9.0000, 80.8000], // Mullaitivu (inland)
  [7.7102, 81.5500], // Batticaloa (slightly inland)
  [7.2987, 81.5000], // Ampara (slightly inland)
  [8.5000, 81.0000], // Trincomalee (inland)
  [7.4818, 80.3609], // Kurunegala
  [8.0362, 79.9000], // Puttalam (slightly inland)
  [8.3408, 80.4164], // Anuradhapura
  [7.9403, 81.0188], // Polonnaruwa
  [6.9934, 81.0550], // Badulla
  [6.8667, 81.3471], // Monaragala
  [6.6934, 80.3849], // Ratnapura
  [7.2513, 80.3464], // Kegalle
];
const lat = (i: number) => DISTRICT_COORDS[i % DISTRICT_COORDS.length][0] + (Math.sin(i * 1.7) * 0.025);
const lng = (i: number) => DISTRICT_COORDS[i % DISTRICT_COORDS.length][1] + (Math.cos(i * 1.3) * 0.025);

async function hash(p: string) { return bcrypt.hash(p, 10); }

// All Status enum values
const ALL_STATUS  : Status[]   = [Status.PENDING, Status.ASSIGNED, Status.IN_PROGRESS, Status.RESOLVED, Status.EN_ROUTE, Status.ON_SITE];
// All Severity enum values
const ALL_SEV     : Severity[] = [Severity.LOW, Severity.MEDIUM, Severity.HIGH, Severity.CRITICAL];
// All SafetyStatus values
const ALL_SAFETY  : SafetyStatus[] = [SafetyStatus.SAFE, SafetyStatus.NEEDS_HELP, SafetyStatus.UNKNOWN, SafetyStatus.INJURED, SafetyStatus.EVACUATED, SafetyStatus.TRAPPED, SafetyStatus.SHELTERED];
// All TokenStatus values
const ALL_TSTATUS : TokenStatus[]  = [TokenStatus.ACTIVE, TokenStatus.PARTIALLY_USED, TokenStatus.FULLY_USED, TokenStatus.EXPIRED, TokenStatus.REVOKED];
// All DamageCategory values
const ALL_DCAT    : DamageCategory[] = [DamageCategory.RESIDENTIAL, DamageCategory.AGRICULTURAL, DamageCategory.INFRASTRUCTURE, DamageCategory.COMMERCIAL, DamageCategory.UTILITY, DamageCategory.OTHER];
// All DamageLevel values
const ALL_DLVL    : DamageLevel[]    = [DamageLevel.NONE, DamageLevel.MINOR, DamageLevel.MODERATE, DamageLevel.MAJOR, DamageLevel.TOTAL_LOSS];
// All DamageStatus strings
const ALL_DSTATUS = ['PENDING_REVIEW','VERIFIED','REJECTED','SENIOR_REVIEW','APPROVED'];
// All SupportType values
const ALL_STYPE   : SupportType[]   = [SupportType.GENERAL, SupportType.COUNSELING, SupportType.CHILD_SUPPORT, SupportType.TRAUMA_CARE, SupportType.GRIEF_SUPPORT];
// All SupportStatus values
const ALL_SSTATUS : SupportStatus[] = [SupportStatus.PENDING, SupportStatus.ASSIGNED, SupportStatus.IN_PROGRESS, SupportStatus.RESOLVED, SupportStatus.CLOSED];
// All TokenCategory values
const ALL_TCAT    : TokenCategory[] = [TokenCategory.FOOD, TokenCategory.MEDICAL, TokenCategory.CLOTHING, TokenCategory.SHELTER, TokenCategory.TRANSPORT, TokenCategory.EDUCATION, TokenCategory.MENTAL_HEALTH];
// All InventoryItemType values
const ALL_INV     : InventoryItemType[] = [InventoryItemType.FOOD, InventoryItemType.WATER, InventoryItemType.MEDICAL, InventoryItemType.BLANKETS, InventoryItemType.HYGIENE];
// All ReferralStatus values
const ALL_REF     : ReferralStatus[]    = [ReferralStatus.PENDING, ReferralStatus.IN_TRANSIT, ReferralStatus.ADMITTED, ReferralStatus.DISCHARGED];
// All VerifierRole values
const ALL_VR      : VerifierRole[]      = [VerifierRole.GRAMA_NILADHARI, VerifierRole.VILLAGE_OFFICER, VerifierRole.COMMUNITY_LEADER, VerifierRole.NGO_OFFICER, VerifierRole.LOCAL_AUTHORITY];
// All VerificationResult values
const ALL_VRES    : VerificationResult[]= [VerificationResult.CONFIRMED, VerificationResult.REJECTED, VerificationResult.NEEDS_INVESTIGATION];
// All WaterRiskLevel values
const ALL_WRL     : WaterRiskLevel[]    = [WaterRiskLevel.NORMAL, WaterRiskLevel.WATCH, WaterRiskLevel.WARNING, WaterRiskLevel.DANGER];
// All RiverStatus values
const ALL_RS      : RiverStatus[]       = [RiverStatus.NORMAL, RiverStatus.ALERT, RiverStatus.MINOR_FLOOD, RiverStatus.MAJOR_FLOOD];
// All WaterTrend values
const ALL_WT      : WaterTrend[]        = [WaterTrend.STABLE, WaterTrend.RISING, WaterTrend.FALLING];
// All DonationType values
const ALL_DT      : DonationType[]      = [DonationType.MONETARY, DonationType.MATERIAL];
// All DonationStatus values
const ALL_DS      : DonationStatus[]    = [DonationStatus.PENDING, DonationStatus.RECEIVED, DonationStatus.ALLOCATED];
// All AlertType values
const ALL_AT      : AlertType[]         = [AlertType.INFO, AlertType.WARNING, AlertType.EMERGENCY];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }

async function clearAll() {
  console.log('🗑️  Clearing existing data...');
  // Delete in dependency order (children before parents)
  await prisma.groupTherapyParticipant.deleteMany();
  await prisma.groupTherapySession.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.reliefTokenClaim.deleteMany();
  await prisma.reliefToken.deleteMany();
  await prisma.donorCampaign.deleteMany();
  await prisma.verifierAction.deleteMany();
  await prisma.localVerifier.deleteMany();
  await prisma.reportVerification.deleteMany();
  await prisma.helpRequestEscalation.deleteMany();
  await prisma.helpRequest.deleteMany();
  await prisma.afterActionReport.deleteMany();
  await prisma.incidentHistory.deleteMany();
  await prisma.resourceRequestMatch.deleteMany();
  await prisma.mLLog.deleteMany();
  await prisma.damageAssessment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.psychologicalSupportRequest.deleteMany();
  await prisma.safetyCheckIn.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.missingPerson.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.locationLog.deleteMany();
  await prisma.userSessionLog.deleteMany();
  await prisma.volunteerBadge.deleteMany();
  await prisma.volunteerWellbeing.deleteMany();
  await prisma.volunteerCheckIn.deleteMany();
  await prisma.volunteerTraining.deleteMany();
  await prisma.volunteerSkill.deleteMany();
  await prisma.volunteerProfile.deleteMany();
  await prisma.volunteerLocation.deleteMany();
  await prisma.hospitalReferral.deleteMany();
  await prisma.campTransferRequest.deleteMany();
  await prisma.campResident.deleteMany();
  await prisma.campInventory.deleteMany();
  await prisma.campSchedule.deleteMany();
  await prisma.resourceExpenditure.deleteMany();
  await prisma.disasterBudget.deleteMany();
  await prisma.resourceCost.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.threatForecast.deleteMany();
  await prisma.threatProjection.deleteMany();
  await prisma.evacuationRoute.deleteMany();
  await prisma.shiftHandover.deleteMany();
  await prisma.kPIBenchmark.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.mentalHealthGuide.deleteMany();
  await prisma.downstreamMapping.deleteMany();
  await prisma.rainfallReading.deleteMany();
  await prisma.riverWaterLevel.deleteMany();
  await prisma.reliefCamp.deleteMany();
  await prisma.incidentReport.deleteMany();
  await prisma.user.deleteMany();
  console.log('   ✅ All tables cleared\n');
}

async function main() {
  console.log('\n🌱 Starting FULL comprehensive database seed...\n');
  await clearAll();

  // ════════════════════════════════════════════════════════════════
  // 1. USERS — all 5 roles
  // ════════════════════════════════════════════════════════════════
  console.log('👤 1. Users...');
  const adminPwd   = await hash('admin123');
  const defaultPwd = await hash('Test@1234');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@suraksha.gov' }, update: {},
    create: { email: 'admin@suraksha.gov', password: adminPwd, name: 'System Administrator', phone: '+94112345678', role: Role.ADMIN, region: 'Colombo', nic: 'ADMIN000001V' },
  });

  const officers = await Promise.all([
    { email: 'officer1@suraksha.gov', name: 'Nimal Perera',    region: 'Colombo',    nic: '198801234560V' },
    { email: 'officer2@suraksha.gov', name: 'Kamala Silva',    region: 'Kandy',      nic: '199002345671V' },
    { email: 'officer3@suraksha.gov', name: 'Suresh Fernando', region: 'Galle',      nic: '198703456782V' },
    { email: 'officer4@suraksha.gov', name: 'Dilrukshi Perera',region: 'Batticaloa', nic: '198904567893V' },
    { email: 'officer5@suraksha.gov', name: 'Arjuna Wijetunga',region: 'Ratnapura',  nic: '199005678904V' },
  ].map(d => prisma.user.upsert({ where: { email: d.email }, update: {}, create: { ...d, password: defaultPwd, role: Role.DMC_OFFICER } })));

  const fieldR = await Promise.all([
    { email: 'field1@suraksha.gov', name: 'Pradeep Kumarasinghe', region: 'Colombo', nic: '199201234500V' },
    { email: 'field2@suraksha.gov', name: 'Sachini Madushani',    region: 'Gampaha', nic: '199302345611V' },
    { email: 'field3@suraksha.gov', name: 'Hasantha Rajapaksa',   region: 'Kandy',   nic: '199403456722V' },
  ].map(d => prisma.user.upsert({ where: { email: d.email }, update: {}, create: { ...d, password: defaultPwd, role: Role.FIELD_RESPONDER } })));

  const volunteers = await Promise.all([
    { email: 'vol1@suraksha.lk', name: 'Ashan Dias',        region: 'Colombo',   nic: '199501112230V' },
    { email: 'vol2@suraksha.lk', name: 'Priya Jayawardena', region: 'Gampaha',   nic: '199602223341V' },
    { email: 'vol3@suraksha.lk', name: 'Ruwan Bandara',     region: 'Kandy',     nic: '199403334452V' },
    { email: 'vol4@suraksha.lk', name: 'Dilani Wijesinghe', region: 'Galle',     nic: '199804445563V' },
    { email: 'vol5@suraksha.lk', name: 'Chamara Gunasena',  region: 'Matara',    nic: '199705556674V' },
    { email: 'vol6@suraksha.lk', name: 'Kasuni Siriwardena',region: 'Ratnapura', nic: '199806667785V' },
    { email: 'vol7@suraksha.lk', name: 'Shehan Alwis',      region: 'Badulla',   nic: '199907778896V' },
  ].map(d => prisma.user.upsert({ where: { email: d.email }, update: {}, create: { ...d, password: defaultPwd, role: Role.VOLUNTEER } })));

  const citizens = await Promise.all([
    { email: 'citizen1@gmail.com',  name: 'Kasun Rajapaksa',       region: 'Colombo',    nic: '200001116780V' },
    { email: 'citizen2@gmail.com',  name: 'Malini Seneviratne',    region: 'Kalutara',   nic: '199902227891V' },
    { email: 'citizen3@gmail.com',  name: 'Thilak Ranasinghe',     region: 'Kandy',      nic: '199803338902V' },
    { email: 'citizen4@gmail.com',  name: 'Sandya Kumari',         region: 'Gampaha',    nic: '200104449013V' },
    { email: 'citizen5@gmail.com',  name: 'Lahiru Pathirana',      region: 'Galle',      nic: '199605550124V' },
    { email: 'citizen6@gmail.com',  name: 'Nethmi Perera',         region: 'Matara',     nic: '200006661235V' },
    { email: 'citizen7@gmail.com',  name: 'Dilan Wickramasinghe',  region: 'Ratnapura',  nic: '199707772346V' },
    { email: 'citizen8@gmail.com',  name: 'Ishara Fernando',       region: 'Kurunegala', nic: '199808883457V' },
    { email: 'citizen9@gmail.com',  name: 'Tharaka Samaraweera',   region: 'Badulla',    nic: '199909994568V' },
    { email: 'citizen10@gmail.com', name: 'Chamindi Dissanayake',  region: 'Ampara',     nic: '200010005679V' },
    { email: 'citizen11@gmail.com', name: 'Roshan Gunawardena',    region: 'Trincomalee',nic: '199811116780V' },
    { email: 'citizen12@gmail.com', name: 'Nadeeka Weerasekara',   region: 'Hambantota', nic: '200012227891V' },
  ].map(d => prisma.user.upsert({ where: { email: d.email }, update: {}, create: { ...d, password: defaultPwd, role: Role.CITIZEN } })));

  const allUsers = [admin, ...officers, ...fieldR, ...volunteers, ...citizens];
  const allIds   = allUsers.map(u => u.id);
  console.log(`   ✅ ${allUsers.length} users (ADMIN, DMC_OFFICER, FIELD_RESPONDER, VOLUNTEER, CITIZEN)`);

  // ════════════════════════════════════════════════════════════════
  // 2. INCIDENT REPORTS — all Status + Severity values
  // ════════════════════════════════════════════════════════════════
  console.log('📋 2. Incident Reports...');
  const incidentTitles = [
    'Severe flooding in Kelani River basin','Landslide blocks Kandy-Colombo highway',
    'House fire spreads to 3 properties','Cyclonic winds damage coastal homes',
    'Flash flood traps residents in Ratnapura','River overflow — Kalu Ganga rising',
    'Road collapse after heavy rain','Medical emergency at relief camp',
    'Bridge structural damage on A9 road','Power outage affecting 500+ homes',
    'Flooding of paddy fields in Ampara','Tsunami warning — southern coast',
    'Mudslide blocks Hatton-Nuwara Eliya road','Gas leak at Colombo port',
    'Drowning incident at Kelani river crossing','School damaged by fallen tree',
    'Drinking water contamination in Matara','Landslide destroys 4 homes in Badulla',
  ];
  const incidents: any[] = [];
  for (let i = 0; i < 18; i++) {
    const inc = await prisma.incidentReport.create({ data: {
      title:            incidentTitles[i],
      description:      `Field report: ${incidentTitles[i]}. Rescue teams dispatched. ${(i + 1) * 3} families affected. Situation is being actively monitored.`,
      location:         `${D[i % D.length]}, Sri Lanka`,
      latitude:         lat(i),
      longitude:        lng(i),
      status:           pick(ALL_STATUS, i),
      severity:         pick(ALL_SEV, i),
      category:         CATS[i % CATS.length],
      reporterId:       pick(allIds, i),
      mlConfidence:     0.60 + (i * 0.02),
      detectedLanguage: ['en','si','ta'][i % 3],
      province:         P[i % P.length],
    }});
    incidents.push(inc);
  }
  console.log(`   ✅ ${incidents.length} incidents (all Status + Severity values covered)`);

  // ════════════════════════════════════════════════════════════════
  // 3. INCIDENT HISTORY — all Status values
  // ════════════════════════════════════════════════════════════════
  console.log('📜 3. Incident History...');
  for (let i = 0; i < 12; i++) {
    await prisma.incidentHistory.create({ data: {
      incidentId: incidents[i % incidents.length].id,
      status:     pick(ALL_STATUS, i),
      updatedBy:  allIds[i % allIds.length],
      note:       `Status updated to ${pick(ALL_STATUS, i)} by field team. Area assessed, resources allocated.`,
    }});
  }
  console.log('   ✅ 12 incident history records');

  // ════════════════════════════════════════════════════════════════
  // 4. ALERTS — all AlertType values
  // ════════════════════════════════════════════════════════════════
  console.log('🚨 4. Alerts...');
  const alertRows = [
    { title:'🚨 Major Flood Warning — Colombo',     message:'Kelani River exceeded major flood level at Hanwella. Evacuate low-lying areas immediately.',     type: AlertType.EMERGENCY },
    { title:'⚠️ Landslide Risk — Nuwara Eliya',    message:'Heavy rainfall triggered landslide risk. Avoid steep slopes and hillside roads.',               type: AlertType.WARNING   },
    { title:'🔔 Relief Camp Open — Galle',          message:'Galle Esplanade relief camp is now open. Food, water and shelter available for all.',           type: AlertType.INFO      },
    { title:'🚨 Cyclone Alert — Northern Coast',    message:'Cyclonic storm approaching. Wind speeds up to 120 km/h. Evacuate coastal areas now.',           type: AlertType.EMERGENCY },
    { title:'⚠️ Flash Flood Risk — Ratnapura',      message:'Kalu Ganga rising rapidly. Flash flood expected in 3 hours. Move to higher ground.',            type: AlertType.WARNING   },
    { title:'🔔 Drinking Water Distribution',       message:'Safe drinking water at Kandy town hall, 8 AM–5 PM daily until further notice.',                type: AlertType.INFO      },
    { title:'🚨 Tsunami Warning — Southern Coast',  message:'Tsunami advisory issued. Ocean has receded. Move 2 km inland immediately.',                    type: AlertType.EMERGENCY },
    { title:'⚠️ River Watch — Mahaweli at Kandy',  message:'Mahaweli River at ALERT level near Peradeniya. Monitor updates every 30 min.',                 type: AlertType.WARNING   },
    { title:'🔔 Volunteer Deployment Request',      message:'Volunteers needed in Kalutara district. Contact district coordinator: 0712-345678.',           type: AlertType.INFO      },
    { title:'🚨 Dam Sluice Gate Opening — Kalu',   message:'Kalu Ganga dam gates open at 6 PM. Downstream communities must evacuate flood plains now.',    type: AlertType.EMERGENCY },
    { title:'⚠️ Road Closure — A1 Highway',         message:'A1 highway closed between Kottawa and Mathugama due to flooding. Use alternate routes.',       type: AlertType.WARNING   },
    { title:'🔔 Mobile Medical Team — Batticaloa', message:'Mobile medical teams at Batticaloa divisional secretariat. Free consultations available.',      type: AlertType.INFO      },
    { title:'🚨 Gas Leak Emergency — Colombo Port',message:'Gas leak detected at Colombo Port area. Residents within 1 km radius must evacuate.',          type: AlertType.EMERGENCY },
    { title:'⚠️ Heavy Rain Warning — Badulla',      message:'Extremely heavy rain forecast for next 6 hours in Badulla and Monaragala districts.',           type: AlertType.WARNING   },
    { title:'🔔 School Closure Notice',             message:'All government schools in Ratnapura district closed tomorrow due to flood risk.',               type: AlertType.INFO      },
  ];
  for (const a of alertRows) {
    await prisma.alert.create({ data: { ...a, active: true, locations: [D[alertRows.indexOf(a) % D.length]] } });
  }
  console.log(`   ✅ ${alertRows.length} alerts (INFO, WARNING, EMERGENCY all covered)`);

  // ════════════════════════════════════════════════════════════════
  // 5. RELIEF CAMPS
  // ════════════════════════════════════════════════════════════════
  console.log('🏕️  5. Relief Camps...');
  type CampRow = [string, string, number, number, number, number];
  const campRows: CampRow[] = [
    ['Colombo Racecourse Evacuation Centre','Colombo',      6.9020, 79.8612, 800, 620],
    ['Kandy Dharmaraja Camp',               'Kandy',        7.2906, 80.6337, 500, 310],
    ['Galle Esplanade Relief Camp',         'Galle',        6.0535, 80.2210, 600, 580],
    ['Ratnapura District Camp',             'Ratnapura',    6.6828, 80.3992, 400, 400],
    ['Batticaloa Lagoon Camp',              'Batticaloa',   7.7170, 81.6924, 350, 200],
    ['Matara Southern Camp',                'Matara',       5.9549, 80.5550, 300, 285],
    ['Kurunegala North Western Camp',       'Kurunegala',   7.4818, 80.3609, 450, 130],
    ['Nuwara Eliya Hill Camp',              'Nuwara Eliya', 6.9497, 80.7891, 200, 175],
    ['Ampara Eastern Shelter',              'Ampara',       7.2993, 81.6747, 500, 420],
    ['Trincomalee Harbour Camp',            'Trincomalee',  8.5874, 81.2152, 600, 390],
    ['Hambantota Southern Coast Camp',      'Hambantota',   6.1241, 81.1185, 250, 100],
    ['Badulla Uva Province Camp',           'Badulla',      6.9895, 81.0557, 300, 220],
    ['Jaffna Northern Relief Centre',       'Jaffna',       9.6615, 80.0255, 400, 360],
    ['Kegalle District Shelter',            'Kegalle',      7.2513, 80.3464, 250, 90 ],
    ['Anuradhapura North Central Camp',     'Anuradhapura', 8.3114, 80.4037, 600, 480],
  ];
  const camps: any[] = [];
  for (const [name, loc, la, lo, cap, occ] of campRows) {
    camps.push(await prisma.reliefCamp.create({ data: {
      name, location: `${loc} District`, latitude: la, longitude: lo,
      totalCapacity: cap, currentOccupancy: occ,
      services: SVCS.slice(0, 4 + (camps.length % 4)),
      status: occ >= cap ? 'FULL' : occ > cap * 0.85 ? 'NEAR_FULL' : 'OPEN',
    }}));
  }
  console.log(`   ✅ ${camps.length} relief camps`);

  // ════════════════════════════════════════════════════════════════
  // 6. CAMP INVENTORY — all InventoryItemType values
  // ════════════════════════════════════════════════════════════════
  console.log('📦 6. Camp Inventory...');
  for (let i = 0; i < 15; i++) {
    await prisma.campInventory.create({ data: {
      campId:    camps[i % camps.length].id,
      itemType:  pick(ALL_INV, i),
      quantity:  100 + i * 50,
      threshold: 20 + i * 5,
    }});
  }
  console.log(`   ✅ 15 inventory items (FOOD, WATER, MEDICAL, BLANKETS, HYGIENE all covered)`);

  // ════════════════════════════════════════════════════════════════
  // 7. CAMP SCHEDULES
  // ════════════════════════════════════════════════════════════════
  console.log('🗓️  7. Camp Schedules...');
  const scheduleRows = [
    ['Breakfast Distribution','06:30','07:30','MEAL'],
    ['Lunch Distribution','12:00','13:00','MEAL'],
    ['Dinner Distribution','18:00','19:00','MEAL'],
    ['Medical Check-up','09:00','11:00','MEDICAL'],
    ['Counseling Session','14:00','16:00','COUNSELING'],
    ['Children Activity Hour','10:00','11:00','RECREATION'],
    ['Evening Prayer','19:30','20:00','RELIGIOUS'],
    ['Security Patrol Handover','06:00','06:30','SECURITY'],
    ['Registration & Documentation','08:00','10:00','ADMIN'],
    ['Water Distribution','07:00','08:00','DISTRIBUTION'],
    ['Baby Care & Nutrition','09:00','10:00','MEDICAL'],
    ['Evening Community Meeting','20:00','21:00','ADMIN'],
  ];
  for (let i = 0; i < 12; i++) {
    const [activityName, startTime, endTime, type] = scheduleRows[i];
    await prisma.campSchedule.create({ data: { campId: camps[i % camps.length].id, activityName: activityName as string, startTime: startTime as string, endTime: endTime as string, type: type as string }});
  }
  console.log('   ✅ 12 camp schedules');

  // ════════════════════════════════════════════════════════════════
  // 8. CAMP RESIDENTS
  // ════════════════════════════════════════════════════════════════
  console.log('🛖  8. Camp Residents...');
  for (let i = 0; i < 15; i++) {
    await prisma.campResident.create({ data: {
      campId: camps[i % camps.length].id, name: `Resident Family ${i + 1}`,
      nic: `2000${String(i).padStart(5,'0')}V`, familySize: 2 + (i % 5),
      status: i === 14 ? 'CHECKED_OUT' : 'ACTIVE',
    }});
  }
  console.log('   ✅ 15 camp residents');

  // ════════════════════════════════════════════════════════════════
  // 9. HOSPITAL REFERRALS — all ReferralStatus values
  // ════════════════════════════════════════════════════════════════
  console.log('🏥 9. Hospital Referrals...');
  const hospitals = ['Colombo National Hospital','Kandy Teaching Hospital','Karapitiya Teaching Hospital','Batticaloa Teaching Hospital','Jaffna Teaching Hospital','Ratnapura General Hospital'];
  for (let i = 0; i < 12; i++) {
    await prisma.hospitalReferral.create({ data: {
      campId:           camps[i % camps.length].id,
      patientName:      `Patient ${i + 1} — ${D[i % D.length]}`,
      conditionSeverity: pick(ALL_SEV, i),
      hospitalAssigned: hospitals[i % hospitals.length],
      transportMethod:  ['Ambulance','Army Vehicle','Private','Navy Helicopter'][i % 4],
      outcome:          i % 4 === 3 ? 'Discharged and returned to camp' : null,
      status:           pick(ALL_REF, i),
    }});
  }
  console.log(`   ✅ 12 hospital referrals (PENDING, IN_TRANSIT, ADMITTED, DISCHARGED all covered)`);

  // ════════════════════════════════════════════════════════════════
  // 10. CAMP TRANSFERS
  // ════════════════════════════════════════════════════════════════
  console.log('🔀 10. Camp Transfer Requests...');
  for (let i = 0; i < 10; i++) {
    const fromIdx = i % camps.length;
    const toIdx   = (i + 1) % camps.length;
    await prisma.campTransferRequest.create({ data: {
      fromCampId:  camps[fromIdx].id,
      toCampId:    camps[toIdx].id,
      peopleCount: 10 + i * 5,
      status:      ['PENDING','APPROVED','COMPLETED','REJECTED'][i % 4],
    }});
  }
  console.log('   ✅ 10 camp transfer requests');

  // ════════════════════════════════════════════════════════════════
  // 11. RESOURCES
  // ════════════════════════════════════════════════════════════════
  console.log('🚑 11. Resources...');
  const resRows = [
    ['Ambulance','Red Cross Sri Lanka','Colombo 07'],['Rescue Boat','Navy Sri Lanka','Kelani River Base'],
    ['Water Tanker','NWSDB','Ratnapura Depot'],['Generator (50kVA)','CEB Emergency','Kandy'],
    ['Field Hospital Unit','Army Medical Corps','Colombo Fort'],['Helicopter','Air Force','Katunayake'],
    ['Excavator','RDA','Kurunegala Yard'],['Food Truck','WFP Sri Lanka','Galle Warehouse'],
    ['Inflatable Rescue Raft','Police STF','Batticaloa'],['Satellite Comms Unit','Telecom Regulatory','Colombo'],
    ['Mobile Blood Bank','National Blood Bank','Peradeniya Road'],['Search & Rescue Dog Unit','Police K9','Mirihana'],
    ['Water Purification Unit','UNICEF','Ampara'],['Portable X-Ray Machine','Army Medical','Trincomalee'],
    ['Emergency Food Stock (10MT)','WFP','Jaffna Warehouse'],
  ];
  for (let i = 0; i < resRows.length; i++) {
    const [type, owner, location] = resRows[i];
    await prisma.resource.create({ data: { type, owner, location, capacity: `${10 + i} units`, status: ['AVAILABLE','IN_USE','MAINTENANCE'][i % 3], contact: `+9411${String(2000000 + i).slice(1)}` }});
  }
  console.log(`   ✅ ${resRows.length} resources`);

  // ════════════════════════════════════════════════════════════════
  // 12. RESOURCE COSTS + DISASTER BUDGET + EXPENDITURE
  // ════════════════════════════════════════════════════════════════
  console.log('💵 12. Resource Costs, Budgets & Expenditure...');
  const resCosts: any[] = [];
  const costRows: Array<[string, string, number]> = [
    ['Ambulance','Per Hour',3500],['Rescue Boat','Per Hour',5000],['Water Tanker','Per Trip',12000],
    ['Generator','Per Day',8500],['Helicopter','Per Hour',85000],['Food Pack','Per Unit',250],
    ['Water Purification','Per Day',15000],['Medical Staff','Per Day',6500],
    ['Excavator','Per Hour',9000],['Shelter Material','Per Set',18000],
  ];
  for (const [resourceType, unitType, unitCost] of costRows) {
    resCosts.push(await prisma.resourceCost.upsert({ where: { resourceType }, update: {}, create: { resourceType, unitType, unitCost } }));
  }
  const budgets: any[] = [];
  const budgetNames = ['2026 Monsoon Flood Response','Southern Cyclone Operation','Eastern Drought Relief','Northern Infrastructure Repair','Landslide Emergency Fund'];
  for (let i = 0; i < 5; i++) {
    budgets.push(await prisma.disasterBudget.create({ data: { eventName: budgetNames[i], allocatedBudget: 5000000 + i * 2000000 } }));
  }
  for (let i = 0; i < 12; i++) {
    await prisma.resourceExpenditure.create({ data: {
      resourceCostId: resCosts[i % resCosts.length].id,
      budgetId:       budgets[i % budgets.length].id,
      quantity:       5 + i * 2,
      totalCost:      (5 + i * 2) * resCosts[i % resCosts.length].unitCost,
    }});
  }
  console.log('   ✅ 10 resource costs, 5 budgets, 12 expenditures');

  // ════════════════════════════════════════════════════════════════
  // 13. RESOURCE REQUEST MATCHES
  // ════════════════════════════════════════════════════════════════
  console.log('🔗 13. Resource Request Matches...');
  for (let i = 0; i < 12; i++) {
    await prisma.resourceRequestMatch.create({ data: {
      requestId:  incidents[i % incidents.length].id,
      resourceId: `res-placeholder-${i + 1}`,
      matchScore: 0.55 + i * 0.04,
      status:     ['SUGGESTED','CONFIRMED','DEPLOYED','RELEASED'][i % 4],
    }});
  }
  console.log('   ✅ 12 resource request matches');

  // ════════════════════════════════════════════════════════════════
  // 14. VOLUNTEER PROFILES, SKILLS, CHECK-INS, WELLBEING, BADGES, TRAININGS
  // ════════════════════════════════════════════════════════════════
  console.log('🙋 14. Volunteer Profiles & sub-records...');
  const volProfiles: any[] = [];
  for (let i = 0; i < volunteers.length; i++) {
    const vp = await prisma.volunteerProfile.upsert({
      where: { userId: volunteers[i].id }, update: {},
      create: { userId: volunteers[i].id, readinessScore: 60 + i * 5, totalHours: 10 + i * 8, incidentsJoined: i + 1 },
    });
    volProfiles.push(vp);
    await prisma.volunteerSkill.create({ data: { volunteerId: vp.id, skillName: ['First Aid','Rescue Operations','Logistics','Emergency Medical','Structural Engineering'][i % 5] }});
    await prisma.volunteerCheckIn.create({ data: { volunteerId: vp.id, latitude: lat(i), longitude: lng(i), zone: D[i % D.length], activeHours: 4 + i }});
    await prisma.volunteerWellbeing.create({ data: { volunteerId: vp.id, physicalRating: 6 + (i % 5), mentalRating: 5 + (i % 5), needsResources: i % 4 === 0, distressFlag: i % 6 === 0 }});
    await prisma.volunteerBadge.create({ data: { volunteerId: vp.id, badgeType: ['FIRST_RESPONDER','LIFE_SAVER','COMMUNITY_HERO','FLOOD_RESCUER','MEDICAL_AID'][i % 5] }});
    await prisma.volunteerTraining.create({ data: { volunteerId: vp.id, trainingName: ['Basic First Aid','Water Rescue','Psychological First Aid','CBRN Awareness','Incident Command'][i % 5], completedAt: new Date(Date.now() - i * 30 * 86400000), expiresAt: new Date(Date.now() + (365 - i * 20) * 86400000) }});
  }
  // Extra profiles from field responders
  for (let i = 0; i < fieldR.length; i++) {
    const vp = await prisma.volunteerProfile.upsert({
      where: { userId: fieldR[i].id }, update: {},
      create: { userId: fieldR[i].id, readinessScore: 90 + i * 2, totalHours: 80 + i * 10, incidentsJoined: 5 + i },
    });
    volProfiles.push(vp);
    await prisma.volunteerSkill.create({ data: { volunteerId: vp.id, skillName: ['Incident Command','Urban Search & Rescue','HazMat Operations'][i % 3] }});
    await prisma.volunteerCheckIn.create({ data: { volunteerId: vp.id, latitude: lat(i + 10), longitude: lng(i + 10), zone: D[(i + 10) % D.length] }});
    await prisma.volunteerWellbeing.create({ data: { volunteerId: vp.id, physicalRating: 8, mentalRating: 7, needsResources: false, distressFlag: false }});
  }
  console.log(`   ✅ ${volProfiles.length} volunteer profiles with skills, check-ins, wellbeing, badges, trainings`);

  // ════════════════════════════════════════════════════════════════
  // 15. VOLUNTEER LOCATIONS
  // ════════════════════════════════════════════════════════════════
  console.log('📌 15. Volunteer Locations...');
  for (let i = 0; i < 12; i++) {
    await prisma.volunteerLocation.create({ data: {
      volunteerId: volunteers[i % volunteers.length].id,
      latitude: lat(i), longitude: lng(i),
      skill: ['First Aid','Rescue','Medical','Logistics'][i % 4],
      status: ['ACTIVE','STANDBY','OFFLINE'][i % 3],
    }});
  }
  console.log('   ✅ 12 volunteer locations');

  // ════════════════════════════════════════════════════════════════
  // 16. TASKS — all Status values
  // ════════════════════════════════════════════════════════════════
  console.log('📌 16. Tasks...');
  const taskTitles = [
    'Distribute food packs to 200 families','Set up drinking water distribution point',
    'Assist evacuation of elderly residents','Coordinate with medical team at camp',
    'Clear debris from main road','Conduct welfare check in flood zone',
    'Register new camp arrivals','Patrol evacuated area for stragglers',
    'Transport medical supplies to field hospital','Document damage in affected homes',
    'Set up communication relay station','Provide first aid at relief camp',
    'Establish perimeter at landslide zone','Coordinate bridge inspection team',
    'Run community awareness session','Deliver baby formula to families at camp',
    'Assist search & rescue team at riverside','Update evacuation route signage',
  ];
  for (let i = 0; i < 18; i++) {
    await prisma.task.create({ data: {
      title:        taskTitles[i],
      description:  `Task: ${taskTitles[i]}. Coordinate with incident commander on site before proceeding.`,
      status:       pick(ALL_STATUS, i),
      priority:     pick(ALL_SEV, i),
      incidentId:   incidents[i % incidents.length].id,
      assignedToId: volunteers[i % volunteers.length].id,
      assignedById: officers[i % officers.length].id,
    }});
  }
  console.log(`   ✅ 18 tasks (all Status values: PENDING, ASSIGNED, IN_PROGRESS, RESOLVED, EN_ROUTE, ON_SITE)`);

  // ════════════════════════════════════════════════════════════════
  // 17. LOCAL VERIFIERS + VERIFIER ACTIONS — all VerifierRole + VerificationResult
  // ════════════════════════════════════════════════════════════════
  console.log('✅ 17. Local Verifiers & Verifier Actions...');
  const verifiers: any[] = [];
  for (let i = 0; i < 5; i++) {
    const u = citizens[i + 5]; // use last 5 citizens as verifiers
    const existing = await prisma.localVerifier.findUnique({ where: { userId: u.id } });
    if (!existing) {
      verifiers.push(await prisma.localVerifier.create({ data: {
        userId:             u.id,
        verifierRole:       ALL_VR[i],
        jurisdiction:       `${D[i]} GS Division`,
        orgName:            ['Grama Niladhari Office','Village Council','Community Council','Red Cross','Local Authority'][i],
        isApproved:         true,
        approvedAt:         new Date(Date.now() - (30 - i) * 86400000),
        approvedById:       officers[i % officers.length].id,
        verificationsCount: 3 + i * 2,
      }}));
    }
  }
  for (let i = 0; i < 12; i++) {
    if (!verifiers[i % verifiers.length]) continue;
    await prisma.verifierAction.create({ data: {
      verifierId: verifiers[i % verifiers.length].id,
      incidentId: incidents[i % incidents.length].id,
      result:     pick(ALL_VRES, i),
      comment:    `Field verification at ${D[i % D.length]}: ${['Situation confirmed as reported. Damage extensive.','Report rejected — area not affected.','Needs further investigation by senior team.'][i % 3]}`,
    }});
  }
  console.log(`   ✅ ${verifiers.length} local verifiers (all VerifierRole values), 12 verifier actions (all VerificationResult values)`);

  // ════════════════════════════════════════════════════════════════
  // 18. REPORT VERIFICATIONS
  // ════════════════════════════════════════════════════════════════
  console.log('🔍 18. Report Verifications...');
  for (let i = 0; i < 12; i++) {
    await prisma.reportVerification.create({ data: {
      reportId: incidents[i % incidents.length].id,
      userId:   officers[i % officers.length].id,
      status:   ['PENDING','VERIFIED','REJECTED'][i % 3],
      comment:  ['Incident verified on site.','Images match satellite data.','Rejected — duplicate report.'][i % 3],
    }});
  }
  console.log('   ✅ 12 report verifications');

  // ════════════════════════════════════════════════════════════════
  // 19. HELP REQUESTS + ESCALATIONS
  // ════════════════════════════════════════════════════════════════
  console.log('🆘 19. Help Requests & Escalations...');
  const helpTypes = ['Medical','Food','Rescue','Water','Shelter','Evacuation','Baby Supplies','Medication','Boat Rescue','Electrical','Clothing','Psychological Support'];
  const helpReqs: any[] = [];
  for (let i = 0; i < 15; i++) {
    const hr = await prisma.helpRequest.create({ data: {
      userId:      citizens[i % citizens.length].id,
      type:        helpTypes[i % helpTypes.length],
      description: `Urgent: ${helpTypes[i % helpTypes.length]} needed for ${(i + 1) * 2} people at ${D[i % D.length]}. Situation is deteriorating.`,
      location:    `${D[i % D.length]} District, Sri Lanka`,
      latitude:    lat(i), longitude: lng(i),
      priority:    pick(ALL_SEV, i),
      status:      pick(ALL_STATUS, i),
      peopleCount: (i + 1) * 2,
      escalationLevel: i > 8 ? 'LEVEL_2' : 'NONE',
    }});
    helpReqs.push(hr);
  }
  for (let i = 0; i < 10; i++) {
    await prisma.helpRequestEscalation.create({ data: {
      helpRequestId: helpReqs[i % helpReqs.length].id,
      level:         ['LEVEL_1','LEVEL_2','LEVEL_3'][i % 3],
      message:       `Escalation ${i + 1}: No response after ${(i + 1) * 30} minutes. Situation critical. Requesting immediate intervention.`,
    }});
  }
  console.log('   ✅ 15 help requests + 10 escalations');

  // ════════════════════════════════════════════════════════════════
  // 20. MISSING PERSONS
  // ════════════════════════════════════════════════════════════════
  console.log('🔍 20. Missing Persons...');
  const missingNames = ['Saman Kumara','Priyanka De Silva','Rohan Mendis','Sanduni Perera','Thilak Jayawardena','Nilufar Ahamed','Buddhika Rajapaksa','Maleesha Fernando','Kavinda Bandara','Asha Weerasinghe','Chanuka Dissanayake','Nimali Senanayake','Amara Kodikara','Supun Liyanage','Rashmi Gunasekara'];
  const mpStatuses = ['MISSING','FOUND','DECEASED','UNIDENTIFIED'];
  for (let i = 0; i < 15; i++) {
    await prisma.missingPerson.create({ data: {
      name:               missingNames[i],
      age:                8 + (i * 6) % 70,
      gender:             i % 2 === 0 ? 'Male' : 'Female',
      description:        `Last seen wearing ${['red','blue','white','green','yellow'][i % 5]} clothing near the ${['river','bridge','market','school','hospital'][i % 5]}.`,
      lastSeen:           `${D[i % D.length]} — ${['river bank','main road','village junction','paddy fields','coastal area'][i % 5]}`,
      reportedBy:         citizens[i % citizens.length].id,
      status:             mpStatuses[i % mpStatuses.length],
      contactPhone:       `+9477${String(2000000 + i).slice(1)}`,
      nic:                i % 3 === 0 ? `${199000 + i}0001234V` : null,
      isUnidentified:     i % 7 === 0,
      reunificationStatus:i % 4 === 1 ? 'REUNIFIED' : 'NONE',
    }});
  }
  console.log(`   ✅ 15 missing persons (MISSING, FOUND, DECEASED, UNIDENTIFIED statuses)`);

  // ════════════════════════════════════════════════════════════════
  // 21. RELIEF TOKENS + CLAIMS — all TokenStatus + TokenCategory
  // ════════════════════════════════════════════════════════════════
  console.log('🎫 21. Relief Tokens & Claims...');
  const tokens: any[] = [];
  for (let i = 0; i < 15; i++) {
    const code = `SRK-${String(2026000 + i).padStart(7,'0')}`;
    const tok = await prisma.reliefToken.create({ data: {
      code, qrCodeData: `SURAKSHA:${code}`,
      userId:     citizens[i % citizens.length].id,
      status:     pick(ALL_TSTATUS, i),
      categories: [ALL_TCAT[i % ALL_TCAT.length], ALL_TCAT[(i + 1) % ALL_TCAT.length]],
      maxUsage:   1 + (i % 3),
      usageCount: pick(ALL_TSTATUS, i) === TokenStatus.ACTIVE ? 0 : 1,
      expiresAt:  new Date(Date.now() + (60 - i * 3) * 86400000),
      campId:     camps[i % camps.length].id,
    }});
    tokens.push(tok);
  }
  // Add claims for some tokens
  for (let i = 0; i < 10; i++) {
    await prisma.reliefTokenClaim.create({ data: {
      tokenId:  tokens[i % tokens.length].id,
      claimedBy:citizens[i % citizens.length].id,
      itemType: ALL_TCAT[i % ALL_TCAT.length],
      quantity: 1 + (i % 3),
      campId:   camps[i % camps.length].id,
      notes:    `Claimed at ${D[i % D.length]} relief camp on arrival.`,
    }});
  }
  console.log(`   ✅ 15 tokens (all TokenStatus + TokenCategory values), 10 claims`);

  // ════════════════════════════════════════════════════════════════
  // 22. DONOR CAMPAIGNS
  // ════════════════════════════════════════════════════════════════
  console.log('🤝 22. Donor Campaigns...');
  const donors = [
    { donorName: 'Sri Lanka Red Cross',       contributionAmount: 2500000, targetCategories: [TokenCategory.FOOD, TokenCategory.MEDICAL] },
    { donorName: 'UNICEF Sri Lanka',           contributionAmount: 5000000, targetCategories: [TokenCategory.EDUCATION, TokenCategory.SHELTER] },
    { donorName: 'WFP Emergency Fund',         contributionAmount: 3200000, targetCategories: [TokenCategory.FOOD] },
    { donorName: 'Rotary Club of Colombo',     contributionAmount: 800000,  targetCategories: [TokenCategory.CLOTHING, TokenCategory.FOOD] },
    { donorName: 'Sri Lanka Army Welfare',     contributionAmount: 1500000, targetCategories: [TokenCategory.MEDICAL, TokenCategory.TRANSPORT] },
    { donorName: 'Lanka Humanitarian Fund',    contributionAmount: 960000,  targetCategories: [TokenCategory.MENTAL_HEALTH, TokenCategory.SHELTER] },
    { donorName: 'National Disaster Relief',   contributionAmount: 7500000, targetCategories: [TokenCategory.FOOD, TokenCategory.MEDICAL, TokenCategory.SHELTER] },
    { donorName: 'Buddhist Foundation Relief', contributionAmount: 420000,  targetCategories: [TokenCategory.FOOD, TokenCategory.CLOTHING] },
  ];
  for (const d of donors) {
    await prisma.donorCampaign.create({ data: d });
  }
  console.log(`   ✅ ${donors.length} donor campaigns`);

  // ════════════════════════════════════════════════════════════════
  // 23. DAMAGE ASSESSMENTS — all DamageCategory, DamageLevel, DamageStatus
  // ════════════════════════════════════════════════════════════════
  console.log('🏚️  23. Damage Assessments...');
  const damageNotes = [
    'Complete roof collapse from cyclone. Family of 5 displaced.',
    'Ground floor flooded 1.5 m. Furniture and electronics destroyed.',
    'Structural cracks in walls — collapse risk HIGH.',
    'Agricultural land submerged. 3 acres of paddy destroyed.',
    'Small business damaged. Equipment loss LKR 800,000.',
    'Foundation damage from landslide. Uninhabitable.',
    'Utility pole fell on roof. Electricity cut.',
    'Retaining wall collapsed. Vehicle damage.',
    'Well contaminated with flood water.',
    'School building damaged. 200 students displaced.',
    'Village road washed away. Community isolated.',
    'Bridge supports eroded. Closed to all traffic.',
    'Warehouse with 10 MT grain stock flooded.',
    'Healthcare clinic damaged. Equipment ruined.',
    'Paddy mill flooded. 40 families depend on it.',
    'None — inspection showed no actual damage.',
    'Senior officer review needed — large claim.',
    'Waiting for second inspector before approval.',
  ];
  for (let i = 0; i < 18; i++) {
    await prisma.damageAssessment.create({ data: {
      reportedById:                citizens[i % citizens.length].id,
      incidentId:                  incidents[i % incidents.length].id,
      location:                    `${D[i % D.length]}, Sri Lanka`,
      latitude:                    lat(i), longitude: lng(i),
      category:                    pick(ALL_DCAT, i),
      structuralDamage:            pick(ALL_DLVL, i),
      estimatedLoss:               i === 15 ? 0 : (i + 1) * 75000,
      affectedPersons:             (i + 1) * 3,
      notes:                       damageNotes[i],
      compensationEligibilityScore: i === 15 ? 10 : 40 + i * 3,
      compensationEligible:        i !== 15,
      status:                      pick(ALL_DSTATUS, i) as any,
      aiEstimatedCost:             (i + 1) * 80000,
      aiEstimatedDamage:           pick(ALL_DLVL, i) as string,
    }});
  }
  console.log(`   ✅ 18 damage assessments (all DamageCategory: RESIDENTIAL,AGRICULTURAL,INFRASTRUCTURE,COMMERCIAL,UTILITY,OTHER; all DamageLevel: NONE,MINOR,MODERATE,MAJOR,TOTAL_LOSS; all DamageStatus covered)`);

  // ════════════════════════════════════════════════════════════════
  // 24. PSYCH SUPPORT — all SupportType + SupportStatus + SupportUrgency
  // ════════════════════════════════════════════════════════════════
  console.log('💬 24. Psychological Support Requests...');
  for (let i = 0; i < 15; i++) {
    await prisma.psychologicalSupportRequest.create({ data: {
      userId:      citizens[i % citizens.length].id,
      type:        pick(ALL_STYPE, i),
      description: `Individual experienced ${['trauma','acute stress','grief','anxiety','PTSD symptoms'][i % 5]} after ${CATS[i % CATS.length]} event. Requested ${pick(ALL_STYPE, i)} support.`,
      urgency:     pick(Object.values(SupportUrgency) as SupportUrgency[], i),
      status:      pick(ALL_SSTATUS, i),
      anonymous:   i % 4 === 0,
    }});
  }
  console.log(`   ✅ 15 psych support requests (all SupportType: GENERAL,COUNSELING,CHILD_SUPPORT,TRAUMA_CARE,GRIEF_SUPPORT; all SupportStatus + SupportUrgency values covered)`);

  // ════════════════════════════════════════════════════════════════
  // 25. CHAT SESSIONS + MESSAGES
  // ════════════════════════════════════════════════════════════════
  console.log('💬 25. Chat Sessions & Messages...');
  const chatSessions: any[] = [];
  for (let i = 0; i < 8; i++) {
    const s = await prisma.chatSession.create({ data: {
      requestId:   `req-${String(1000 + i)}`,
      counselorId: volunteers[i % volunteers.length].id,
      userId:      citizens[i % citizens.length].id,
      status:      ['WAITING','ACTIVE','CLOSED'][i % 3],
      moodAfter:   i % 3 === 2 ? ['Better','Calm','Hopeful','Relieved'][i % 4] : null,
    }});
    chatSessions.push(s);
    await prisma.chatMessage.create({ data: { sessionId: s.id, senderId: citizens[i % citizens.length].id, content: 'I am feeling very anxious after the flood. I lost everything.' }});
    await prisma.chatMessage.create({ data: { sessionId: s.id, senderId: volunteers[i % volunteers.length].id, content: 'I understand. You are safe now. Let me help you through this. Can you take a few deep breaths with me?' }});
    await prisma.chatMessage.create({ data: { sessionId: s.id, senderId: citizens[i % citizens.length].id, content: 'Thank you. I feel a little better now.' }});
  }
  console.log(`   ✅ ${chatSessions.length} chat sessions + ${chatSessions.length * 3} messages`);

  // ════════════════════════════════════════════════════════════════
  // 26. GROUP THERAPY SESSIONS + PARTICIPANTS
  // ════════════════════════════════════════════════════════════════
  console.log('👥 26. Group Therapy Sessions...');
  const groupTherapyTitles = ['Flood Trauma Recovery Circle','Community Healing After Landslide','Children\'s Play Therapy Session','Grief Support for Bereaved Families','Resilience Building Workshop','Mindfulness in Crisis Session','Post-Disaster Stress Relief','Community Reconnection Circle'];
  for (let i = 0; i < 8; i++) {
    const gs = await prisma.groupTherapySession.create({ data: {
      title:           groupTherapyTitles[i],
      description:     `Group support session for survivors of ${CATS[i % CATS.length]}. Facilitated by trained counselor.`,
      campId:          camps[i % camps.length].id,
      counselorId:     volunteers[i % volunteers.length].id,
      scheduledFor:    new Date(Date.now() + i * 2 * 86400000),
      maxParticipants: 15 + i * 2,
      status:          ['SCHEDULED','ONGOING','COMPLETED','CANCELLED'][i % 4],
    }});
    for (let j = 0; j < 5; j++) {
      await prisma.groupTherapyParticipant.create({ data: {
        sessionId:        gs.id,
        userId:           citizens[(i + j) % citizens.length].id,
        attendanceStatus: ['REGISTERED','ATTENDED','ABSENT'][j % 3],
      }});
    }
  }
  console.log('   ✅ 8 group therapy sessions + 40 participants');

  // ════════════════════════════════════════════════════════════════
  // 27. NOTIFICATIONS
  // ════════════════════════════════════════════════════════════════
  console.log('🔔 27. Notifications...');
  const notifRows = [
    'Your report has been received and assigned','Volunteer task assigned to you',
    'Relief token issued — check app to redeem','Camp registration confirmed',
    'Alert: Flood risk in your district','Missing person report updated — please verify',
    'Your help request has been assigned to a team','Damage assessment approved',
    'New task available in your region','Your account password was changed',
    'System maintenance tonight 10 PM – 2 AM','Thank you for your donation',
    'Family member safety check-in received','AI prediction alert for your area',
    'Evacuation order — please follow nearest route',
  ];
  for (let i = 0; i < 15; i++) {
    await prisma.notification.create({ data: { userId: pick(allIds, i), title: notifRows[i], message: `${notifRows[i]}. Open Suraksha app for full details.`, read: i % 3 === 0 }});
  }
  console.log('   ✅ 15 notifications');

  // ════════════════════════════════════════════════════════════════
  // 28. DONATIONS — all DonationType + DonationStatus
  // ════════════════════════════════════════════════════════════════
  console.log('💰 28. Donations...');
  const donationItems = ['Rice (50 kg)','Clothing Bundle','Medicine Kit','Water Bottles (100)','Blankets (10)','Baby Formula (12 tins)','Cooking Oil (10 L)','Dry Rations Pack','Solar Lanterns (5)','First Aid Kit'];
  for (let i = 0; i < 15; i++) {
    const isMoney = i % 2 === 0;
    await prisma.donation.create({ data: {
      donorId:          citizens[i % citizens.length].id,
      donorName:        citizens[i % citizens.length].name,
      campId:           camps[i % camps.length].id,
      type:             pick(ALL_DT, i),
      amount:           isMoney ? (i + 1) * 5000 : null,
      itemsDescription: !isMoney ? donationItems[i % donationItems.length] : null,
      status:           pick(ALL_DS, i),
    }});
  }
  console.log(`   ✅ 15 donations (MONETARY, MATERIAL; PENDING, RECEIVED, ALLOCATED all covered)`);

  // ════════════════════════════════════════════════════════════════
  // 29. FAMILY MEMBERS — all SafetyStatus values
  // ════════════════════════════════════════════════════════════════
  console.log('👨‍👩‍👧 29. Family Members...');
  for (let i = 0; i < 15; i++) {
    await prisma.familyMember.create({ data: {
      primaryUserId: citizens[i % citizens.length].id,
      name:          `Family Member ${i + 1}`,
      relation:      ['Spouse','Child','Parent','Sibling','Grandparent'][i % 5],
      status:        pick(ALL_SAFETY, i),
      notes:         i % 3 === 0 ? `Last seen near ${D[i % D.length]} market area before flooding began.` : null,
    }});
  }
  console.log(`   ✅ 15 family members (all SafetyStatus: SAFE, NEEDS_HELP, UNKNOWN, INJURED, EVACUATED, TRAPPED, SHELTERED covered)`);

  // ════════════════════════════════════════════════════════════════
  // 30. SAFETY CHECK-INS — all SafetyStatus values
  // ════════════════════════════════════════════════════════════════
  console.log('✅ 30. Safety Check-ins...');
  for (let i = 0; i < 14; i++) {
    await prisma.safetyCheckIn.create({ data: {
      userId:    citizens[i % citizens.length].id,
      status:    pick(ALL_SAFETY, i),
      message:   `Check-in ${i + 1}: ${['All safe at home. Water nearby but stable.','Need food — family of 4.','Evacuated to Kandy camp.','No connection — sending via SMS.','Sheltering at church building.','TRAPPED — need boat rescue.','Injured — need medical help.'][i % 7]}`,
      latitude:  lat(i), longitude: lng(i),
    }});
  }
  console.log(`   ✅ 14 safety check-ins (all SafetyStatus values covered)`);

  // ════════════════════════════════════════════════════════════════
  // 31. LOCATION LOGS
  // ════════════════════════════════════════════════════════════════
  console.log('📍 31. Location Logs...');
  for (let i = 0; i < 15; i++) {
    await prisma.locationLog.create({ data: { userId: pick(allIds, i), latitude: lat(i), longitude: lng(i) }});
  }
  console.log('   ✅ 15 location logs');

  // ════════════════════════════════════════════════════════════════
  // 32. RAINFALL READINGS — all WaterRiskLevel values
  // ════════════════════════════════════════════════════════════════
  console.log('🌧️  32. Rainfall Readings...');
  for (let i = 0; i < 16; i++) {
    await prisma.rainfallReading.create({ data: {
      stationId:         `RS-${String(i + 1).padStart(3,'0')}`,
      stationName:       `${D[i % D.length]} Rainfall Station`,
      district:          D[i % D.length], province: P[i % P.length],
      latitude:          lat(i), longitude: lng(i),
      rainfallMmPerHour: i === 0 ? 0 : 5 + i * 4,
      cumulativeRain24h: i === 0 ? 0 : 40 + i * 12,
      cumulativeRain72h: i === 0 ? 0 : 80 + i * 20,
      riskLevel:         pick(ALL_WRL, i),
      recordedAt:        new Date(Date.now() - i * 3600000),
      fetchedAt:         new Date(), source: 'DMC-API',
    }});
  }
  console.log(`   ✅ 16 rainfall readings (NORMAL, WATCH, WARNING, DANGER all covered)`);

  // ════════════════════════════════════════════════════════════════
  // 33. RIVER WATER LEVELS — all RiverStatus + WaterTrend
  // ════════════════════════════════════════════════════════════════
  console.log('🌊 33. River Water Levels...');
  for (let i = 0; i < 16; i++) {
    await prisma.riverWaterLevel.create({ data: {
      gaugeId:            `GAUGE-${String(i + 1).padStart(3,'0')}`,
      riverName:          RIVERS[i % RIVERS.length],
      stationName:        STATIONS[i % STATIONS.length],
      district:           D[i % D.length], latitude: lat(i), longitude: lng(i),
      waterLevelMetres:   1.0 + i * 0.35,
      flowRateCumecs:     80 + i * 45,
      alertLevel: 2.5, minorFloodLevel: 3.5, majorFloodLevel: 4.5,
      status:             pick(ALL_RS, i),
      trend:              pick(ALL_WT, i),
      changeFromLastHour: pick(ALL_WT, i) === WaterTrend.RISING ? 0.3 + (i % 3) * 0.2 : pick(ALL_WT, i) === WaterTrend.FALLING ? -0.15 : 0.0,
      recordedAt:         new Date(Date.now() - i * 3600000),
      fetchedAt:          new Date(), source: 'MASL-API',
    }});
  }
  console.log(`   ✅ 16 river water levels (NORMAL, ALERT, MINOR_FLOOD, MAJOR_FLOOD; STABLE, RISING, FALLING all covered)`);

  // ════════════════════════════════════════════════════════════════
  // 34. DOWNSTREAM MAPPING
  // ════════════════════════════════════════════════════════════════
  console.log('🗺️  34. Downstream Mappings...');
  const dsMaps = [
    { gaugeId:'GAUGE-001',riverName:'Kelani',   stationName:'Hanwella',     targetDistricts:['Colombo','Gampaha','Kalutara'] },
    { gaugeId:'GAUGE-002',riverName:'Kalu',     stationName:'Ellagawa',     targetDistricts:['Ratnapura','Kalutara'] },
    { gaugeId:'GAUGE-003',riverName:'Mahaweli', stationName:'Peradeniya',   targetDistricts:['Kandy','Matale','Trincomalee'] },
    { gaugeId:'GAUGE-004',riverName:'Gin',      stationName:'Baddegama',    targetDistricts:['Galle'] },
    { gaugeId:'GAUGE-005',riverName:'Nilwala',  stationName:'Pitabeddara',  targetDistricts:['Matara'] },
    { gaugeId:'GAUGE-006',riverName:'Walawe',   stationName:'Timbolketiya', targetDistricts:['Hambantota','Ratnapura'] },
    { gaugeId:'GAUGE-007',riverName:'Maha Oya', stationName:'Alawwa',       targetDistricts:['Gampaha','Colombo'] },
    { gaugeId:'GAUGE-008',riverName:'Deduru Oya',stationName:'Yakwila',     targetDistricts:['Kurunegala','Puttalam'] },
    { gaugeId:'GAUGE-009',riverName:'Kelani',   stationName:'Kithulgala',   targetDistricts:['Kegalle','Colombo'] },
    { gaugeId:'GAUGE-010',riverName:'Kalu',     stationName:'Millawa',      targetDistricts:['Kalutara'] },
    { gaugeId:'GAUGE-011',riverName:'Mahaweli', stationName:'Weragantota',  targetDistricts:['Ampara','Batticaloa'] },
    { gaugeId:'GAUGE-012',riverName:'Walawe',   stationName:'Chandrikawewa',targetDistricts:['Hambantota'] },
  ];
  for (const d of dsMaps) {
    await prisma.downstreamMapping.upsert({ where: { gaugeId: d.gaugeId }, update: {}, create: d });
  }
  console.log(`   ✅ ${dsMaps.length} downstream mappings`);

  // ════════════════════════════════════════════════════════════════
  // 35. EVACUATION ROUTES
  // ════════════════════════════════════════════════════════════════
  console.log('🛣️  35. Evacuation Routes...');
  const routeTypes = ['ROAD','WATER','AERIAL','FOOT'];
  for (let i = 0; i < 15; i++) {
    await prisma.evacuationRoute.create({ data: {
      name:        `${D[i % D.length]} Evacuation Route ${i + 1}`,
      type:        routeTypes[i % routeTypes.length],
      coordinates: [{ lat: lat(i), lng: lng(i) },{ lat: lat(i) + 0.1, lng: lng(i) + 0.1 }],
      status:      i % 5 === 0 ? 'BLOCKED' : 'ACTIVE',
    }});
  }
  console.log('   ✅ 15 evacuation routes (ROAD, WATER, AERIAL, FOOT; ACTIVE, BLOCKED)');

  // ════════════════════════════════════════════════════════════════
  // 36. THREAT FORECASTS + PROJECTIONS
  // ════════════════════════════════════════════════════════════════
  console.log('🌀 36. Threat Forecasts & Projections...');
  for (let i = 0; i < 15; i++) {
    await prisma.threatForecast.create({ data: {
      district: D[i % D.length], threatType: CATS[i % CATS.length],
      confidence: 0.55 + i * 0.03, severity: pick(ALL_SEV, i),
      forecastTime: new Date(Date.now() + i * 12 * 3600000),
    }});
  }
  for (let i = 0; i < 10; i++) {
    await prisma.threatProjection.create({ data: {
      name:         `${CATS[i % CATS.length]} Risk Zone — ${D[i % D.length]}`,
      type:         CATS[i % CATS.length],
      polygonCoords:[{ lat: lat(i), lng: lng(i) },{ lat: lat(i)+0.1, lng: lng(i) },{ lat: lat(i)+0.1, lng: lng(i)+0.1 },{ lat: lat(i), lng: lng(i)+0.1 }],
      riskLevel:    pick(ALL_SEV, i),
      active:       i % 4 !== 3,
    }});
  }
  console.log('   ✅ 15 threat forecasts + 10 threat projections');

  // ════════════════════════════════════════════════════════════════
  // 37. AFTER-ACTION REPORTS
  // ════════════════════════════════════════════════════════════════
  console.log('📋 37. After-Action Reports...');
  for (let i = 0; i < 8; i++) {
    await prisma.afterActionReport.create({ data: {
      incidentId:     incidents[i].id,
      timeline:       [{ time:'T+0h',event:'Incident reported' },{ time:'T+1h',event:'Team dispatched' },{ time:'T+4h',event:'Rescue completed' }],
      resourcesUsed:  [{ type:'Ambulance',count:2 },{ type:'Rescue Boat',count:1 }],
      costEstimate:   50000 + i * 25000,
      peopleAffected: (i + 1) * 15,
      resolutionTime: 4 + i * 2,
      lessonsLearned: `Lesson ${i + 1}: Early warning systems worked. Communication between teams needs improvement. Pre-positioning resources in ${D[i % D.length]} recommended.`,
    }});
  }
  console.log('   ✅ 8 after-action reports');

  // ════════════════════════════════════════════════════════════════
  // 38. ML LOGS
  // ════════════════════════════════════════════════════════════════
  console.log('🤖 38. ML Logs...');
  const mlModels = ['nlp-v1.2.0','damage-classifier-v1.0','water-lstm-v2.1','priority-classifier-v1.0'];
  for (let i = 0; i < 15; i++) {
    await prisma.mLLog.create({ data: {
      incidentId:   i < 10 ? incidents[i % incidents.length].id : null,
      inputData:    { description:`Text sample ${i + 1}`, location:D[i % D.length], model:mlModels[i % mlModels.length] },
      prediction:   pick(ALL_SEV, i),
      confidence:   0.60 + i * 0.02,
      modelVersion: mlModels[i % mlModels.length],
    }});
  }
  console.log('   ✅ 15 ML logs');

  // ════════════════════════════════════════════════════════════════
  // 39. AUDIT LOGS
  // ════════════════════════════════════════════════════════════════
  console.log('📝 39. Audit Logs...');
  const auditActions = ['USER_LOGIN','ALERT_CREATED','INCIDENT_UPDATED','CAMP_OPENED','TOKEN_ISSUED','TASK_ASSIGNED','REPORT_SUBMITTED','RESOURCE_DEPLOYED','USER_ROLE_CHANGED','SYSTEM_CONFIG_UPDATED','VOLUNTEER_CHECKED_IN','DAMAGE_APPROVED','TOKEN_REVOKED','CAMP_CAPACITY_UPDATED','MISSING_PERSON_FOUND'];
  for (let i = 0; i < 15; i++) {
    await prisma.auditLog.create({ data: {
      userId:   pick(allIds, i),
      action:   auditActions[i % auditActions.length],
      entity:   ['User','Alert','IncidentReport','ReliefCamp','ReliefToken','Task','MissingPerson'][i % 7],
      entityId: incidents[i % incidents.length].id,
      metadata: { ip:`192.168.${i}.1`, timestamp:new Date().toISOString() },
    }});
  }
  console.log('   ✅ 15 audit logs');

  // ════════════════════════════════════════════════════════════════
  // 40. SHIFT HANDOVERS
  // ════════════════════════════════════════════════════════════════
  console.log('🔄 40. Shift Handovers...');
  const criticals = ['More rescue boats needed urgently in Ratnapura','Medical supplies critically low at Galle camp','Power outage in Colombo sector 4 — generator needed','Communication relay down near Kandy — satellite backup active','Road blocked at Kurunegala km 45 — alternate route marked','Dam gate release scheduled at 06:00 — downstream warned','Missing persons search ongoing near Kelani River','Medical evacuation flight requested for Jaffna camp'];
  for (let i = 0; i < 12; i++) {
    await prisma.shiftHandover.create({ data: {
      shiftTime:         new Date(Date.now() - i * 8 * 3600000),
      incidentsOpened:   3 + i, incidentsClosed: 2 + i,
      resourcesDeployed: 8 + i * 2, volunteersActive: 15 + i * 3,
      criticalItems:     `CRITICAL: ${criticals[i % criticals.length]}`,
    }});
  }
  console.log('   ✅ 12 shift handovers');

  // ════════════════════════════════════════════════════════════════
  // 41. MENTAL HEALTH GUIDES
  // ════════════════════════════════════════════════════════════════
  console.log('🧠 41. Mental Health Guides...');
  const guides = [
    { title:'Coping with Disaster Trauma',         content:'Step-by-step guide on managing post-disaster anxiety and PTSD symptoms.',               tags:'trauma,anxiety,coping,ptsd' },
    { title:'Helping Children After a Flood',      content:'Supporting children through disaster distress, nightmares and regression.',             tags:'children,flood,support,parenting' },
    { title:'Breathing Exercises for Anxiety',     content:'Box breathing and 4-7-8 technique for immediate stress and panic relief.',             tags:'breathing,anxiety,self-help,panic' },
    { title:'Grief and Loss After Disaster',       content:'Understanding and processing grief after losing property or loved ones to disaster.',   tags:'grief,loss,recovery,bereavement' },
    { title:'Sleep Hygiene in Emergency Shelters', content:'Maintaining healthy sleep patterns during evacuation and displacement.',               tags:'sleep,displacement,shelter,self-help' },
    { title:'Community Support Networks',          content:'How to connect with local support groups and professional counselors post-disaster.',  tags:'community,support,connection,network' },
    { title:'Managing Financial Stress',           content:'Practical steps to cope with financial loss and uncertainty after a disaster.',        tags:'financial,stress,recovery,money' },
    { title:'PTSD: Signs and When to Seek Help',   content:'Recognising PTSD symptoms in yourself and others and when to seek professional help.',tags:'ptsd,signs,help,professional' },
    { title:'Returning Home After Evacuation',     content:'Emotional preparation for returning to a damaged or destroyed home.',                  tags:'home,evacuation,recovery,return' },
    { title:'Supporting Elderly After Disaster',   content:'Special guidance for families caring for elderly survivors.',                          tags:'elderly,care,family,vulnerable' },
    { title:'Volunteer Burnout Prevention',        content:'Self-care strategies for frontline volunteers to prevent compassion fatigue.',         tags:'volunteer,burnout,self-care,fatigue' },
    { title:'Mindfulness in Crisis',               content:'Mindfulness techniques adapted for disaster survivors without quiet environments.',    tags:'mindfulness,crisis,self-help,awareness' },
    { title:'Child Support After Displacement',    content:'Age-appropriate ways to help children cope with evacuation and loss of home.',        tags:'children,displacement,support,child' },
    { title:'Anger Management After Disaster',     content:'Channelling frustration and anger constructively in difficult post-disaster times.',  tags:'anger,management,coping,emotion' },
    { title:'Building Resilience as a Community',  content:'Community-based resilience practices that help neighbourhoods recover together.',      tags:'resilience,community,recovery,rebuild' },
  ];
  for (const g of guides) {
    await prisma.mentalHealthGuide.create({ data: { title: g.title, content: g.content, tags: g.tags, isOfflineAvailable: true }});
  }
  console.log(`   ✅ ${guides.length} mental health guides`);

  // ════════════════════════════════════════════════════════════════
  // 42. KPI BENCHMARKS
  // ════════════════════════════════════════════════════════════════
  console.log('📊 42. KPI Benchmarks...');
  for (let i = 0; i < 12; i++) {
    await prisma.kPIBenchmark.create({ data: {
      month: `2026-${String(i + 1).padStart(2,'0')}`,
      targetAvgResponse: 30 - (i % 10),
      targetOccupancy:   75 + (i % 15),
      targetVolunteer:   80 + (i % 15),
    }});
  }
  console.log('   ✅ 12 KPI benchmarks (every month of 2026)');

  // ════════════════════════════════════════════════════════════════
  // 43. ROLE PERMISSIONS — all 5 roles
  // ════════════════════════════════════════════════════════════════
  console.log('🔐 43. Role Permissions...');
  const perms = [
    { role:Role.ADMIN,          module:'USERS',       canView:true,  canEdit:true,  canDelete:true  },
    { role:Role.ADMIN,          module:'ALERTS',      canView:true,  canEdit:true,  canDelete:true  },
    { role:Role.ADMIN,          module:'ANALYTICS',   canView:true,  canEdit:true,  canDelete:false },
    { role:Role.ADMIN,          module:'SYSTEM',      canView:true,  canEdit:true,  canDelete:true  },
    { role:Role.DMC_OFFICER,    module:'INCIDENTS',   canView:true,  canEdit:true,  canDelete:false },
    { role:Role.DMC_OFFICER,    module:'CAMPS',       canView:true,  canEdit:true,  canDelete:false },
    { role:Role.DMC_OFFICER,    module:'TASKS',       canView:true,  canEdit:true,  canDelete:false },
    { role:Role.DMC_OFFICER,    module:'REPORTS',     canView:true,  canEdit:true,  canDelete:false },
    { role:Role.FIELD_RESPONDER,module:'INCIDENTS',   canView:true,  canEdit:true,  canDelete:false },
    { role:Role.FIELD_RESPONDER,module:'RESOURCES',   canView:true,  canEdit:true,  canDelete:false },
    { role:Role.VOLUNTEER,      module:'TASKS',       canView:true,  canEdit:true,  canDelete:false },
    { role:Role.VOLUNTEER,      module:'INCIDENTS',   canView:true,  canEdit:false, canDelete:false },
    { role:Role.VOLUNTEER,      module:'CAMPS',       canView:true,  canEdit:false, canDelete:false },
    { role:Role.CITIZEN,        module:'INCIDENTS',   canView:true,  canEdit:true,  canDelete:false },
    { role:Role.CITIZEN,        module:'ALERTS',      canView:true,  canEdit:false, canDelete:false },
    { role:Role.CITIZEN,        module:'CAMPS',       canView:true,  canEdit:false, canDelete:false },
  ];
  for (const p of perms) {
    await prisma.rolePermission.create({ data: p });
  }
  console.log(`   ✅ ${perms.length} role permissions (all 5 roles: ADMIN, DMC_OFFICER, FIELD_RESPONDER, VOLUNTEER, CITIZEN)`);

  // ════════════════════════════════════════════════════════════════
  // 44. USER SESSION LOGS
  // ════════════════════════════════════════════════════════════════
  console.log('🔑 44. User Session Logs...');
  for (let i = 0; i < 15; i++) {
    await prisma.userSessionLog.create({ data: {
      userId:    pick(allIds, i),
      ipAddress: `192.168.${i % 5}.${10 + i}`,
      device:    i % 3 === 0 ? 'Android/Suraksha-App' : i % 3 === 1 ? 'iOS/Suraksha-App' : 'Web/Chrome',
      loginTime: new Date(Date.now() - (15 - i) * 3600000),
    }});
  }
  console.log('   ✅ 15 session logs (Android, iOS, Web devices)');

  // ════════════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════════════
  console.log('\n✅ ═══════════════════════════════════════════');
  console.log('   FULL DATABASE SEED COMPLETED SUCCESSFULLY');
  console.log('   ═══════════════════════════════════════════');
  console.log('\n   Tables seeded: 44 models');
  console.log('   All enum values covered:');
  console.log('   • Role: ADMIN, DMC_OFFICER, FIELD_RESPONDER, VOLUNTEER, CITIZEN');
  console.log('   • Status: PENDING, ASSIGNED, IN_PROGRESS, RESOLVED, EN_ROUTE, ON_SITE');
  console.log('   • Severity: LOW, MEDIUM, HIGH, CRITICAL');
  console.log('   • AlertType: INFO, WARNING, EMERGENCY');
  console.log('   • TokenStatus: ACTIVE, PARTIALLY_USED, FULLY_USED, EXPIRED, REVOKED');
  console.log('   • TokenCategory: FOOD, MEDICAL, CLOTHING, SHELTER, TRANSPORT, EDUCATION, MENTAL_HEALTH');
  console.log('   • DamageCategory: RESIDENTIAL, AGRICULTURAL, INFRASTRUCTURE, COMMERCIAL, UTILITY, OTHER');
  console.log('   • DamageLevel: NONE, MINOR, MODERATE, MAJOR, TOTAL_LOSS');
  console.log('   • DamageStatus: PENDING_REVIEW, VERIFIED, REJECTED, SENIOR_REVIEW, APPROVED');
  console.log('   • SupportType: GENERAL, COUNSELING, CHILD_SUPPORT, TRAUMA_CARE, GRIEF_SUPPORT');
  console.log('   • SupportStatus: PENDING, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED');
  console.log('   • SafetyStatus: SAFE, NEEDS_HELP, UNKNOWN, INJURED, EVACUATED, TRAPPED, SHELTERED');
  console.log('   • InventoryItemType: FOOD, WATER, MEDICAL, BLANKETS, HYGIENE');
  console.log('   • ReferralStatus: PENDING, IN_TRANSIT, ADMITTED, DISCHARGED');
  console.log('   • VerifierRole: GRAMA_NILADHARI, VILLAGE_OFFICER, COMMUNITY_LEADER, NGO_OFFICER, LOCAL_AUTHORITY');
  console.log('   • VerificationResult: CONFIRMED, REJECTED, NEEDS_INVESTIGATION');
  console.log('   • WaterRiskLevel: NORMAL, WATCH, WARNING, DANGER');
  console.log('   • RiverStatus: NORMAL, ALERT, MINOR_FLOOD, MAJOR_FLOOD');
  console.log('   • WaterTrend: STABLE, RISING, FALLING');
  console.log('   • DonationType: MONETARY, MATERIAL');
  console.log('   • DonationStatus: PENDING, RECEIVED, ALLOCATED');
  console.log('\n🔑 Super Admin Login:');
  console.log('   Email:    admin@suraksha.gov');
  console.log('   Password: admin123\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
