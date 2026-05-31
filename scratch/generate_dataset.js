const fs = require('fs');

const NUM_RECORDS = 5000;
const START_YEAR = 2018;

// Districts categorized by climatic/geographic zones in Sri Lanka
const ZONES = {
  WET: ['Colombo', 'Gampaha', 'Kalutara', 'Galle', 'Matara'],
  HILL: ['Ratnapura', 'Kegalle', 'Nuwara Eliya', 'Badulla', 'Kandy', 'Matale'],
  DRY: ['Anuradhapura', 'Polonnaruwa', 'Monaragala', 'Hambantota', 'Puttalam', 'Vavuniya', 'Mannar', 'Kurunegala'],
  EAST_NORTH: ['Trincomalee', 'Batticaloa', 'Ampara', 'Jaffna', 'Kilinochchi', 'Mullaitivu']
};

const INCIDENTS = ['Flood', 'Landslide', 'Drought', 'High Winds/Cyclone', 'Forest Fire', 'Animal Attack'];

// Helper for random selection based on weights
function weightedRandom(items, weights) {
  let i;
  let weightsSum = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * weightsSum;
  for (i = 0; i < items.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return items[i];
  }
  return items[items.length - 1];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random date
function getRandomDate() {
  const start = new Date(START_YEAR, 0, 1).getTime();
  const end = new Date().getTime(); // up to today
  const date = new Date(start + Math.random() * (end - start));
  return date;
}

function generateRecord(idCounter) {
  const date = getRandomDate();
  const month = date.getMonth(); // 0-11
  
  // Determine season
  let isSWMonsoon = month >= 4 && month <= 8; // May - Sept
  let isNEMonsoon = month === 11 || month === 0 || month === 1; // Dec - Feb
  let isDrySeason = month >= 6 && month <= 8; // July - Sept (severe in dry zone)

  // 1. Pick a District (Weighted slightly towards populated/vulnerable areas)
  const zoneKeys = Object.keys(ZONES);
  const zoneWeights = [0.35, 0.25, 0.25, 0.15]; // Wet, Hill, Dry, East/North
  const zone = weightedRandom(zoneKeys, zoneWeights);
  const district = ZONES[zone][Math.floor(Math.random() * ZONES[zone].length)];

  // 2. Pick Incident based on Zone and Season (REALISM LOGIC)
  let incidentWeights = [0, 0, 0, 0, 0, 0]; // Flood, Landslide, Drought, Cyclone, Fire, Animal
  
  if (zone === 'WET') {
    incidentWeights = isSWMonsoon ? [0.8, 0.1, 0, 0.1, 0, 0] : [0.6, 0.05, 0, 0.15, 0, 0.2];
  } else if (zone === 'HILL') {
    incidentWeights = isSWMonsoon ? [0.4, 0.5, 0, 0.1, 0, 0] : [0.3, 0.4, 0, 0.1, 0.1, 0.1];
  } else if (zone === 'DRY') {
    incidentWeights = isNEMonsoon ? [0.7, 0, 0, 0.1, 0, 0.2] : (isDrySeason ? [0.05, 0, 0.6, 0.05, 0.1, 0.2] : [0.3, 0, 0.4, 0.1, 0.05, 0.15]);
  } else if (zone === 'EAST_NORTH') {
    incidentWeights = isNEMonsoon ? [0.5, 0, 0, 0.4, 0, 0.1] : (isDrySeason ? [0.05, 0, 0.6, 0.05, 0.1, 0.2] : [0.3, 0, 0.3, 0.2, 0, 0.2]);
  }
  
  const incidentType = weightedRandom(INCIDENTS, incidentWeights);

  // 3. Determine Severity (1-5) and scale metrics accordingly
  // Floods and Cyclones can be high severity. Animal attacks usually 1-2.
  let severityWeights = [0.4, 0.3, 0.15, 0.1, 0.05]; // Default skew to low severity
  if (incidentType === 'Animal Attack') severityWeights = [0.8, 0.2, 0, 0, 0];
  if (incidentType === 'Flood' && (isSWMonsoon || isNEMonsoon)) severityWeights = [0.2, 0.3, 0.3, 0.15, 0.05];
  if (incidentType === 'Cyclone') severityWeights = [0.1, 0.2, 0.3, 0.3, 0.1];
  
  const severity = weightedRandom([1, 2, 3, 4, 5], severityWeights);

  // 4. Correlate Affected Population and Damages with Severity and Type
  let affectedPopulation = 0;
  let casualties = 0;
  let responseTimeMins = getRandomInt(15, 120);

  if (incidentType === 'Drought') {
    affectedPopulation = getRandomInt(5000, 50000) * severity;
    casualties = 0;
    responseTimeMins = getRandomInt(1440, 4320); // Days for drought relief
  } else if (incidentType === 'Flood' || incidentType === 'High Winds/Cyclone') {
    affectedPopulation = getRandomInt(50, 2000) * (severity ** 2);
    casualties = severity > 3 ? getRandomInt(0, severity * 2) : 0;
  } else if (incidentType === 'Landslide') {
    affectedPopulation = getRandomInt(10, 500) * severity;
    casualties = severity > 2 ? getRandomInt(0, severity * 5) : 0;
    responseTimeMins = getRandomInt(30, 180);
  } else if (incidentType === 'Forest Fire') {
    affectedPopulation = getRandomInt(0, 100) * severity;
    responseTimeMins = getRandomInt(45, 240);
  } else {
    // Animal Attack
    affectedPopulation = getRandomInt(1, 10);
    casualties = getRandomInt(0, 2);
    responseTimeMins = getRandomInt(30, 90);
  }

  // 5. Requirements
  let requirements = [];
  if (incidentType === 'Flood' || incidentType === 'Landslide') {
    if (severity > 2) requirements.push('Boats', 'Rescue Teams');
    requirements.push('Dry Rations', 'Medical Kits');
  } else if (incidentType === 'Drought') {
    requirements.push('Water Bowsers', 'Dry Rations');
  } else if (incidentType === 'Forest Fire') {
    requirements.push('Fire Trucks', 'Air Support');
  } else if (incidentType === 'Animal Attack') {
    requirements.push('Wildlife Officers', 'Veterinary Kits');
  }
  const resources = requirements.join('|');

  const statuses = ['RESOLVED', 'RESOLVED', 'RESOLVED', 'RESOLVED', 'IN_PROGRESS'];
  const status = date.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 ? weightedRandom(statuses, [0.4, 0.1, 0.1, 0.1, 0.3]) : 'RESOLVED';
  
  const reportedBy = weightedRandom(['CITIZEN', 'OFFICER', 'SENSOR', 'MEDIA'], [0.5, 0.3, 0.15, 0.05]);
  
  const id = `INC-${date.getFullYear()}-${String(idCounter).padStart(4, '0')}`;
  
  return [
    id,
    date.toISOString(),
    district,
    zone,
    incidentType,
    severity,
    affectedPopulation,
    casualties,
    resources,
    responseTimeMins,
    status,
    reportedBy
  ].join(',');
}

const headers = [
  'Incident_ID',
  'Timestamp',
  'District',
  'Zone',
  'Incident_Type',
  'Severity_Level',
  'Affected_Population',
  'Casualties',
  'Required_Resources',
  'Response_Time_Mins',
  'Status',
  'Reported_By'
].join(',');

let csvContent = headers + '\n';
for (let i = 1; i <= NUM_RECORDS; i++) {
  csvContent += generateRecord(i) + '\n';
}

fs.writeFileSync('d:/Suraksha - Web App/scratch/dmc_srilanka_dataset.csv', csvContent);
console.log('Successfully generated 5000 realistic DMC records at d:/Suraksha - Web App/scratch/dmc_srilanka_dataset.csv');
