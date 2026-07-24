/**
 * Seed: Sri Lanka Public Safe Places & Authority Contacts
 * Run: npx ts-node prisma/seed-safe-places.ts
 */
import { PrismaClient } from './generated/client';

const prisma = new PrismaClient();

const SAFE_PLACES = [
  // ── Colombo District ─────────────────────────────────────────────────────────
  { name: 'D.S. Senanayake Vidyalaya', type: 'SCHOOL', district: 'Colombo', province: 'Western', latitude: 6.9109, longitude: 79.8636, capacity: 500, address: 'Alexandra Place, Colombo 07' },
  { name: 'Colombo National Hospital', type: 'HOSPITAL', district: 'Colombo', province: 'Western', latitude: 6.9217, longitude: 79.8697, capacity: 300, address: 'Regent Street, Colombo 08', phone: '0112691111' },
  { name: 'Viharamahadevi Park', type: 'SPORTS_GROUND', district: 'Colombo', province: 'Western', latitude: 6.9115, longitude: 79.8628, capacity: 2000 },
  { name: 'Colombo Town Hall', type: 'COMMUNITY_HALL', district: 'Colombo', province: 'Western', latitude: 6.9138, longitude: 79.8579, capacity: 800 },
  { name: 'Slave Island Police Station', type: 'POLICE_STATION', district: 'Colombo', province: 'Western', latitude: 6.9173, longitude: 79.8556, phone: '0112326941' },

  // ── Gampaha District ──────────────────────────────────────────────────────────
  { name: 'Gampaha Central College', type: 'SCHOOL', district: 'Gampaha', province: 'Western', latitude: 7.0899, longitude: 79.9993, capacity: 600 },
  { name: 'Gampaha District General Hospital', type: 'HOSPITAL', district: 'Gampaha', province: 'Western', latitude: 7.0889, longitude: 80.0122, capacity: 400, phone: '0332222261' },
  { name: 'Gampaha Pradeshiya Sabha Grounds', type: 'SPORTS_GROUND', district: 'Gampaha', province: 'Western', latitude: 7.0851, longitude: 79.9959, capacity: 1500 },
  { name: 'Negombo Base Hospital', type: 'HOSPITAL', district: 'Gampaha', province: 'Western', latitude: 7.1883, longitude: 79.8428, capacity: 500, phone: '0312222261' },

  // ── Kalutara District ─────────────────────────────────────────────────────────
  { name: 'Kalutara North Hospital', type: 'HOSPITAL', district: 'Kalutara', province: 'Western', latitude: 6.5874, longitude: 79.9591, capacity: 350, phone: '0342222261' },
  { name: 'Kalutara Town Ground', type: 'SPORTS_GROUND', district: 'Kalutara', province: 'Western', latitude: 6.5870, longitude: 79.9601, capacity: 1000 },
  { name: 'Kalutara Police Station', type: 'POLICE_STATION', district: 'Kalutara', province: 'Western', latitude: 6.5858, longitude: 79.9594, phone: '0342222222' },
  { name: 'Sri Sudarshanarama Temple', type: 'TEMPLE', district: 'Kalutara', province: 'Western', latitude: 6.5768, longitude: 79.9563, capacity: 300 },

  // ── Kandy District ────────────────────────────────────────────────────────────
  { name: 'Kandy Teaching Hospital', type: 'HOSPITAL', district: 'Kandy', province: 'Central', latitude: 7.2885, longitude: 80.6399, capacity: 800, phone: '0812222261' },
  { name: 'Kandy Municipal Council Grounds', type: 'SPORTS_GROUND', district: 'Kandy', province: 'Central', latitude: 7.2908, longitude: 80.6327, capacity: 2000 },
  { name: 'Kandy National School', type: 'SCHOOL', district: 'Kandy', province: 'Central', latitude: 7.2936, longitude: 80.6324, capacity: 700 },
  { name: 'Kandy Police Station', type: 'POLICE_STATION', district: 'Kandy', province: 'Central', latitude: 7.2963, longitude: 80.6368, phone: '0812222222' },
  { name: 'Trinity College Kandy', type: 'SCHOOL', district: 'Kandy', province: 'Central', latitude: 7.2887, longitude: 80.6274, capacity: 800 },

  // ── Ratnapura District (High flood risk) ─────────────────────────────────────
  { name: 'Ratnapura Base Hospital', type: 'HOSPITAL', district: 'Ratnapura', province: 'Sabaragamuwa', latitude: 6.6870, longitude: 80.3984, capacity: 400, phone: '0452222261' },
  { name: 'Ratnapura RC Girls School', type: 'SCHOOL', district: 'Ratnapura', province: 'Sabaragamuwa', latitude: 6.6851, longitude: 80.3992, capacity: 500 },
  { name: 'Ratnapura Town Ground', type: 'SPORTS_GROUND', district: 'Ratnapura', province: 'Sabaragamuwa', latitude: 6.6830, longitude: 80.3981, capacity: 1200 },
  { name: 'Sri Gnanarama Temple Ratnapura', type: 'TEMPLE', district: 'Ratnapura', province: 'Sabaragamuwa', latitude: 6.6849, longitude: 80.4021, capacity: 400 },

  // ── Kegalle District (High flood risk) ──────────────────────────────────────
  { name: 'Kegalle General Hospital', type: 'HOSPITAL', district: 'Kegalle', province: 'Sabaragamuwa', latitude: 7.2512, longitude: 80.3468, capacity: 350, phone: '0352222261' },
  { name: 'Kegalle Vidyalaya', type: 'SCHOOL', district: 'Kegalle', province: 'Sabaragamuwa', latitude: 7.2508, longitude: 80.3453, capacity: 600 },
  { name: 'Kegalle Police Station', type: 'POLICE_STATION', district: 'Kegalle', province: 'Sabaragamuwa', latitude: 7.2531, longitude: 80.3441, phone: '0352222222' },

  // ── Nuwara Eliya District ─────────────────────────────────────────────────────
  { name: 'Nuwara Eliya District General Hospital', type: 'HOSPITAL', district: 'Nuwara Eliya', province: 'Central', latitude: 6.9501, longitude: 80.7888, capacity: 300, phone: '0522222261' },
  { name: 'Nuwara Eliya Town Hall', type: 'COMMUNITY_HALL', district: 'Nuwara Eliya', province: 'Central', latitude: 6.9497, longitude: 80.7891, capacity: 600 },

  // ── Galle District ────────────────────────────────────────────────────────────
  { name: 'Karapitiya Teaching Hospital', type: 'HOSPITAL', district: 'Galle', province: 'Southern', latitude: 6.0571, longitude: 80.2180, capacity: 700, phone: '0912222261' },
  { name: 'Richmond College Galle', type: 'SCHOOL', district: 'Galle', province: 'Southern', latitude: 6.0498, longitude: 80.2186, capacity: 800 },
  { name: 'Galle Municipal Council', type: 'COMMUNITY_HALL', district: 'Galle', province: 'Southern', latitude: 6.0355, longitude: 80.2170, capacity: 500 },
  { name: 'Galle Police Station', type: 'POLICE_STATION', district: 'Galle', province: 'Southern', latitude: 6.0261, longitude: 80.2162, phone: '0912222222' },

  // ── Matara District ───────────────────────────────────────────────────────────
  { name: 'Matara Teaching Hospital', type: 'HOSPITAL', district: 'Matara', province: 'Southern', latitude: 5.9469, longitude: 80.5394, capacity: 500, phone: '0412222261' },
  { name: 'Rahula College Matara', type: 'SCHOOL', district: 'Matara', province: 'Southern', latitude: 5.9485, longitude: 80.5425, capacity: 700 },
  { name: 'Matara Town Ground', type: 'SPORTS_GROUND', district: 'Matara', province: 'Southern', latitude: 5.9451, longitude: 80.5381, capacity: 1000 },

  // ── Hambantota District ───────────────────────────────────────────────────────
  { name: 'Hambantota District General Hospital', type: 'HOSPITAL', district: 'Hambantota', province: 'Southern', latitude: 6.1215, longitude: 81.1214, capacity: 350, phone: '0472222261' },
  { name: 'Mahinda College Hambantota', type: 'SCHOOL', district: 'Hambantota', province: 'Southern', latitude: 6.1231, longitude: 81.1199, capacity: 600 },

  // ── Trincomalee District ──────────────────────────────────────────────────────
  { name: 'Trincomalee District General Hospital', type: 'HOSPITAL', district: 'Trincomalee', province: 'Eastern', latitude: 8.5692, longitude: 81.2279, capacity: 400, phone: '0262222261' },
  { name: 'Trincomalee Police Station', type: 'POLICE_STATION', district: 'Trincomalee', province: 'Eastern', latitude: 8.5695, longitude: 81.2316, phone: '0262222222' },
  { name: 'Trincomalee Town Hall', type: 'COMMUNITY_HALL', district: 'Trincomalee', province: 'Eastern', latitude: 8.5661, longitude: 81.2274, capacity: 600 },

  // ── Batticaloa District ───────────────────────────────────────────────────────
  { name: 'Batticaloa Teaching Hospital', type: 'HOSPITAL', district: 'Batticaloa', province: 'Eastern', latitude: 7.7112, longitude: 81.6954, capacity: 500, phone: '0652222261' },
  { name: 'Batticaloa Central College', type: 'SCHOOL', district: 'Batticaloa', province: 'Eastern', latitude: 7.7133, longitude: 81.6929, capacity: 600 },
  { name: 'Batticaloa Police Station', type: 'POLICE_STATION', district: 'Batticaloa', province: 'Eastern', latitude: 7.7097, longitude: 81.6922, phone: '0652222222' },

  // ── Jaffna District ───────────────────────────────────────────────────────────
  { name: 'Jaffna Teaching Hospital', type: 'HOSPITAL', district: 'Jaffna', province: 'Northern', latitude: 9.6641, longitude: 80.0134, capacity: 600, phone: '0212222261' },
  { name: 'Jaffna Central College', type: 'SCHOOL', district: 'Jaffna', province: 'Northern', latitude: 9.6622, longitude: 80.0151, capacity: 700 },
  { name: 'Nainativu Nagapooshani Amman Temple', type: 'TEMPLE', district: 'Jaffna', province: 'Northern', latitude: 9.7008, longitude: 79.8977, capacity: 500 },

  // ── Kurunegala District ───────────────────────────────────────────────────────
  { name: 'Kurunegala Teaching Hospital', type: 'HOSPITAL', district: 'Kurunegala', province: 'North Western', latitude: 7.4858, longitude: 80.3681, capacity: 600, phone: '0372222261' },
  { name: 'Dharmaraja College Kurunegala', type: 'SCHOOL', district: 'Kurunegala', province: 'North Western', latitude: 7.4845, longitude: 80.3652, capacity: 700 },
  { name: 'Kurunegala Municipal Ground', type: 'SPORTS_GROUND', district: 'Kurunegala', province: 'North Western', latitude: 7.4862, longitude: 80.3638, capacity: 1500 },

  // ── Anuradhapura District ─────────────────────────────────────────────────────
  { name: 'Anuradhapura Teaching Hospital', type: 'HOSPITAL', district: 'Anuradhapura', province: 'North Central', latitude: 8.3051, longitude: 80.4006, capacity: 700, phone: '0252222261' },
  { name: 'Anuradhapura Maha Vidyalaya', type: 'SCHOOL', district: 'Anuradhapura', province: 'North Central', latitude: 8.3067, longitude: 80.3994, capacity: 600 },
  { name: 'Ruwanwelisaya (Sacred Area)', type: 'TEMPLE', district: 'Anuradhapura', province: 'North Central', latitude: 8.3484, longitude: 80.3972, capacity: 3000 },

  // ── Badulla District ──────────────────────────────────────────────────────────
  { name: 'Badulla District General Hospital', type: 'HOSPITAL', district: 'Badulla', province: 'Uva', latitude: 6.9891, longitude: 81.0541, capacity: 400, phone: '0552222261' },
  { name: 'Badulla Central College', type: 'SCHOOL', district: 'Badulla', province: 'Uva', latitude: 6.9912, longitude: 81.0561, capacity: 600 },

  // ── Puttalam District ─────────────────────────────────────────────────────────
  { name: 'Puttalam District General Hospital', type: 'HOSPITAL', district: 'Puttalam', province: 'North Western', latitude: 8.0382, longitude: 79.8354, capacity: 300, phone: '0322222261' },
  { name: 'Puttalam Maha Vidyalaya', type: 'SCHOOL', district: 'Puttalam', province: 'North Western', latitude: 8.0391, longitude: 79.8371, capacity: 500 },
];

