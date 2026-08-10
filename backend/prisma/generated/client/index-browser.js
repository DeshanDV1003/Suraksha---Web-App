
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.4.1
 * Query Engine version: a9055b89e58b4b5bfb59600785423b1db3d0e75d
 */
Prisma.prismaVersion = {
  client: "6.4.1",
  engine: "a9055b89e58b4b5bfb59600785423b1db3d0e75d"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  password: 'password',
  name: 'name',
  phone: 'phone',
  googleId: 'googleId',
  pushToken: 'pushToken',
  role: 'role',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  region: 'region',
  hasMobileApp: 'hasMobileApp',
  isFieldActive: 'isFieldActive',
  lastCheckInTime: 'lastCheckInTime',
  nic: 'nic',
  twoFactorEnabled: 'twoFactorEnabled',
  twoFactorGracePeriodEnds: 'twoFactorGracePeriodEnds',
  twoFactorSecret: 'twoFactorSecret',
  profilePicture: 'profilePicture',
  currentSectorId: 'currentSectorId'
};

exports.Prisma.IncidentReportScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  location: 'location',
  latitude: 'latitude',
  longitude: 'longitude',
  status: 'status',
  severity: 'severity',
  category: 'category',
  images: 'images',
  reporterId: 'reporterId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  province: 'province',
  zoneId: 'zoneId',
  zoneName: 'zoneName',
  mlConfidence: 'mlConfidence',
  detectedLanguage: 'detectedLanguage',
  languageConfidence: 'languageConfidence',
  translatedText: 'translatedText',
  nlpEntities: 'nlpEntities'
};

exports.Prisma.AlertScalarFieldEnum = {
  id: 'id',
  title: 'title',
  message: 'message',
  type: 'type',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  latitudes: 'latitudes',
  locations: 'locations',
  longitudes: 'longitudes',
  acknowledgementRate: 'acknowledgementRate',
  channels: 'channels',
  scheduledTime: 'scheduledTime',
  translatedMsgSinhala: 'translatedMsgSinhala',
  translatedMsgTamil: 'translatedMsgTamil',
  targetSectors: 'targetSectors',
  broadcastRadiusKm: 'broadcastRadiusKm',
  notifiedCount: 'notifiedCount'
};

exports.Prisma.SectorScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  polygonData: 'polygonData',
  district: 'district',
  province: 'province'
};

exports.Prisma.ReliefCampScalarFieldEnum = {
  id: 'id',
  name: 'name',
  location: 'location',
  latitude: 'latitude',
  longitude: 'longitude',
  currentOccupancy: 'currentOccupancy',
  totalCapacity: 'totalCapacity',
  services: 'services',
  status: 'status',
  waitTime: 'waitTime',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ResourceScalarFieldEnum = {
  id: 'id',
  type: 'type',
  owner: 'owner',
  location: 'location',
  capacity: 'capacity',
  status: 'status',
  contact: 'contact',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TaskScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  incidentId: 'incidentId',
  assignedToId: 'assignedToId',
  assignedById: 'assignedById',
  priority: 'priority',
  status: 'status',
  dueDate: 'dueDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VolunteerProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  createdAt: 'createdAt',
  incidentsJoined: 'incidentsJoined',
  readinessScore: 'readinessScore',
  totalHours: 'totalHours',
  updatedAt: 'updatedAt'
};

exports.Prisma.HelpRequestScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  description: 'description',
  location: 'location',
  latitude: 'latitude',
  longitude: 'longitude',
  priority: 'priority',
  status: 'status',
  peopleCount: 'peopleCount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  assignedVolunteerId: 'assignedVolunteerId',
  escalationLevel: 'escalationLevel',
  phone: 'phone'
};

exports.Prisma.HelpRequestEscalationScalarFieldEnum = {
  id: 'id',
  helpRequestId: 'helpRequestId',
  level: 'level',
  message: 'message',
  triggeredAt: 'triggeredAt'
};

exports.Prisma.ReportVerificationScalarFieldEnum = {
  id: 'id',
  reportId: 'reportId',
  userId: 'userId',
  status: 'status',
  comment: 'comment',
  createdAt: 'createdAt'
};

