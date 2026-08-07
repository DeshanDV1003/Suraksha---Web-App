import { PrismaClient } from '../prisma/generated/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.downstreamMapping.deleteMany();
  await prisma.riverWaterLevel.deleteMany();

  const stations = [
    // Nagalagam Street: alert/minor/major in ft → converted to m (1ft=0.3048m)
    { gaugeId:'RB01-001', riverName:'Kelani Ganga',     stationName:'Nagalagam Street',       district:'Colombo',       lat:6.9319, lng:79.8478, wl:1.60, al:1.22, mf:1.52, mjf:2.13 },
    { gaugeId:'RB01-002', riverName:'Kelani Ganga',     stationName:'Hanwella',               district:'Colombo',       lat:6.9027, lng:80.0814, wl:1.32, al:7.00, mf:8.00, mjf:10.00 },
    { gaugeId:'RB01-003', riverName:'Kelani Ganga',     stationName:'Glencourse',             district:'Kegalle',       lat:6.9741, lng:80.1876, wl:9.55, al:15.00,mf:16.50,mjf:19.00 },
    { gaugeId:'RB01-004', riverName:'Kelani Ganga',     stationName:'Kithulgala',             district:'Kegalle',       lat:6.9897, lng:80.4153, wl:1.57, al:3.00, mf:4.00, mjf:6.00 },
    { gaugeId:'RB01-005', riverName:'Gurugoda Oya',     stationName:'Holombuwa',              district:'Kegalle',       lat:7.0124, lng:80.2341, wl:0.53, al:3.00, mf:3.40, mjf:5.00 },
    { gaugeId:'RB01-006', riverName:'Seethawaka Ganga', stationName:'Deraniyagala',           district:'Kegalle',       lat:6.9243, lng:80.3372, wl:0.71, al:4.80, mf:5.80, mjf:6.40 },
    { gaugeId:'RB01-007', riverName:'Kehelgamu Oya',    stationName:'Norwood',                district:'Nuwara Eliya',  lat:6.8369, lng:80.6172, wl:0.54, al:1.50, mf:3.00, mjf:4.50 },
    { gaugeId:'RB03-001', riverName:'Kalu Ganga',       stationName:'Putupaula',              district:'Ratnapura',     lat:6.7154, lng:80.2897, wl:0.57, al:3.00, mf:4.00, mjf:5.00 },
    { gaugeId:'RB03-002', riverName:'Kalu Ganga',       stationName:'Ellagawa',               district:'Ratnapura',     lat:6.7453, lng:80.3614, wl:4.56, al:10.00,mf:10.70,mjf:12.20},
    { gaugeId:'RB03-003', riverName:'Kalu Ganga',       stationName:'Rathnapura',             district:'Ratnapura',     lat:6.6802, lng:80.3992, wl:0.96, al:5.20, mf:7.50, mjf:9.50 },
    { gaugeId:'RB03-004', riverName:'Maguru Ganga',     stationName:'Magura',                 district:'Ratnapura',     lat:6.5981, lng:80.1742, wl:1.04, al:4.00, mf:6.00, mjf:7.50 },
    { gaugeId:'RB03-005', riverName:'Kuda Ganga',       stationName:'Kalawellawa (Millakanda)',district:'Kalutara',      lat:6.6213, lng:80.2341, wl:2.05, al:5.00, mf:6.50, mjf:8.00 },
    { gaugeId:'RB09-001', riverName:'Gin Ganga',        stationName:'Baddegama',              district:'Galle',         lat:6.1854, lng:80.1892, wl:1.38, al:3.50, mf:4.00, mjf:5.00 },
    { gaugeId:'RB09-002', riverName:'Gin Ganga',        stationName:'Thawalama',              district:'Galle',         lat:6.3241, lng:80.3617, wl:1.26, al:4.00, mf:6.00, mjf:7.50 },
    { gaugeId:'RB12-001', riverName:'Nilwala Ganga',    stationName:'Thalgahagoda',           district:'Matara',        lat:6.0492, lng:80.5341, wl:0.21, al:1.40, mf:1.70, mjf:2.80 },
    { gaugeId:'RB12-002', riverName:'Nilwala Ganga',    stationName:'Panadugama',             district:'Matara',        lat:6.0217, lng:80.5893, wl:2.18, al:5.00, mf:6.00, mjf:7.50 },
    { gaugeId:'RB12-003', riverName:'Nilwala Ganga',    stationName:'Pitabeddara',            district:'Matara',        lat:6.1432, lng:80.7214, wl:0.39, al:4.00, mf:5.00, mjf:6.50 },
    { gaugeId:'RB12-004', riverName:'Urubokka Ganga',   stationName:'Urawa',                  district:'Matara',        lat:6.1089, lng:80.6512, wl:-0.01,al:2.50, mf:4.00, mjf:6.00 },
    { gaugeId:'RB18-001', riverName:'Walawe Ganga',     stationName:'Moraketiya',             district:'Ratnapura',     lat:6.4532, lng:80.8921, wl:0.77, al:3.00, mf:5.00, mjf:7.00 },
    { gaugeId:'RB22-001', riverName:'Kirindi Oya',      stationName:'Thanamalwila',           district:'Monaragala',    lat:6.4512, lng:81.0341, wl:0.21, al:4.00, mf:5.00, mjf:5.50 },
    { gaugeId:'RB22-002', riverName:'Kirindi Oya',      stationName:'Wellawaya',              district:'Monaragala',    lat:6.7392, lng:81.0989, wl:0.48, al:4.40, mf:5.40, mjf:5.90 },
    { gaugeId:'RB22-003', riverName:'Kuda Oya',         stationName:'Kuda Oya',               district:'Hambantota',    lat:6.2843, lng:81.2341, wl:1.08, al:6.90, mf:8.40, mjf:8.80 },
    { gaugeId:'RB26-001', riverName:'Menik Ganga',      stationName:'Katharagama',            district:'Hambantota',    lat:6.4127, lng:81.3362, wl:-0.16,al:4.00, mf:4.60, mjf:6.50 },
    { gaugeId:'RB31-001', riverName:'Kumbukkan Oya',    stationName:'Nakkala',                district:'Ampara',        lat:7.0341, lng:81.7214, wl:0.54, al:5.00, mf:6.00, mjf:7.50 },
    { gaugeId:'RB36-001', riverName:'Heda Oya',         stationName:'Siyambalanduwa',         district:'Monaragala',    lat:7.0821, lng:81.5432, wl:0.40, al:4.50, mf:6.00, mjf:7.00 },
    { gaugeId:'RB54-001', riverName:'Maduru Oya',       stationName:'Padiyathalawa',          district:'Ampara',        lat:7.3214, lng:81.2897, wl:0.06, al:4.00, mf:4.50, mjf:6.00 },
    { gaugeId:'RB60-001', riverName:'Mahaweli Ganga',   stationName:'Manampitiya',            district:'Polonnaruwa',   lat:7.9832, lng:81.1241, wl:-0.07,al:3.00, mf:4.30, mjf:6.00 },
    { gaugeId:'RB60-002', riverName:'Mahaweli Ganga',   stationName:'Weraganthota',           district:'Kandy',         lat:7.3897, lng:80.8214, wl:-3.35,al:5.00, mf:6.00, mjf:8.00 },
    { gaugeId:'RB60-003', riverName:'Mahaweli Ganga',   stationName:'Peradeniya',             district:'Kandy',         lat:7.2694, lng:80.5963, wl:1.62, al:5.00, mf:7.00, mjf:9.00 },
    { gaugeId:'RB60-004', riverName:'Mahaweli Ganga',   stationName:'Nawalapitiya',           district:'Kandy',         lat:7.0532, lng:80.5314, wl:1.25, al:3.50, mf:5.00, mjf:6.00 },
    { gaugeId:'RB60-005', riverName:'Badulu Oya',       stationName:'Thaldena',               district:'Badulla',       lat:7.0841, lng:81.0562, wl:0.10, al:3.00, mf:4.00, mjf:5.00 },
    { gaugeId:'RB67-001', riverName:'Yan Oya',          stationName:'Horowpothana',           district:'Anuradhapura',  lat:8.1732, lng:80.8941, wl:1.30, al:6.00, mf:7.50, mjf:10.50},
    { gaugeId:'RB69-001', riverName:'Mukunu Oya',       stationName:'Yaka Wewa',              district:'Anuradhapura',  lat:8.3214, lng:80.6543, wl:0.47, al:4.00, mf:5.00, mjf:6.00 },
    { gaugeId:'RB90-001', riverName:'Malwathu Oya',     stationName:'Thanthirimale',          district:'Anuradhapura',  lat:8.5632, lng:80.3214, wl:1.04, al:5.00, mf:6.80, mjf:7.80 },
    { gaugeId:'RB95-001', riverName:'Mee Oya',          stationName:'Galgamuwa',              district:'Kurunegala',    lat:7.9541, lng:80.3821, wl:0.18, al:4.84, mf:5.94, mjf:8.00 },
    { gaugeId:'RB99-001', riverName:'Deduru Oya',       stationName:'Moragaswewa',            district:'Kurunegala',    lat:7.8214, lng:80.1432, wl:0.06, al:4.75, mf:6.00, mjf:7.00 },
    { gaugeId:'RB102-001',riverName:'Maha Oya',         stationName:'Badalgama',              district:'Gampaha',       lat:7.1932, lng:80.0214, wl:2.12, al:5.00, mf:6.20, mjf:9.60 },
    { gaugeId:'RB102-002',riverName:'Maha Oya',         stationName:'Giriulla',               district:'Kurunegala',    lat:7.3214, lng:80.1341, wl:1.03, al:5.50, mf:6.50, mjf:7.50 },
    { gaugeId:'RB103-001',riverName:'Attanagalu Oya',   stationName:'Dunamale',               district:'Gampaha',       lat:7.1541, lng:80.0892, wl:1.12, al:3.30, mf:4.40, mjf:5.50 },
  ];

  const r = await prisma.riverWaterLevel.createMany({
    data: stations.map(s => ({
      gaugeId: s.gaugeId,
      riverName: s.riverName,
      stationName: s.stationName,
      district: s.district,
      latitude: s.lat,
      longitude: s.lng,
      waterLevelMetres: s.wl,
      alertLevel: s.al,
      minorFloodLevel: s.mf,
      majorFloodLevel: s.mjf,
      status: 'NORMAL',
      changeFromLastHour: 0.0,
      trend: 'STABLE',
      recordedAt: new Date(),
      fetchedAt: new Date(),
      flowRateCumecs: 0,
      source: 'SIMULATED',
    })),
    skipDuplicates: true,
  });

  console.log(`✓ Inserted ${r.count} stations`);

  await prisma.downstreamMapping.createMany({
    data: [
      { gaugeId:'RB01-002', riverName:'Kelani Ganga',   stationName:'Hanwella',      targetDistricts:['Colombo','Gampaha','Kalutara'] },
      { gaugeId:'RB01-003', riverName:'Kelani Ganga',   stationName:'Glencourse',    targetDistricts:['Colombo','Kegalle'] },
      { gaugeId:'RB01-004', riverName:'Kelani Ganga',   stationName:'Kithulgala',    targetDistricts:['Kegalle','Colombo'] },
      { gaugeId:'RB03-002', riverName:'Kalu Ganga',     stationName:'Ellagawa',      targetDistricts:['Ratnapura','Kalutara'] },
      { gaugeId:'RB03-003', riverName:'Kalu Ganga',     stationName:'Rathnapura',    targetDistricts:['Ratnapura','Kalutara'] },
      { gaugeId:'RB09-001', riverName:'Gin Ganga',      stationName:'Baddegama',     targetDistricts:['Galle'] },
      { gaugeId:'RB12-002', riverName:'Nilwala Ganga',  stationName:'Panadugama',    targetDistricts:['Matara'] },
      { gaugeId:'RB18-001', riverName:'Walawe Ganga',   stationName:'Moraketiya',    targetDistricts:['Hambantota','Ratnapura'] },
      { gaugeId:'RB60-003', riverName:'Mahaweli Ganga', stationName:'Peradeniya',    targetDistricts:['Kandy','Matale','Trincomalee'] },
      { gaugeId:'RB60-001', riverName:'Mahaweli Ganga', stationName:'Manampitiya',   targetDistricts:['Polonnaruwa','Ampara','Batticaloa'] },
      { gaugeId:'RB67-001', riverName:'Yan Oya',        stationName:'Horowpothana',  targetDistricts:['Anuradhapura','Trincomalee'] },
      { gaugeId:'RB90-001', riverName:'Malwathu Oya',   stationName:'Thanthirimale', targetDistricts:['Anuradhapura'] },
      { gaugeId:'RB102-001',riverName:'Maha Oya',       stationName:'Badalgama',     targetDistricts:['Gampaha','Colombo'] },
      { gaugeId:'RB103-001',riverName:'Attanagalu Oya', stationName:'Dunamale',      targetDistricts:['Gampaha'] },
    ],
    skipDuplicates: true,
  });

  const total = await prisma.riverWaterLevel.count();
  console.log(`✓ Total stations in DB: ${total}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