const AUTHORITY_CONTACTS = [
  { district: 'Colombo',       role: 'DMC_OFFICER',      name: 'Mr. Asanka Perera',      phone: '0112136136', email: 'dmc.colombo@dmc.gov.lk' },
  { district: 'Colombo',       role: 'POLICE',            name: 'OIC Colombo South',       phone: '0112433333' },
  { district: 'Colombo',       role: 'CIVIL_DEFENSE',     name: 'Colombo Civil Defense',   phone: '0112421052' },
  { district: 'Gampaha',       role: 'DMC_OFFICER',      name: 'Mr. Ruwan Silva',         phone: '0332222100', email: 'dmc.gampaha@dmc.gov.lk' },
  { district: 'Gampaha',       role: 'POLICE',            name: 'OIC Gampaha',             phone: '0332222222' },
  { district: 'Kalutara',      role: 'DMC_OFFICER',      name: 'Mrs. Nirosha Fernando',   phone: '0342222100', email: 'dmc.kalutara@dmc.gov.lk' },
  { district: 'Kalutara',      role: 'POLICE',            name: 'OIC Kalutara',            phone: '0342222333' },
  { district: 'Kandy',         role: 'DMC_OFFICER',      name: 'Mr. Priyantha Bandara',   phone: '0812222100', email: 'dmc.kandy@dmc.gov.lk' },
  { district: 'Kandy',         role: 'POLICE',            name: 'OIC Kandy',               phone: '0812222222' },
  { district: 'Kandy',         role: 'FIRE_BRIGADE',      name: 'Kandy Fire Brigade',      phone: '0812234567' },
  { district: 'Ratnapura',     role: 'DMC_OFFICER',      name: 'Mr. Saman Dissanayake',   phone: '0452222100', email: 'dmc.ratnapura@dmc.gov.lk' },
  { district: 'Ratnapura',     role: 'POLICE',            name: 'OIC Ratnapura',           phone: '0452222222' },
  { district: 'Ratnapura',     role: 'GRAMA_NILADHARI',   name: 'GN Ratnapura Town',       phone: '0712345601' },
  { district: 'Kegalle',       role: 'DMC_OFFICER',      name: 'Ms. Chamari Jayawardena', phone: '0352222100', email: 'dmc.kegalle@dmc.gov.lk' },
  { district: 'Kegalle',       role: 'POLICE',            name: 'OIC Kegalle',             phone: '0352222222' },
  { district: 'Nuwara Eliya',  role: 'DMC_OFFICER',      name: 'Mr. Lalith Gamage',        phone: '0522222100' },
  { district: 'Nuwara Eliya',  role: 'POLICE',            name: 'OIC Nuwara Eliya',        phone: '0522222222' },
  { district: 'Galle',         role: 'DMC_OFFICER',      name: 'Mr. Samantha Ranatunga',  phone: '0912222100', email: 'dmc.galle@dmc.gov.lk' },
  { district: 'Galle',         role: 'POLICE',            name: 'OIC Galle',               phone: '0912222222' },
  { district: 'Galle',         role: 'FIRE_BRIGADE',      name: 'Galle Fire Brigade',      phone: '0912234567' },
  { district: 'Matara',        role: 'DMC_OFFICER',      name: 'Mrs. Nilanthi Wickrama',  phone: '0412222100' },
  { district: 'Matara',        role: 'POLICE',            name: 'OIC Matara',              phone: '0412222222' },
  { district: 'Hambantota',    role: 'DMC_OFFICER',      name: 'Mr. Prabath Herath',       phone: '0472222100' },
  { district: 'Hambantota',    role: 'POLICE',            name: 'OIC Hambantota',          phone: '0472222222' },
  { district: 'Trincomalee',   role: 'DMC_OFFICER',      name: 'Mr. Ranjith Jayasinghe',  phone: '0262222100' },
  { district: 'Trincomalee',   role: 'POLICE',            name: 'OIC Trincomalee',         phone: '0262222222' },
  { district: 'Batticaloa',    role: 'DMC_OFFICER',      name: 'Mr. Sanjeewa Madusanka',  phone: '0652222100' },
  { district: 'Batticaloa',    role: 'POLICE',            name: 'OIC Batticaloa',          phone: '0652222222' },
  { district: 'Jaffna',        role: 'DMC_OFFICER',      name: 'Mr. Krishnan Natarajan',  phone: '0212222100', email: 'dmc.jaffna@dmc.gov.lk' },
  { district: 'Jaffna',        role: 'POLICE',            name: 'OIC Jaffna',              phone: '0212222222' },
  { district: 'Kurunegala',    role: 'DMC_OFFICER',      name: 'Mr. Athula Bandara',       phone: '0372222100' },
  { district: 'Kurunegala',    role: 'POLICE',            name: 'OIC Kurunegala',          phone: '0372222222' },
  { district: 'Anuradhapura',  role: 'DMC_OFFICER',      name: 'Mr. Keerthi Rajapaksa',   phone: '0252222100' },
  { district: 'Anuradhapura',  role: 'POLICE',            name: 'OIC Anuradhapura',        phone: '0252222222' },
  { district: 'Badulla',       role: 'DMC_OFFICER',      name: 'Mrs. Malkanthi Siriwardena', phone: '0552222100' },
  { district: 'Badulla',       role: 'POLICE',            name: 'OIC Badulla',             phone: '0552222222' },
  { district: 'Puttalam',      role: 'DMC_OFFICER',      name: 'Mr. Kasun Mendis',         phone: '0322222100' },
  { district: 'Puttalam',      role: 'POLICE',            name: 'OIC Puttalam',            phone: '0322222222' },
  // National emergency
  { district: 'ALL',           role: 'NATIONAL_EMERGENCY', name: 'National Emergency Operation Center', phone: '1938', phone2: '011-2136136' },
  { district: 'ALL',           role: 'DISASTER_HOTLINE',   name: 'Disaster Management Center Hotline', phone: '117' },
];

async function main() {
  console.log('Seeding PublicSafePlace...');
  for (const place of SAFE_PLACES) {
    await prisma.publicSafePlace.upsert({
      where: { id: place.name + '_' + place.district },
      update: place,
      create: { id: place.name.replace(/\s/g, '_').toLowerCase() + '_' + place.district.toLowerCase(), ...place },
    });
  }
  console.log(`Seeded ${SAFE_PLACES.length} safe places.`);

  console.log('Seeding AuthorityContact...');
  for (const contact of AUTHORITY_CONTACTS) {
    await prisma.authorityContact.create({ data: contact });
  }
  console.log(`Seeded ${AUTHORITY_CONTACTS.length} authority contacts.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