exports.Prisma.MissingPersonScalarFieldEnum = {
  id: 'id',
  name: 'name',
  age: 'age',
  description: 'description',
  lastSeen: 'lastSeen',
  photo: 'photo',
  reportedBy: 'reportedBy',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  nic: 'nic',
  contactName: 'contactName',
  contactPhone: 'contactPhone',
  gender: 'gender',
  isUnidentified: 'isUnidentified',
  reunificationNotes: 'reunificationNotes',
  reunificationStatus: 'reunificationStatus'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  alertId: 'alertId',
  title: 'title',
  message: 'message',
  read: 'read',
  readAt: 'readAt',
  createdAt: 'createdAt'
};

exports.Prisma.MLLogScalarFieldEnum = {
  id: 'id',
  incidentId: 'incidentId',
  inputData: 'inputData',
  prediction: 'prediction',
  confidence: 'confidence',
  modelVersion: 'modelVersion',
  createdAt: 'createdAt'
};

exports.Prisma.IncidentHistoryScalarFieldEnum = {
  id: 'id',
  incidentId: 'incidentId',
  status: 'status',
  updatedBy: 'updatedBy',
  note: 'note',
  createdAt: 'createdAt'
};

exports.Prisma.ResourceRequestMatchScalarFieldEnum = {
  id: 'id',
  requestId: 'requestId',
  resourceId: 'resourceId',
  matchScore: 'matchScore',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.CampSupplyRequestScalarFieldEnum = {
  id: 'id',
  campId: 'campId',
  requesterId: 'requesterId',
  itemType: 'itemType',
  quantity: 'quantity',
  urgency: 'urgency',
  status: 'status',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  entity: 'entity',
  entityId: 'entityId',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.LocationLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  latitude: 'latitude',
  longitude: 'longitude',
  createdAt: 'createdAt'
};

exports.Prisma.ReliefTokenScalarFieldEnum = {
  id: 'id',
  code: 'code',
  qrCodeData: 'qrCodeData',
  userId: 'userId',
  campId: 'campId',
  status: 'status',
  usageCount: 'usageCount',
  maxUsage: 'maxUsage',
  issuedAt: 'issuedAt',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  categories: 'categories',
  donorId: 'donorId',
  fraudRiskScore: 'fraudRiskScore',
  householdId: 'householdId',
  isHouseholdBundle: 'isHouseholdBundle'
};

exports.Prisma.ReliefTokenClaimScalarFieldEnum = {
  id: 'id',
  tokenId: 'tokenId',
  claimedAt: 'claimedAt',
  claimedBy: 'claimedBy',
  itemType: 'itemType',
  quantity: 'quantity',
  proofImage: 'proofImage',
  campId: 'campId',
  notes: 'notes',
  locationLat: 'locationLat',
  locationLng: 'locationLng'
};

exports.Prisma.DamageAssessmentScalarFieldEnum = {
  id: 'id',
  reportedById: 'reportedById',
  incidentId: 'incidentId',
  location: 'location',
  latitude: 'latitude',
  longitude: 'longitude',
  category: 'category',
  structuralDamage: 'structuralDamage',
  cropDamage: 'cropDamage',
  utilityDamage: 'utilityDamage',
  roadDamage: 'roadDamage',
  affectedPersons: 'affectedPersons',
  estimatedLoss: 'estimatedLoss',
  mediaUrls: 'mediaUrls',
  status: 'status',
  notes: 'notes',
  verifiedById: 'verifiedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  aiEstimatedCost: 'aiEstimatedCost',
  aiEstimatedDamage: 'aiEstimatedDamage',
  compensationEligibilityScore: 'compensationEligibilityScore',
  compensationEligible: 'compensationEligible',
  familyVulnerabilityScore: 'familyVulnerabilityScore',
  incomeBracket: 'incomeBracket',
  polygonData: 'polygonData',
  propertyOwnershipStatus: 'propertyOwnershipStatus',
  reviewerNotes: 'reviewerNotes'
};

exports.Prisma.LocalVerifierScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  verifierRole: 'verifierRole',
  jurisdiction: 'jurisdiction',
  orgName: 'orgName',
  isApproved: 'isApproved',
  approvedAt: 'approvedAt',
  approvedById: 'approvedById',
  verificationsCount: 'verificationsCount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VerifierActionScalarFieldEnum = {
  id: 'id',
  verifierId: 'verifierId',
  incidentId: 'incidentId',
  helpRequestId: 'helpRequestId',
  result: 'result',
  comment: 'comment',
  createdAt: 'createdAt'
};

exports.Prisma.PsychologicalSupportRequestScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  description: 'description',
  urgency: 'urgency',
  status: 'status',
  anonymous: 'anonymous',
  location: 'location',
  affectedCount: 'affectedCount',
  assignedToId: 'assignedToId',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  checkInStatus: 'checkInStatus',
  nextCheckInDate: 'nextCheckInDate'
};

exports.Prisma.ThreatForecastScalarFieldEnum = {
  id: 'id',
  district: 'district',
  threatType: 'threatType',
  confidence: 'confidence',
  severity: 'severity',
  forecastTime: 'forecastTime',
  createdAt: 'createdAt'
};

exports.Prisma.ShiftHandoverScalarFieldEnum = {
  id: 'id',
  shiftTime: 'shiftTime',
  incidentsOpened: 'incidentsOpened',
  incidentsClosed: 'incidentsClosed',
  resourcesDeployed: 'resourcesDeployed',
  volunteersActive: 'volunteersActive',
  criticalItems: 'criticalItems',
  createdAt: 'createdAt'
};

exports.Prisma.EvacuationRouteScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  coordinates: 'coordinates',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VolunteerLocationScalarFieldEnum = {
  id: 'id',
  volunteerId: 'volunteerId',
  latitude: 'latitude',
  longitude: 'longitude',
  status: 'status',
  skill: 'skill',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ThreatProjectionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  polygonCoords: 'polygonCoords',
  riskLevel: 'riskLevel',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AfterActionReportScalarFieldEnum = {
  id: 'id',
  incidentId: 'incidentId',
  timeline: 'timeline',
  resourcesUsed: 'resourcesUsed',
  costEstimate: 'costEstimate',
  peopleAffected: 'peopleAffected',
  resolutionTime: 'resolutionTime',
  lessonsLearned: 'lessonsLearned',
  createdAt: 'createdAt'
};

exports.Prisma.KPIBenchmarkScalarFieldEnum = {
  id: 'id',
  month: 'month',
  targetAvgResponse: 'targetAvgResponse',
  targetOccupancy: 'targetOccupancy',
  targetVolunteer: 'targetVolunteer',
  createdAt: 'createdAt'
};

exports.Prisma.ResourceCostScalarFieldEnum = {
  id: 'id',
  resourceType: 'resourceType',
  unitCost: 'unitCost',
  unitType: 'unitType',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DisasterBudgetScalarFieldEnum = {
  id: 'id',
  eventName: 'eventName',
  allocatedBudget: 'allocatedBudget',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ResourceExpenditureScalarFieldEnum = {
  id: 'id',
  resourceCostId: 'resourceCostId',
  quantity: 'quantity',
  totalCost: 'totalCost',
  budgetId: 'budgetId',
  createdAt: 'createdAt'
};

exports.Prisma.RolePermissionScalarFieldEnum = {
  id: 'id',
  role: 'role',
  module: 'module',
  canView: 'canView',
  canEdit: 'canEdit',
  canDelete: 'canDelete',
  updatedAt: 'updatedAt',
  updatedBy: 'updatedBy'
};

exports.Prisma.UserSessionLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  ipAddress: 'ipAddress',
  device: 'device',
  location: 'location',
  loginTime: 'loginTime'
};

exports.Prisma.CampResidentScalarFieldEnum = {
  id: 'id',
  campId: 'campId',
  name: 'name',
  nic: 'nic',
  familySize: 'familySize',
  checkInTime: 'checkInTime',
  checkOutTime: 'checkOutTime',
  status: 'status'
};

exports.Prisma.CampInventoryScalarFieldEnum = {
  id: 'id',
  campId: 'campId',
  itemType: 'itemType',
  quantity: 'quantity',
  threshold: 'threshold',
  lastUpdated: 'lastUpdated'
};

exports.Prisma.CampScheduleScalarFieldEnum = {
  id: 'id',
  campId: 'campId',
  activityName: 'activityName',
  startTime: 'startTime',
  endTime: 'endTime',
  type: 'type'
};

exports.Prisma.HospitalReferralScalarFieldEnum = {
  id: 'id',
  campId: 'campId',
  patientName: 'patientName',
  conditionSeverity: 'conditionSeverity',
  hospitalAssigned: 'hospitalAssigned',
  transportMethod: 'transportMethod',
  outcome: 'outcome',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.CampTransferRequestScalarFieldEnum = {
  id: 'id',
  fromCampId: 'fromCampId',
  toCampId: 'toCampId',
  peopleCount: 'peopleCount',
  status: 'status',
  requestDate: 'requestDate'
};

exports.Prisma.DonorCampaignScalarFieldEnum = {
  id: 'id',
  donorName: 'donorName',
  contributionAmount: 'contributionAmount',
  targetCategories: 'targetCategories',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VolunteerSkillScalarFieldEnum = {
  id: 'id',
  volunteerId: 'volunteerId',
  skillName: 'skillName',
  certificationUrl: 'certificationUrl'
};

exports.Prisma.VolunteerTrainingScalarFieldEnum = {
  id: 'id',
  volunteerId: 'volunteerId',
  trainingName: 'trainingName',
  completedAt: 'completedAt',
  expiresAt: 'expiresAt'
};

exports.Prisma.VolunteerCheckInScalarFieldEnum = {
  id: 'id',
  volunteerId: 'volunteerId',
  checkInTime: 'checkInTime',
  checkOutTime: 'checkOutTime',
  latitude: 'latitude',
  longitude: 'longitude',
  zone: 'zone',
  activeHours: 'activeHours'
};

exports.Prisma.VolunteerWellbeingScalarFieldEnum = {
  id: 'id',
  volunteerId: 'volunteerId',
  recordedAt: 'recordedAt',
  physicalRating: 'physicalRating',
  mentalRating: 'mentalRating',
  needsResources: 'needsResources',
  distressFlag: 'distressFlag'
};

exports.Prisma.VolunteerBadgeScalarFieldEnum = {
  id: 'id',
  volunteerId: 'volunteerId',
  badgeType: 'badgeType',
  earnedAt: 'earnedAt'
};

exports.Prisma.ChatSessionScalarFieldEnum = {
  id: 'id',
  requestId: 'requestId',
  counselorId: 'counselorId',
  userId: 'userId',
  status: 'status',
  startedAt: 'startedAt',
  endedAt: 'endedAt',
  moodAfter: 'moodAfter'
};

exports.Prisma.ChatMessageScalarFieldEnum = {
  id: 'id',
  sessionId: 'sessionId',
  senderId: 'senderId',
  content: 'content',
  createdAt: 'createdAt'
};

exports.Prisma.GroupTherapySessionScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  campId: 'campId',
  counselorId: 'counselorId',
  scheduledFor: 'scheduledFor',
  maxParticipants: 'maxParticipants',
  status: 'status'
};

exports.Prisma.DonationScalarFieldEnum = {
  id: 'id',
  donorId: 'donorId',
  donorName: 'donorName',
  type: 'type',
  amount: 'amount',
  itemsDescription: 'itemsDescription',
  transactionId: 'transactionId',
  paymentGateway: 'paymentGateway',
  transactionDate: 'transactionDate',
  status: 'status',
  campId: 'campId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SafetyCheckInScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  status: 'status',
  message: 'message',
  latitude: 'latitude',
  longitude: 'longitude',
  createdAt: 'createdAt'
};

exports.Prisma.FamilyMemberScalarFieldEnum = {
  id: 'id',
  primaryUserId: 'primaryUserId',
  name: 'name',
  relation: 'relation',
  age: 'age',
  status: 'status',
  notes: 'notes',
  phone: 'phone',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GroupTherapyParticipantScalarFieldEnum = {
  id: 'id',
  sessionId: 'sessionId',
  userId: 'userId',
  attendanceStatus: 'attendanceStatus',
  notes: 'notes'
};

exports.Prisma.MentalHealthGuideScalarFieldEnum = {
  id: 'id',
  title: 'title',
  content: 'content',
  tags: 'tags',
  isOfflineAvailable: 'isOfflineAvailable',
  createdAt: 'createdAt'
};

exports.Prisma.RainfallReadingScalarFieldEnum = {
  id: 'id',
  stationId: 'stationId',
  stationName: 'stationName',
  district: 'district',
  province: 'province',
  latitude: 'latitude',
  longitude: 'longitude',
  rainfallMmPerHour: 'rainfallMmPerHour',
  cumulativeRain24h: 'cumulativeRain24h',
  cumulativeRain72h: 'cumulativeRain72h',
  riskLevel: 'riskLevel',
  recordedAt: 'recordedAt',
  fetchedAt: 'fetchedAt',
  source: 'source'
};

exports.Prisma.RainfallAlertLogScalarFieldEnum = {
  id: 'id',
  district: 'district',
  lastFiredAt: 'lastFiredAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RiverWaterLevelScalarFieldEnum = {
  id: 'id',
  gaugeId: 'gaugeId',
  riverName: 'riverName',
  stationName: 'stationName',
  district: 'district',
  latitude: 'latitude',
  longitude: 'longitude',
  waterLevelMetres: 'waterLevelMetres',
  flowRateCumecs: 'flowRateCumecs',
  alertLevel: 'alertLevel',
  minorFloodLevel: 'minorFloodLevel',
  majorFloodLevel: 'majorFloodLevel',
  status: 'status',
  changeFromLastHour: 'changeFromLastHour',
  trend: 'trend',
  recordedAt: 'recordedAt',
  fetchedAt: 'fetchedAt',
  source: 'source'
};

exports.Prisma.DownstreamMappingScalarFieldEnum = {
  id: 'id',
  gaugeId: 'gaugeId',
  riverName: 'riverName',
  stationName: 'stationName',
  targetDistricts: 'targetDistricts',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.IncidentDuplicateLinkScalarFieldEnum = {
  id: 'id',
  reportId: 'reportId',
  canonicalId: 'canonicalId',
  score: 'score',
  distanceM: 'distanceM',
  status: 'status',
  reasons: 'reasons',
  createdAt: 'createdAt'
};

exports.Prisma.PublicSafePlaceScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  district: 'district',
  province: 'province',
  latitude: 'latitude',
  longitude: 'longitude',
  capacity: 'capacity',
  address: 'address',
  phone: 'phone',
  isVerified: 'isVerified',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AuthorityContactScalarFieldEnum = {
  id: 'id',
  district: 'district',
  role: 'role',
  name: 'name',
  phone: 'phone',
  phone2: 'phone2',
  email: 'email',
  sector: 'sector',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.RescueVehicleScalarFieldEnum = {
  id: 'id',
  type: 'type',
  name: 'name',
  capacity: 'capacity',
  area: 'area',
  latitude: 'latitude',
  longitude: 'longitude',
  status: 'status',
  contactPhone: 'contactPhone',
  operatorName: 'operatorName',
  assignedById: 'assignedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RescueMissionScalarFieldEnum = {
  id: 'id',
  vehicleId: 'vehicleId',
  area: 'area',
  destinationCampId: 'destinationCampId',
  status: 'status',
  evacuatedCount: 'evacuatedCount',
  assignedById: 'assignedById',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  completedAt: 'completedAt'
};

exports.Prisma.SafeZoneCheckInScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  missionId: 'missionId',
  campId: 'campId',
  notes: 'notes',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.Role = exports.$Enums.Role = {
  CITIZEN: 'CITIZEN',
  VOLUNTEER: 'VOLUNTEER',
  ADMIN: 'ADMIN',
  DMC_OFFICER: 'DMC_OFFICER',
  FIELD_RESPONDER: 'FIELD_RESPONDER'
};

exports.Status = exports.$Enums.Status = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  EN_ROUTE: 'EN_ROUTE',
  ON_SITE: 'ON_SITE'
};

exports.Severity = exports.$Enums.Severity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

exports.AlertType = exports.$Enums.AlertType = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  EMERGENCY: 'EMERGENCY'
};

exports.TokenStatus = exports.$Enums.TokenStatus = {
  ACTIVE: 'ACTIVE',
  PARTIALLY_USED: 'PARTIALLY_USED',
  FULLY_USED: 'FULLY_USED',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED'
};

exports.TokenCategory = exports.$Enums.TokenCategory = {
  MEDICAL: 'MEDICAL',
  FOOD: 'FOOD',
  CLOTHING: 'CLOTHING',
  SHELTER: 'SHELTER',
  TRANSPORT: 'TRANSPORT',
  EDUCATION: 'EDUCATION',
  MENTAL_HEALTH: 'MENTAL_HEALTH'
};

exports.DamageCategory = exports.$Enums.DamageCategory = {
  RESIDENTIAL: 'RESIDENTIAL',
  AGRICULTURAL: 'AGRICULTURAL',
  INFRASTRUCTURE: 'INFRASTRUCTURE',
  COMMERCIAL: 'COMMERCIAL',
  UTILITY: 'UTILITY',
  OTHER: 'OTHER'
};

exports.DamageLevel = exports.$Enums.DamageLevel = {
  NONE: 'NONE',
  MINOR: 'MINOR',
  MODERATE: 'MODERATE',
  MAJOR: 'MAJOR',
  TOTAL_LOSS: 'TOTAL_LOSS'
};

exports.DamageStatus = exports.$Enums.DamageStatus = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  SENIOR_REVIEW: 'SENIOR_REVIEW',
  APPROVED: 'APPROVED'
};

exports.VerifierRole = exports.$Enums.VerifierRole = {
  GRAMA_NILADHARI: 'GRAMA_NILADHARI',
  VILLAGE_OFFICER: 'VILLAGE_OFFICER',
  COMMUNITY_LEADER: 'COMMUNITY_LEADER',
  NGO_OFFICER: 'NGO_OFFICER',
  LOCAL_AUTHORITY: 'LOCAL_AUTHORITY'
};

exports.VerificationResult = exports.$Enums.VerificationResult = {
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
  NEEDS_INVESTIGATION: 'NEEDS_INVESTIGATION'
};

exports.SupportType = exports.$Enums.SupportType = {
  COUNSELING: 'COUNSELING',
  CHILD_SUPPORT: 'CHILD_SUPPORT',
  TRAUMA_CARE: 'TRAUMA_CARE',
  GRIEF_SUPPORT: 'GRIEF_SUPPORT',
  GENERAL: 'GENERAL'
};

exports.SupportUrgency = exports.$Enums.SupportUrgency = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

exports.SupportStatus = exports.$Enums.SupportStatus = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
};

exports.InventoryItemType = exports.$Enums.InventoryItemType = {
  FOOD: 'FOOD',
  WATER: 'WATER',
  MEDICAL: 'MEDICAL',
  BLANKETS: 'BLANKETS',
  HYGIENE: 'HYGIENE'
};

exports.ReferralStatus = exports.$Enums.ReferralStatus = {
  PENDING: 'PENDING',
  IN_TRANSIT: 'IN_TRANSIT',
  ADMITTED: 'ADMITTED',
  DISCHARGED: 'DISCHARGED'
};

exports.DonationType = exports.$Enums.DonationType = {
  MONETARY: 'MONETARY',
  MATERIAL: 'MATERIAL'
};

exports.DonationStatus = exports.$Enums.DonationStatus = {
  PENDING: 'PENDING',
  RECEIVED: 'RECEIVED',
  ALLOCATED: 'ALLOCATED'
};

exports.SafetyStatus = exports.$Enums.SafetyStatus = {
  SAFE: 'SAFE',
  NEEDS_HELP: 'NEEDS_HELP',
  UNKNOWN: 'UNKNOWN',
  MISSING: 'MISSING',
  INJURED: 'INJURED',
  EVACUATED: 'EVACUATED',
  TRAPPED: 'TRAPPED',
  SHELTERED: 'SHELTERED'
};

exports.WaterRiskLevel = exports.$Enums.WaterRiskLevel = {
  NORMAL: 'NORMAL',
  WATCH: 'WATCH',
  WARNING: 'WARNING',
  DANGER: 'DANGER'
};

exports.RiverStatus = exports.$Enums.RiverStatus = {
  NORMAL: 'NORMAL',
  ALERT: 'ALERT',
  MINOR_FLOOD: 'MINOR_FLOOD',
  MAJOR_FLOOD: 'MAJOR_FLOOD'
};

exports.WaterTrend = exports.$Enums.WaterTrend = {
  RISING: 'RISING',
  FALLING: 'FALLING',
  STABLE: 'STABLE'
};

exports.VehicleType = exports.$Enums.VehicleType = {
  BUS: 'BUS',
  VAN: 'VAN',
  BOAT: 'BOAT',
  TRUCK: 'TRUCK',
  HELICOPTER: 'HELICOPTER',
  AMBULANCE: 'AMBULANCE'
};

exports.MissionStatus = exports.$Enums.MissionStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

exports.Prisma.ModelName = {
  User: 'User',
  IncidentReport: 'IncidentReport',
  Alert: 'Alert',
  Sector: 'Sector',
  ReliefCamp: 'ReliefCamp',
  Resource: 'Resource',
  Task: 'Task',
  VolunteerProfile: 'VolunteerProfile',
  HelpRequest: 'HelpRequest',
  HelpRequestEscalation: 'HelpRequestEscalation',
  ReportVerification: 'ReportVerification',
  MissingPerson: 'MissingPerson',
  Notification: 'Notification',
  MLLog: 'MLLog',
  IncidentHistory: 'IncidentHistory',
  ResourceRequestMatch: 'ResourceRequestMatch',
  CampSupplyRequest: 'CampSupplyRequest',
  AuditLog: 'AuditLog',
  LocationLog: 'LocationLog',
  ReliefToken: 'ReliefToken',
  ReliefTokenClaim: 'ReliefTokenClaim',
  DamageAssessment: 'DamageAssessment',
  LocalVerifier: 'LocalVerifier',
  VerifierAction: 'VerifierAction',
  PsychologicalSupportRequest: 'PsychologicalSupportRequest',
  ThreatForecast: 'ThreatForecast',
  ShiftHandover: 'ShiftHandover',
  EvacuationRoute: 'EvacuationRoute',
  VolunteerLocation: 'VolunteerLocation',
  ThreatProjection: 'ThreatProjection',
  AfterActionReport: 'AfterActionReport',
  KPIBenchmark: 'KPIBenchmark',
  ResourceCost: 'ResourceCost',
  DisasterBudget: 'DisasterBudget',
  ResourceExpenditure: 'ResourceExpenditure',
  RolePermission: 'RolePermission',
  UserSessionLog: 'UserSessionLog',
  CampResident: 'CampResident',
  CampInventory: 'CampInventory',
  CampSchedule: 'CampSchedule',
  HospitalReferral: 'HospitalReferral',
  CampTransferRequest: 'CampTransferRequest',
  DonorCampaign: 'DonorCampaign',
  VolunteerSkill: 'VolunteerSkill',
  VolunteerTraining: 'VolunteerTraining',
  VolunteerCheckIn: 'VolunteerCheckIn',
  VolunteerWellbeing: 'VolunteerWellbeing',
  VolunteerBadge: 'VolunteerBadge',
  ChatSession: 'ChatSession',
  ChatMessage: 'ChatMessage',
  GroupTherapySession: 'GroupTherapySession',
  Donation: 'Donation',
  SafetyCheckIn: 'SafetyCheckIn',
  FamilyMember: 'FamilyMember',
  GroupTherapyParticipant: 'GroupTherapyParticipant',
  MentalHealthGuide: 'MentalHealthGuide',
  RainfallReading: 'RainfallReading',
  RainfallAlertLog: 'RainfallAlertLog',
  RiverWaterLevel: 'RiverWaterLevel',
  DownstreamMapping: 'DownstreamMapping',
  IncidentDuplicateLink: 'IncidentDuplicateLink',
  PublicSafePlace: 'PublicSafePlace',
  AuthorityContact: 'AuthorityContact',
  RescueVehicle: 'RescueVehicle',
  RescueMission: 'RescueMission',
  SafeZoneCheckIn: 'SafeZoneCheckIn'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
