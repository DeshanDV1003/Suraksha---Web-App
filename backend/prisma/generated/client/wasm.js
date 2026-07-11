
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  skip,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime,
  createParam,
} = require('./runtime/wasm.js')


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

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

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
  profilePicture: 'profilePicture',
  role: 'role',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  region: 'region',
  nic: 'nic',
  twoFactorEnabled: 'twoFactorEnabled',
  twoFactorSecret: 'twoFactorSecret',
  twoFactorGracePeriodEnds: 'twoFactorGracePeriodEnds',
  hasMobileApp: 'hasMobileApp',
  lastCheckInTime: 'lastCheckInTime',
  isFieldActive: 'isFieldActive',
  currentSectorId: 'currentSectorId'
};

exports.Prisma.IncidentReportScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  location: 'location',
  latitude: 'latitude',
  longitude: 'longitude',
  zoneId: 'zoneId',
  zoneName: 'zoneName',
  province: 'province',
  status: 'status',
  severity: 'severity',
  mlConfidence: 'mlConfidence',
  category: 'category',
  images: 'images',
  reporterId: 'reporterId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AlertScalarFieldEnum = {
  id: 'id',
  title: 'title',
  message: 'message',
  locations: 'locations',
  latitudes: 'latitudes',
  longitudes: 'longitudes',
  type: 'type',
  active: 'active',
  channels: 'channels',
  scheduledTime: 'scheduledTime',
  translatedMsgSinhala: 'translatedMsgSinhala',
  translatedMsgTamil: 'translatedMsgTamil',
  acknowledgementRate: 'acknowledgementRate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  targetSectors: 'targetSectors'
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
  totalHours: 'totalHours',
  incidentsJoined: 'incidentsJoined',
  readinessScore: 'readinessScore',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HelpRequestScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  phone: 'phone',
  type: 'type',
  description: 'description',
  location: 'location',
  latitude: 'latitude',
  longitude: 'longitude',
  priority: 'priority',
  status: 'status',
  peopleCount: 'peopleCount',
  assignedVolunteerId: 'assignedVolunteerId',
  escalationLevel: 'escalationLevel',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
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
  nic: 'nic',
  age: 'age',
  gender: 'gender',
  description: 'description',
  lastSeen: 'lastSeen',
  photo: 'photo',
  reportedBy: 'reportedBy',
  contactName: 'contactName',
  contactPhone: 'contactPhone',
  status: 'status',
  isUnidentified: 'isUnidentified',
  reunificationStatus: 'reunificationStatus',
  reunificationNotes: 'reunificationNotes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  message: 'message',
  read: 'read',
  createdAt: 'createdAt'
};

exports.Prisma.MLLogScalarFieldEnum = {
  id: 'id',
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
  categories: 'categories',
  isHouseholdBundle: 'isHouseholdBundle',
  householdId: 'householdId',
  donorId: 'donorId',
  fraudRiskScore: 'fraudRiskScore',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
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
  polygonData: 'polygonData',
  category: 'category',
  structuralDamage: 'structuralDamage',
  cropDamage: 'cropDamage',
  utilityDamage: 'utilityDamage',
  roadDamage: 'roadDamage',
  affectedPersons: 'affectedPersons',
  estimatedLoss: 'estimatedLoss',
  aiEstimatedDamage: 'aiEstimatedDamage',
  aiEstimatedCost: 'aiEstimatedCost',
  propertyOwnershipStatus: 'propertyOwnershipStatus',
  familyVulnerabilityScore: 'familyVulnerabilityScore',
  incomeBracket: 'incomeBracket',
  compensationEligibilityScore: 'compensationEligibilityScore',
  compensationEligible: 'compensationEligible',
  mediaUrls: 'mediaUrls',
  status: 'status',
  notes: 'notes',
  reviewerNotes: 'reviewerNotes',
  verifiedById: 'verifiedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
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
  nextCheckInDate: 'nextCheckInDate',
  checkInStatus: 'checkInStatus',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
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
  status: 'status',
  notes: 'notes',
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
  EN_ROUTE: 'EN_ROUTE',
  ON_SITE: 'ON_SITE',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED'
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
  SENIOR_REVIEW: 'SENIOR_REVIEW',
  APPROVED: 'APPROVED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED'
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

exports.TokenCategory = exports.$Enums.TokenCategory = {
  MEDICAL: 'MEDICAL',
  FOOD: 'FOOD',
  CLOTHING: 'CLOTHING',
  SHELTER: 'SHELTER',
  TRANSPORT: 'TRANSPORT',
  EDUCATION: 'EDUCATION',
  MENTAL_HEALTH: 'MENTAL_HEALTH'
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
  RiverWaterLevel: 'RiverWaterLevel',
  DownstreamMapping: 'DownstreamMapping'
};
/**
 * Create the Client
 */
const config = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "D:\\Suraksha - Web App\\backend\\prisma\\generated\\client",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "windows",
        "native": true
      }
    ],
    "previewFeatures": [
      "driverAdapters"
    ],
    "sourceFilePath": "D:\\Suraksha - Web App\\backend\\prisma\\schema.prisma",
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": null,
    "schemaEnvPath": "../../../.env"
  },
  "relativePath": "../..",
  "clientVersion": "6.4.1",
  "engineVersion": "a9055b89e58b4b5bfb59600785423b1db3d0e75d",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "postgresql",
  "postinstall": false,
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "DATABASE_URL",
        "value": null
      }
    }
  },
  "inlineSchema": "generator client {\n  provider        = \"prisma-client-js\"\n  output          = \"./generated/client\"\n  previewFeatures = [\"driverAdapters\"]\n}\n\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")\n}\n\nmodel User {\n  id                       String                        @id @default(uuid())\n  email                    String                        @unique\n  password                 String\n  name                     String\n  phone                    String?\n  profilePicture           String?\n  role                     Role                          @default(CITIZEN)\n  createdAt                DateTime                      @default(now())\n  updatedAt                DateTime                      @updatedAt\n  region                   String?\n  nic                      String?                       @unique\n  twoFactorEnabled         Boolean                       @default(false)\n  twoFactorSecret          String?\n  twoFactorGracePeriodEnds DateTime?\n  hasMobileApp             Boolean                       @default(false)\n  lastCheckInTime          DateTime?\n  isFieldActive            Boolean                       @default(false)\n  damageReports            DamageAssessment[]            @relation(\"DamageReports\")\n  helpRequests             HelpRequest[]\n  reports                  IncidentReport[]\n  localVerifier            LocalVerifier?\n  locationLogs             LocationLog[]\n  notifications            Notification[]\n  supportRequests          PsychologicalSupportRequest[] @relation(\"SupportRequests\")\n  reliefTokens             ReliefToken[]                 @relation(\"ReliefTokens\")\n  verifications            ReportVerification[]\n  createdTasks             Task[]                        @relation(\"CreatedTasks\")\n  assignedTasks            Task[]                        @relation(\"AssignedTasks\")\n  volunteerProfile         VolunteerProfile?\n  sessionLogs              UserSessionLog[]\n  currentSectorId          String?\n  currentSector            Sector?                       @relation(fields: [currentSectorId], references: [id])\n  donations                Donation[]\n  safetyCheckIns           SafetyCheckIn[]\n  familyMembers            FamilyMember[]\n}\n\nmodel IncidentReport {\n  id                String               @id @default(uuid())\n  title             String\n  description       String\n  location          String\n  latitude          Float?\n  longitude         Float?\n  zoneId            String?\n  zoneName          String?\n  province          String?\n  status            Status               @default(PENDING)\n  severity          Severity             @default(MEDIUM)\n  mlConfidence      Float?\n  category          String\n  images            String[]\n  reporterId        String\n  createdAt         DateTime             @default(now())\n  updatedAt         DateTime             @updatedAt\n  damageAssessments DamageAssessment[]\n  history           IncidentHistory[]\n  reporter          User                 @relation(fields: [reporterId], references: [id])\n  verifications     ReportVerification[]\n  tasks             Task[]\n  verifierActions   VerifierAction[]\n  aar               AfterActionReport?\n}\n\nmodel Alert {\n  id                   String    @id @default(uuid())\n  title                String\n  message              String\n  locations            String[]\n  latitudes            Float[]\n  longitudes           Float[]\n  type                 AlertType @default(INFO)\n  active               Boolean   @default(true)\n  channels             Json?\n  scheduledTime        DateTime?\n  translatedMsgSinhala String?\n  translatedMsgTamil   String?\n  acknowledgementRate  Float?\n  createdAt            DateTime  @default(now())\n  updatedAt            DateTime  @updatedAt\n  targetSectors        String[]  @default([])\n}\n\nmodel Sector {\n  id          String  @id // Geohash string (e.g., 'tc0xw') or GN Division code\n  name        String? // Optional friendly name if GN Division\n  type        String  @default(\"GRID\") // \"GRID\" or \"ADMINISTRATIVE\"\n  polygonData Json? // The GeoJSON boundaries of this sector (mainly for GN Divisions)\n  district    String?\n  province    String?\n  users       User[] // Users currently in this sector\n}\n\nmodel ReliefCamp {\n  id               String                @id @default(uuid())\n  name             String\n  location         String\n  latitude         Float?\n  longitude        Float?\n  currentOccupancy Int                   @default(0)\n  totalCapacity    Int\n  services         String[]\n  status           String                @default(\"OPEN\")\n  waitTime         String?\n  createdAt        DateTime              @default(now())\n  updatedAt        DateTime              @updatedAt\n  residents        CampResident[]\n  inventory        CampInventory[]\n  schedules        CampSchedule[]\n  referrals        HospitalReferral[]\n  transfersOut     CampTransferRequest[] @relation(\"TransfersOut\")\n  transfersIn      CampTransferRequest[] @relation(\"TransfersIn\")\n  donations        Donation[]\n}\n\nmodel Resource {\n  id        String   @id @default(uuid())\n  type      String\n  owner     String\n  location  String\n  capacity  String\n  status    String   @default(\"AVAILABLE\")\n  contact   String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n\nmodel Task {\n  id           String          @id @default(uuid())\n  title        String\n  description  String\n  incidentId   String?\n  assignedToId String?\n  assignedById String?\n  priority     Severity        @default(MEDIUM)\n  status       Status          @default(PENDING)\n  dueDate      DateTime?\n  createdAt    DateTime        @default(now())\n  updatedAt    DateTime        @updatedAt\n  assignedBy   User?           @relation(\"CreatedTasks\", fields: [assignedById], references: [id])\n  assignedTo   User?           @relation(\"AssignedTasks\", fields: [assignedToId], references: [id])\n  incident     IncidentReport? @relation(fields: [incidentId], references: [id])\n}\n\nmodel VolunteerProfile {\n  id              String               @id @default(uuid())\n  userId          String               @unique\n  totalHours      Float                @default(0)\n  incidentsJoined Int                  @default(0)\n  readinessScore  Float                @default(100.0)\n  createdAt       DateTime             @default(now())\n  updatedAt       DateTime             @updatedAt\n  user            User                 @relation(fields: [userId], references: [id])\n  skills          VolunteerSkill[]\n  trainings       VolunteerTraining[]\n  checkIns        VolunteerCheckIn[]\n  wellbeingLogs   VolunteerWellbeing[]\n  badges          VolunteerBadge[]\n}\n\nmodel HelpRequest {\n  id                  String                  @id @default(uuid())\n  userId              String?\n  phone               String?\n  type                String\n  description         String\n  location            String\n  latitude            Float?\n  longitude           Float?\n  priority            Severity                @default(MEDIUM)\n  status              Status                  @default(PENDING)\n  peopleCount         Int?\n  assignedVolunteerId String?\n  escalationLevel     String                  @default(\"NONE\") // NONE, HIGH, CRITICAL\n  createdAt           DateTime                @default(now())\n  updatedAt           DateTime                @updatedAt\n  user                User?                   @relation(fields: [userId], references: [id])\n  verifierActions     VerifierAction[]\n  escalations         HelpRequestEscalation[]\n}\n\nmodel HelpRequestEscalation {\n  id            String      @id @default(uuid())\n  helpRequestId String\n  level         String // HIGH, CRITICAL\n  message       String\n  triggeredAt   DateTime    @default(now())\n  helpRequest   HelpRequest @relation(fields: [helpRequestId], references: [id])\n}\n\nmodel ReportVerification {\n  id        String         @id @default(uuid())\n  reportId  String\n  userId    String\n  status    String\n  comment   String?\n  createdAt DateTime       @default(now())\n  report    IncidentReport @relation(fields: [reportId], references: [id])\n  user      User           @relation(fields: [userId], references: [id])\n}\n\nmodel MissingPerson {\n  id                  String   @id @default(uuid())\n  name                String\n  nic                 String?\n  age                 Int?\n  gender              String?\n  description         String\n  lastSeen            String\n  photo               String?\n  reportedBy          String?\n  contactName         String?\n  contactPhone        String?\n  status              String   @default(\"MISSING\")\n  isUnidentified      Boolean  @default(false)\n  reunificationStatus String   @default(\"NONE\") // NONE, IN_PROGRESS, REUNITED\n  reunificationNotes  String?\n  createdAt           DateTime @default(now())\n  updatedAt           DateTime @updatedAt\n}\n\nmodel Notification {\n  id        String   @id @default(uuid())\n  userId    String\n  title     String\n  message   String\n  read      Boolean  @default(false)\n  createdAt DateTime @default(now())\n  user      User     @relation(fields: [userId], references: [id])\n}\n\nmodel MLLog {\n  id           String   @id @default(uuid())\n  inputData    Json\n  prediction   String\n  confidence   Float?\n  modelVersion String\n  createdAt    DateTime @default(now())\n}\n\nmodel IncidentHistory {\n  id         String         @id @default(uuid())\n  incidentId String\n  status     Status\n  updatedBy  String\n  note       String?\n  createdAt  DateTime       @default(now())\n  incident   IncidentReport @relation(fields: [incidentId], references: [id])\n}\n\nmodel ResourceRequestMatch {\n  id         String   @id @default(uuid())\n  requestId  String\n  resourceId String\n  matchScore Float\n  status     String\n  createdAt  DateTime @default(now())\n}\n\nmodel AuditLog {\n  id        String   @id @default(uuid())\n  userId    String?\n  action    String\n  entity    String\n  entityId  String\n  metadata  Json?\n  createdAt DateTime @default(now())\n}\n\nmodel LocationLog {\n  id        String   @id @default(uuid())\n  userId    String\n  latitude  Float\n  longitude Float\n  createdAt DateTime @default(now())\n  user      User     @relation(fields: [userId], references: [id])\n}\n\nmodel ReliefToken {\n  id                String             @id @default(uuid())\n  code              String             @unique\n  qrCodeData        String\n  userId            String\n  campId            String?\n  status            TokenStatus        @default(ACTIVE)\n  usageCount        Int                @default(0)\n  maxUsage          Int                @default(1)\n  issuedAt          DateTime           @default(now())\n  expiresAt         DateTime?\n  categories        TokenCategory[]\n  isHouseholdBundle Boolean            @default(false)\n  householdId       String?\n  donorId           String?\n  fraudRiskScore    Float              @default(0.0)\n  createdAt         DateTime           @default(now())\n  updatedAt         DateTime           @updatedAt\n  user              User               @relation(\"ReliefTokens\", fields: [userId], references: [id])\n  claims            ReliefTokenClaim[]\n  donor             DonorCampaign?     @relation(fields: [donorId], references: [id])\n}\n\nmodel ReliefTokenClaim {\n  id          String      @id @default(uuid())\n  tokenId     String\n  claimedAt   DateTime    @default(now())\n  claimedBy   String\n  itemType    String\n  quantity    Int\n  proofImage  String?\n  campId      String?\n  notes       String?\n  locationLat Float?\n  locationLng Float?\n  token       ReliefToken @relation(fields: [tokenId], references: [id])\n}\n\nmodel DamageAssessment {\n  id               String         @id @default(uuid())\n  reportedById     String\n  incidentId       String?\n  location         String\n  latitude         Float?\n  longitude        Float?\n  polygonData      Json?\n  category         DamageCategory\n  structuralDamage DamageLevel    @default(NONE)\n  cropDamage       DamageLevel    @default(NONE)\n  utilityDamage    DamageLevel    @default(NONE)\n  roadDamage       DamageLevel    @default(NONE)\n  affectedPersons  Int?\n  estimatedLoss    Float?\n\n  // AI Assistance\n  aiEstimatedDamage String?\n  aiEstimatedCost   Float?\n\n  // Compensation\n  propertyOwnershipStatus      String? // Owned, Rented, Squatter\n  familyVulnerabilityScore     Int? // 1-10\n  incomeBracket                String?\n  compensationEligibilityScore Float?\n  compensationEligible         Boolean @default(false)\n\n  mediaUrls     String[]\n  status        DamageStatus    @default(PENDING_REVIEW)\n  notes         String?\n  reviewerNotes String?\n  verifiedById  String?\n  createdAt     DateTime        @default(now())\n  updatedAt     DateTime        @updatedAt\n  incident      IncidentReport? @relation(fields: [incidentId], references: [id])\n  reportedBy    User            @relation(\"DamageReports\", fields: [reportedById], references: [id])\n}\n\nmodel LocalVerifier {\n  id                 String           @id @default(uuid())\n  userId             String           @unique\n  verifierRole       VerifierRole\n  jurisdiction       String\n  orgName            String?\n  isApproved         Boolean          @default(false)\n  approvedAt         DateTime?\n  approvedById       String?\n  verificationsCount Int              @default(0)\n  createdAt          DateTime         @default(now())\n  updatedAt          DateTime         @updatedAt\n  user               User             @relation(fields: [userId], references: [id])\n  actions            VerifierAction[]\n}\n\nmodel VerifierAction {\n  id            String             @id @default(uuid())\n  verifierId    String\n  incidentId    String?\n  helpRequestId String?\n  result        VerificationResult\n  comment       String?\n  createdAt     DateTime           @default(now())\n  helpRequest   HelpRequest?       @relation(fields: [helpRequestId], references: [id])\n  incident      IncidentReport?    @relation(fields: [incidentId], references: [id])\n  verifier      LocalVerifier      @relation(fields: [verifierId], references: [id])\n}\n\nmodel PsychologicalSupportRequest {\n  id              String         @id @default(uuid())\n  userId          String\n  type            SupportType    @default(GENERAL)\n  description     String?\n  urgency         SupportUrgency @default(MEDIUM)\n  status          SupportStatus  @default(PENDING)\n  anonymous       Boolean        @default(false)\n  location        String?\n  affectedCount   Int?\n  assignedToId    String?\n  notes           String?\n  nextCheckInDate DateTime?\n  checkInStatus   String?        @default(\"PENDING\") // PENDING, COMPLETED, OVERDUE, ESCALATED\n  createdAt       DateTime       @default(now())\n  updatedAt       DateTime       @updatedAt\n  user            User           @relation(\"SupportRequests\", fields: [userId], references: [id])\n}\n\nenum Role {\n  CITIZEN\n  VOLUNTEER\n  ADMIN\n  DMC_OFFICER\n  FIELD_RESPONDER\n}\n\nenum Status {\n  PENDING\n  ASSIGNED\n  EN_ROUTE\n  ON_SITE\n  IN_PROGRESS\n  RESOLVED\n}\n\nenum Severity {\n  LOW\n  MEDIUM\n  HIGH\n  CRITICAL\n}\n\nenum AlertType {\n  INFO\n  WARNING\n  EMERGENCY\n}\n\nenum TokenStatus {\n  ACTIVE\n  PARTIALLY_USED\n  FULLY_USED\n  EXPIRED\n  REVOKED\n}\n\nenum DamageCategory {\n  RESIDENTIAL\n  AGRICULTURAL\n  INFRASTRUCTURE\n  COMMERCIAL\n  UTILITY\n  OTHER\n}\n\nenum DamageLevel {\n  NONE\n  MINOR\n  MODERATE\n  MAJOR\n  TOTAL_LOSS\n}\n\nenum DamageStatus {\n  PENDING_REVIEW\n  SENIOR_REVIEW\n  APPROVED\n  VERIFIED\n  REJECTED\n}\n\nenum VerifierRole {\n  GRAMA_NILADHARI\n  VILLAGE_OFFICER\n  COMMUNITY_LEADER\n  NGO_OFFICER\n  LOCAL_AUTHORITY\n}\n\nenum VerificationResult {\n  CONFIRMED\n  REJECTED\n  NEEDS_INVESTIGATION\n}\n\nenum SupportType {\n  COUNSELING\n  CHILD_SUPPORT\n  TRAUMA_CARE\n  GRIEF_SUPPORT\n  GENERAL\n}\n\nenum SupportUrgency {\n  LOW\n  MEDIUM\n  HIGH\n  CRITICAL\n}\n\nenum SupportStatus {\n  PENDING\n  ASSIGNED\n  IN_PROGRESS\n  RESOLVED\n  CLOSED\n}\n\nenum InventoryItemType {\n  FOOD\n  WATER\n  MEDICAL\n  BLANKETS\n  HYGIENE\n}\n\nenum ReferralStatus {\n  PENDING\n  IN_TRANSIT\n  ADMITTED\n  DISCHARGED\n}\n\nenum TokenCategory {\n  MEDICAL\n  FOOD\n  CLOTHING\n  SHELTER\n  TRANSPORT\n  EDUCATION\n  MENTAL_HEALTH\n}\n\nmodel ThreatForecast {\n  id           String   @id @default(uuid())\n  district     String\n  threatType   String\n  confidence   Float\n  severity     Severity @default(MEDIUM)\n  forecastTime DateTime\n  createdAt    DateTime @default(now())\n}\n\nmodel ShiftHandover {\n  id                String   @id @default(uuid())\n  shiftTime         DateTime\n  incidentsOpened   Int      @default(0)\n  incidentsClosed   Int      @default(0)\n  resourcesDeployed Int      @default(0)\n  volunteersActive  Int      @default(0)\n  criticalItems     String?\n  createdAt         DateTime @default(now())\n}\n\nmodel EvacuationRoute {\n  id          String   @id @default(uuid())\n  name        String\n  type        String\n  coordinates Json\n  status      String   @default(\"ACTIVE\")\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n}\n\nmodel VolunteerLocation {\n  id          String   @id @default(uuid())\n  volunteerId String\n  latitude    Float\n  longitude   Float\n  status      String   @default(\"ACTIVE\")\n  skill       String?\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n}\n\nmodel ThreatProjection {\n  id            String   @id @default(uuid())\n  name          String\n  type          String\n  polygonCoords Json\n  riskLevel     Severity @default(HIGH)\n  active        Boolean  @default(true)\n  createdAt     DateTime @default(now())\n  updatedAt     DateTime @updatedAt\n}\n\nmodel AfterActionReport {\n  id             String         @id @default(uuid())\n  incidentId     String         @unique\n  timeline       Json\n  resourcesUsed  Json\n  costEstimate   Float\n  peopleAffected Int\n  resolutionTime Int\n  lessonsLearned String?\n  createdAt      DateTime       @default(now())\n  incident       IncidentReport @relation(fields: [incidentId], references: [id])\n}\n\nmodel KPIBenchmark {\n  id                String   @id @default(uuid())\n  month             String\n  targetAvgResponse Int\n  targetOccupancy   Float\n  targetVolunteer   Float\n  createdAt         DateTime @default(now())\n}\n\nmodel ResourceCost {\n  id           String                @id @default(uuid())\n  resourceType String                @unique\n  unitCost     Float\n  unitType     String\n  createdAt    DateTime              @default(now())\n  updatedAt    DateTime              @updatedAt\n  expenditures ResourceExpenditure[]\n}\n\nmodel DisasterBudget {\n  id              String                @id @default(uuid())\n  eventName       String\n  allocatedBudget Float\n  createdAt       DateTime              @default(now())\n  updatedAt       DateTime              @updatedAt\n  expenditures    ResourceExpenditure[]\n}\n\nmodel ResourceExpenditure {\n  id             String         @id @default(uuid())\n  resourceCostId String\n  quantity       Float\n  totalCost      Float\n  budgetId       String\n  createdAt      DateTime       @default(now())\n  resourceCost   ResourceCost   @relation(fields: [resourceCostId], references: [id])\n  budget         DisasterBudget @relation(fields: [budgetId], references: [id])\n}\n\nmodel RolePermission {\n  id        String   @id @default(uuid())\n  role      Role\n  module    String\n  canView   Boolean  @default(false)\n  canEdit   Boolean  @default(false)\n  canDelete Boolean  @default(false)\n  updatedAt DateTime @updatedAt\n  updatedBy String?\n}\n\nmodel UserSessionLog {\n  id        String   @id @default(uuid())\n  userId    String\n  ipAddress String?\n  device    String?\n  location  String?\n  loginTime DateTime @default(now())\n  user      User     @relation(fields: [userId], references: [id])\n}\n\nmodel CampResident {\n  id           String     @id @default(uuid())\n  campId       String\n  name         String\n  nic          String?\n  familySize   Int        @default(1)\n  checkInTime  DateTime   @default(now())\n  checkOutTime DateTime?\n  status       String     @default(\"ACTIVE\") // ACTIVE, CHECKED_OUT\n  camp         ReliefCamp @relation(fields: [campId], references: [id])\n}\n\nmodel CampInventory {\n  id          String            @id @default(uuid())\n  campId      String\n  itemType    InventoryItemType\n  quantity    Int\n  threshold   Int\n  lastUpdated DateTime          @default(now())\n  camp        ReliefCamp        @relation(fields: [campId], references: [id])\n}\n\nmodel CampSchedule {\n  id           String     @id @default(uuid())\n  campId       String\n  activityName String\n  startTime    String\n  endTime      String\n  type         String // MEAL, MEDICAL, COUNSELING, ACTIVITY\n  camp         ReliefCamp @relation(fields: [campId], references: [id])\n}\n\nmodel HospitalReferral {\n  id                String         @id @default(uuid())\n  campId            String\n  patientName       String\n  conditionSeverity Severity       @default(MEDIUM)\n  hospitalAssigned  String\n  transportMethod   String?\n  outcome           String?\n  status            ReferralStatus @default(PENDING)\n  createdAt         DateTime       @default(now())\n  camp              ReliefCamp     @relation(fields: [campId], references: [id])\n}\n\nmodel CampTransferRequest {\n  id          String     @id @default(uuid())\n  fromCampId  String\n  toCampId    String\n  peopleCount Int\n  status      String     @default(\"PENDING\") // PENDING, APPROVED, REJECTED, SUGGESTED\n  requestDate DateTime   @default(now())\n  fromCamp    ReliefCamp @relation(\"TransfersOut\", fields: [fromCampId], references: [id])\n  toCamp      ReliefCamp @relation(\"TransfersIn\", fields: [toCampId], references: [id])\n}\n\nmodel DonorCampaign {\n  id                 String          @id @default(uuid())\n  donorName          String\n  contributionAmount Float\n  targetCategories   TokenCategory[]\n  createdAt          DateTime        @default(now())\n  updatedAt          DateTime        @updatedAt\n  tokens             ReliefToken[]\n}\n\nmodel VolunteerSkill {\n  id               String           @id @default(uuid())\n  volunteerId      String\n  skillName        String // e.g. First Aid, Medical, Boat Operation\n  certificationUrl String?\n  volunteer        VolunteerProfile @relation(fields: [volunteerId], references: [id])\n}\n\nmodel VolunteerTraining {\n  id           String           @id @default(uuid())\n  volunteerId  String\n  trainingName String\n  completedAt  DateTime\n  expiresAt    DateTime?\n  volunteer    VolunteerProfile @relation(fields: [volunteerId], references: [id])\n}\n\nmodel VolunteerCheckIn {\n  id           String           @id @default(uuid())\n  volunteerId  String\n  checkInTime  DateTime         @default(now())\n  checkOutTime DateTime?\n  latitude     Float\n  longitude    Float\n  zone         String?\n  activeHours  Float            @default(0)\n  volunteer    VolunteerProfile @relation(fields: [volunteerId], references: [id])\n}\n\nmodel VolunteerWellbeing {\n  id             String           @id @default(uuid())\n  volunteerId    String\n  recordedAt     DateTime         @default(now())\n  physicalRating Int // 1-5\n  mentalRating   Int // 1-5\n  needsResources Boolean          @default(false)\n  distressFlag   Boolean          @default(false)\n  volunteer      VolunteerProfile @relation(fields: [volunteerId], references: [id])\n}\n\nmodel VolunteerBadge {\n  id          String           @id @default(uuid())\n  volunteerId String\n  badgeType   String // e.g. 50_HOURS, 3_INCIDENTS, CERTIFIED\n  earnedAt    DateTime         @default(now())\n  volunteer   VolunteerProfile @relation(fields: [volunteerId], references: [id])\n}\n\nmodel ChatSession {\n  id          String        @id @default(uuid())\n  requestId   String\n  counselorId String?\n  userId      String        @default(\"anonymous\")\n  status      String        @default(\"WAITING\") // WAITING, ACTIVE, COMPLETED\n  startedAt   DateTime      @default(now())\n  endedAt     DateTime?\n  moodAfter   String?\n  messages    ChatMessage[]\n}\n\nmodel ChatMessage {\n  id        String      @id @default(uuid())\n  sessionId String\n  session   ChatSession @relation(fields: [sessionId], references: [id])\n  senderId  String\n  content   String\n  createdAt DateTime    @default(now())\n}\n\nmodel GroupTherapySession {\n  id              String                    @id @default(uuid())\n  title           String\n  description     String\n  campId          String?\n  counselorId     String\n  scheduledFor    DateTime\n  maxParticipants Int                       @default(20)\n  status          String                    @default(\"SCHEDULED\")\n  participants    GroupTherapyParticipant[]\n}\n\nmodel Donation {\n  id               String         @id @default(uuid())\n  donorId          String?\n  donorName        String\n  type             DonationType\n  amount           Float?\n  itemsDescription String?\n  transactionId    String? // For tracking payment gateway transactions\n  paymentGateway   String? // e.g., 'STRIPE', 'PAYPAL', 'SURAKSHA_PAY'\n  transactionDate  DateTime?\n  status           DonationStatus @default(PENDING)\n  campId           String?\n  createdAt        DateTime       @default(now())\n  updatedAt        DateTime       @updatedAt\n  donor            User?          @relation(fields: [donorId], references: [id])\n  camp             ReliefCamp?    @relation(fields: [campId], references: [id])\n}\n\nenum DonationType {\n  MONETARY\n  MATERIAL\n}\n\nenum DonationStatus {\n  PENDING\n  RECEIVED\n  ALLOCATED\n}\n\nmodel SafetyCheckIn {\n  id        String       @id @default(uuid())\n  userId    String\n  status    SafetyStatus\n  message   String?\n  latitude  Float?\n  longitude Float?\n  createdAt DateTime     @default(now())\n  user      User         @relation(fields: [userId], references: [id])\n}\n\nmodel FamilyMember {\n  id            String       @id @default(uuid())\n  primaryUserId String\n  name          String\n  relation      String\n  status        SafetyStatus\n  notes         String?\n  createdAt     DateTime     @default(now())\n  updatedAt     DateTime     @updatedAt\n  primaryUser   User         @relation(fields: [primaryUserId], references: [id])\n}\n\nenum SafetyStatus {\n  SAFE\n  NEEDS_HELP\n  UNKNOWN\n  INJURED\n  EVACUATED\n  TRAPPED\n  SHELTERED\n}\n\nmodel GroupTherapyParticipant {\n  id               String              @id @default(uuid())\n  sessionId        String\n  session          GroupTherapySession @relation(fields: [sessionId], references: [id])\n  userId           String\n  attendanceStatus String              @default(\"REGISTERED\")\n  notes            String?\n}\n\nmodel MentalHealthGuide {\n  id                 String   @id @default(uuid())\n  title              String\n  content            String\n  tags               String\n  isOfflineAvailable Boolean  @default(true)\n  createdAt          DateTime @default(now())\n}\n\n// --- Water Monitoring Module ---\n\nenum WaterRiskLevel {\n  NORMAL\n  WATCH\n  WARNING\n  DANGER\n}\n\nenum RiverStatus {\n  NORMAL\n  ALERT\n  MINOR_FLOOD\n  MAJOR_FLOOD\n}\n\nenum WaterTrend {\n  RISING\n  FALLING\n  STABLE\n}\n\nmodel RainfallReading {\n  id                String         @id @default(uuid())\n  stationId         String\n  stationName       String\n  district          String\n  province          String\n  latitude          Float\n  longitude         Float\n  rainfallMmPerHour Float\n  cumulativeRain24h Float\n  cumulativeRain72h Float\n  riskLevel         WaterRiskLevel\n  recordedAt        DateTime\n  fetchedAt         DateTime\n  source            String\n}\n\nmodel RiverWaterLevel {\n  id                 String      @id @default(uuid())\n  gaugeId            String\n  riverName          String\n  stationName        String\n  district           String\n  latitude           Float\n  longitude          Float\n  waterLevelMetres   Float\n  flowRateCumecs     Float\n  alertLevel         Float\n  minorFloodLevel    Float\n  majorFloodLevel    Float\n  status             RiverStatus\n  changeFromLastHour Float\n  trend              WaterTrend\n  recordedAt         DateTime\n  fetchedAt          DateTime\n  source             String\n}\n\nmodel DownstreamMapping {\n  id              String   @id @default(uuid())\n  gaugeId         String   @unique\n  riverName       String\n  stationName     String\n  targetDistricts String[] // Array of district names to alert\n  createdAt       DateTime @default(now())\n  updatedAt       DateTime @updatedAt\n}\n",
  "inlineSchemaHash": "c156c6f0c5c1a66445299e02da2c8f811103b27ea0d9ffbeefcc7184981e1be1",
  "copyEngine": true
}
config.dirname = '/'

config.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"password\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"phone\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"profilePicture\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"role\",\"kind\":\"enum\",\"type\":\"Role\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"region\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"nic\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"twoFactorEnabled\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"twoFactorSecret\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"twoFactorGracePeriodEnds\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"hasMobileApp\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"lastCheckInTime\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"isFieldActive\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"damageReports\",\"kind\":\"object\",\"type\":\"DamageAssessment\",\"relationName\":\"DamageReports\"},{\"name\":\"helpRequests\",\"kind\":\"object\",\"type\":\"HelpRequest\",\"relationName\":\"HelpRequestToUser\"},{\"name\":\"reports\",\"kind\":\"object\",\"type\":\"IncidentReport\",\"relationName\":\"IncidentReportToUser\"},{\"name\":\"localVerifier\",\"kind\":\"object\",\"type\":\"LocalVerifier\",\"relationName\":\"LocalVerifierToUser\"},{\"name\":\"locationLogs\",\"kind\":\"object\",\"type\":\"LocationLog\",\"relationName\":\"LocationLogToUser\"},{\"name\":\"notifications\",\"kind\":\"object\",\"type\":\"Notification\",\"relationName\":\"NotificationToUser\"},{\"name\":\"supportRequests\",\"kind\":\"object\",\"type\":\"PsychologicalSupportRequest\",\"relationName\":\"SupportRequests\"},{\"name\":\"reliefTokens\",\"kind\":\"object\",\"type\":\"ReliefToken\",\"relationName\":\"ReliefTokens\"},{\"name\":\"verifications\",\"kind\":\"object\",\"type\":\"ReportVerification\",\"relationName\":\"ReportVerificationToUser\"},{\"name\":\"createdTasks\",\"kind\":\"object\",\"type\":\"Task\",\"relationName\":\"CreatedTasks\"},{\"name\":\"assignedTasks\",\"kind\":\"object\",\"type\":\"Task\",\"relationName\":\"AssignedTasks\"},{\"name\":\"volunteerProfile\",\"kind\":\"object\",\"type\":\"VolunteerProfile\",\"relationName\":\"UserToVolunteerProfile\"},{\"name\":\"sessionLogs\",\"kind\":\"object\",\"type\":\"UserSessionLog\",\"relationName\":\"UserToUserSessionLog\"},{\"name\":\"currentSectorId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"currentSector\",\"kind\":\"object\",\"type\":\"Sector\",\"relationName\":\"SectorToUser\"},{\"name\":\"donations\",\"kind\":\"object\",\"type\":\"Donation\",\"relationName\":\"DonationToUser\"},{\"name\":\"safetyCheckIns\",\"kind\":\"object\",\"type\":\"SafetyCheckIn\",\"relationName\":\"SafetyCheckInToUser\"},{\"name\":\"familyMembers\",\"kind\":\"object\",\"type\":\"FamilyMember\",\"relationName\":\"FamilyMemberToUser\"}],\"dbName\":null},\"IncidentReport\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"location\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"latitude\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"longitude\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"zoneId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"zoneName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"province\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"Status\"},{\"name\":\"severity\",\"kind\":\"enum\",\"type\":\"Severity\"},{\"name\":\"mlConfidence\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"category\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"images\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"reporterId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"damageAssessments\",\"kind\":\"object\",\"type\":\"DamageAssessment\",\"relationName\":\"DamageAssessmentToIncidentReport\"},{\"name\":\"history\",\"kind\":\"object\",\"type\":\"IncidentHistory\",\"relationName\":\"IncidentHistoryToIncidentReport\"},{\"name\":\"reporter\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"IncidentReportToUser\"},{\"name\":\"verifications\",\"kind\":\"object\",\"type\":\"ReportVerification\",\"relationName\":\"IncidentReportToReportVerification\"},{\"name\":\"tasks\",\"kind\":\"object\",\"type\":\"Task\",\"relationName\":\"IncidentReportToTask\"},{\"name\":\"verifierActions\",\"kind\":\"object\",\"type\":\"VerifierAction\",\"relationName\":\"IncidentReportToVerifierAction\"},{\"name\":\"aar\",\"kind\":\"object\",\"type\":\"AfterActionReport\",\"relationName\":\"AfterActionReportToIncidentReport\"}],\"dbName\":null},\"Alert\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"message\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"locations\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"latitudes\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"longitudes\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"type\",\"kind\":\"enum\",\"type\":\"AlertType\"},{\"name\":\"active\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"channels\",\"kind\":\"scalar\",\"type\":\"Json\"},{\"name\":\"scheduledTime\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"translatedMsgSinhala\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"translatedMsgTamil\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"acknowledgementRate\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"targetSectors\",\"kind\":\"scalar\",\"type\":\"String\"}],\"dbName\":null},\"Sector\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"type\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"polygonData\",\"kind\":\"scalar\",\"type\":\"Json\"},{\"name\":\"district\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"province\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"users\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"SectorToUser\"}],\"dbName\":null},\"ReliefCamp\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"location\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"latitude\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"longitude\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"currentOccupancy\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"totalCapacity\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"services\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"status\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"waitTime\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"residents\",\"kind\":\"object\",\"type\":\"CampResident\",\"relationName\":\"CampResidentToReliefCamp\"},{\"name\":\"inventory\",\"kind\":\"object\",\"type\":\"CampInventory\",\"relationName\":\"CampInventoryToReliefCamp\"},{\"name\":\"schedules\",\"kind\":\"object\",\"type\":\"CampSchedule\",\"relationName\":\"CampScheduleToReliefCamp\"},{\"name\":\"referrals\",\"kind\":\"object\",\"type\":\"HospitalReferral\",\"relationName\":\"HospitalReferralToReliefCamp\"},{\"name\":\"transfersOut\",\"kind\":\"object\",\"type\":\"CampTransferRequest\",\"relationName\":\"TransfersOut\"},{\"name\":\"transfersIn\",\"kind\":\"object\",\"type\":\"CampTransferRequest\",\"relationName\":\"TransfersIn\"},{\"name\":\"donations\",\"kind\":\"object\",\"type\":\"Donation\",\"relationName\":\"DonationToReliefCamp\"}],\"dbName\":null},\"Resource\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"type\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"owner\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"location\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"capacity\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"status\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"contact\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"Task\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"incidentId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"assignedToId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"assignedById\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"priority\",\"kind\":\"enum\",\"type\":\"Severity\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"Status\"},{\"name\":\"dueDate\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"assignedBy\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"CreatedTasks\"},{\"name\":\"assignedTo\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"AssignedTasks\"},{\"name\":\"incident\",\"kind\":\"object\",\"type\":\"IncidentReport\",\"relationName\":\"IncidentReportToTask\"}],\"dbName\":null},\"VolunteerProfile\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"totalHours\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"incidentsJoined\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"readinessScore\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"UserToVolunteerProfile\"},{\"name\":\"skills\",\"kind\":\"object\",\"type\":\"VolunteerSkill\",\"relationName\":\"VolunteerProfileToVolunteerSkill\"},{\"name\":\"trainings\",\"kind\":\"object\",\"type\":\"VolunteerTraining\",\"relationName\":\"VolunteerProfileToVolunteerTraining\"},{\"name\":\"checkIns\",\"kind\":\"object\",\"type\":\"VolunteerCheckIn\",\"relationName\":\"VolunteerCheckInToVolunteerProfile\"},{\"name\":\"wellbeingLogs\",\"kind\":\"object\",\"type\":\"VolunteerWellbeing\",\"relationName\":\"VolunteerProfileToVolunteerWellbeing\"},{\"name\":\"badges\",\"kind\":\"object\",\"type\":\"VolunteerBadge\",\"relationName\":\"VolunteerBadgeToVolunteerProfile\"}],\"dbName\":null},\"HelpRequest\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"phone\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"type\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"location\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"latitude\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"longitude\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"priority\",\"kind\":\"enum\",\"type\":\"Severity\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"Status\"},{\"name\":\"peopleCount\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"assignedVolunteerId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"escalationLevel\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"HelpRequestToUser\"},{\"name\":\"verifierActions\",\"kind\":\"object\",\"type\":\"VerifierAction\",\"relationName\":\"HelpRequestToVerifierAction\"},{\"name\":\"escalations\",\"kind\":\"object\",\"type\":\"HelpRequestEscalation\",\"relationName\":\"HelpRequestToHelpRequestEscalation\"}],\"dbName\":null},\"HelpRequestEscalation\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"helpRequestId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"level\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"message\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"triggeredAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"helpRequest\",\"kind\":\"object\",\"type\":\"HelpRequest\",\"relationName\":\"HelpRequestToHelpRequestEscalation\"}],\"dbName\":null},\"ReportVerification\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"reportId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"status\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"comment\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"report\",\"kind\":\"object\",\"type\":\"IncidentReport\",\"relationName\":\"IncidentReportToReportVerification\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"ReportVerificationToUser\"}],\"dbName\":null},\"MissingPerson\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"nic\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"age\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"gender\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"lastSeen\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"photo\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"reportedBy\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"contactName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"contactPhone\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"status\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"isUnidentified\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"reunificationStatus\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"reunificationNotes\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"Notification\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"message\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"read\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"NotificationToUser\"}],\"dbName\":null},\"MLLog\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"inputData\",\"kind\":\"scalar\",\"type\":\"Json\"},{\"name\":\"prediction\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"confidence\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"modelVersion\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"IncidentHistory\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"incidentId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"Status\"},{\"name\":\"updatedBy\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"note\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"incident\",\"kind\":\"object\",\"type\":\"IncidentReport\",\"relationName\":\"IncidentHistoryToIncidentReport\"}],\"dbName\":null},\"ResourceRequestMatch\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"requestId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"resourceId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"matchScore\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"status\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"AuditLog\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"action\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"entity\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"entityId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"metadata\",\"kind\":\"scalar\",\"type\":\"Json\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"LocationLog\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"latitude\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"longitude\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"LocationLogToUser\"}],\"dbName\":null},\"ReliefToken\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"code\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"qrCodeData\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"campId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"TokenStatus\"},{\"name\":\"usageCount\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"maxUsage\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"issuedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"expiresAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"categories\",\"kind\":\"enum\",\"type\":\"TokenCategory\"},{\"name\":\"isHouseholdBundle\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"householdId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"donorId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"fraudRiskScore\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"ReliefTokens\"},{\"name\":\"claims\",\"kind\":\"object\",\"type\":\"ReliefTokenClaim\",\"relationName\":\"ReliefTokenToReliefTokenClaim\"},{\"name\":\"donor\",\"kind\":\"object\",\"type\":\"DonorCampaign\",\"relationName\":\"DonorCampaignToReliefToken\"}],\"dbName\":null},\"ReliefTokenClaim\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"tokenId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"claimedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"claimedBy\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"itemType\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"quantity\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"proofImage\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"campId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"notes\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"locationLat\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"locationLng\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"token\",\"kind\":\"object\",\"type\":\"ReliefToken\",\"relationName\":\"ReliefTokenToReliefTokenClaim\"}],\"dbName\":null},\"DamageAssessment\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"reportedById\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"incidentId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"location\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"latitude\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"longitude\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"polygonData\",\"kind\":\"scalar\",\"type\":\"Json\"},{\"name\":\"category\",\"kind\":\"enum\",\"type\":\"DamageCategory\"},{\"name\":\"structuralDamage\",\"kind\":\"enum\",\"type\":\"DamageLevel\"},{\"name\":\"cropDamage\",\"kind\":\"enum\",\"type\":\"DamageLevel\"},{\"name\":\"utilityDamage\",\"kind\":\"enum\",\"type\":\"DamageLevel\"},{\"name\":\"roadDamage\",\"kind\":\"enum\",\"type\":\"DamageLevel\"},{\"name\":\"affectedPersons\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"estimatedLoss\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"aiEstimatedDamage\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"aiEstimatedCost\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"propertyOwnershipStatus\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"familyVulnerabilityScore\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"incomeBracket\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"compensationEligibilityScore\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"compensationEligible\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"mediaUrls\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"DamageStatus\"},{\"name\":\"notes\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"reviewerNotes\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"verifiedById\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"incident\",\"kind\":\"object\",\"type\":\"IncidentReport\",\"relationName\":\"DamageAssessmentToIncidentReport\"},{\"name\":\"reportedBy\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"DamageReports\"}],\"dbName\":null},\"LocalVerifier\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"verifierRole\",\"kind\":\"enum\",\"type\":\"VerifierRole\"},{\"name\":\"jurisdiction\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"orgName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"isApproved\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"approvedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"approvedById\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"verificationsCount\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"LocalVerifierToUser\"},{\"name\":\"actions\",\"kind\":\"object\",\"type\":\"VerifierAction\",\"relationName\":\"LocalVerifierToVerifierAction\"}],\"dbName\":null},\"VerifierAction\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"verifierId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"incidentId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"helpRequestId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"result\",\"kind\":\"enum\",\"type\":\"VerificationResult\"},{\"name\":\"comment\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"helpRequest\",\"kind\":\"object\",\"type\":\"HelpRequest\",\"relationName\":\"HelpRequestToVerifierAction\"},{\"name\":\"incident\",\"kind\":\"object\",\"type\":\"IncidentReport\",\"relationName\":\"IncidentReportToVerifierAction\"},{\"name\":\"verifier\",\"kind\":\"object\",\"type\":\"LocalVerifier\",\"relationName\":\"LocalVerifierToVerifierAction\"}],\"dbName\":null},\"PsychologicalSupportRequest\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"type\",\"kind\":\"enum\",\"type\":\"SupportType\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"urgency\",\"kind\":\"enum\",\"type\":\"SupportUrgency\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"SupportStatus\"},{\"name\":\"anonymous\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"location\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"affectedCount\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"assignedToId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"notes\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"nextCheckInDate\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"checkInStatus\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"SupportRequests\"}],\"dbName\":null},\"ThreatForecast\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"district\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"threatType\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"confidence\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"severity\",\"kind\":\"enum\",\"type\":\"Severity\"},{\"name\":\"forecastTime\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"ShiftHandover\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"shiftTime\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"incidentsOpened\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"incidentsClosed\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"resourcesDeployed\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"volunteersActive\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"criticalItems\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"EvacuationRoute\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"type\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"coordinates\",\"kind\":\"scalar\",\"type\":\"Json\"},{\"name\":\"status\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"VolunteerLocation\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"volunteerId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"latitude\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"longitude\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"status\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"skill\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"ThreatProjection\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"type\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"polygonCoords\",\"kind\":\"scalar\",\"type\":\"Json\"},{\"name\":\"riskLevel\",\"kind\":\"enum\",\"type\":\"Severity\"},{\"name\":\"active\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"AfterActionReport\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"incidentId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"timeline\",\"kind\":\"scalar\",\"type\":\"Json\"},{\"name\":\"resourcesUsed\",\"kind\":\"scalar\",\"type\":\"Json\"},{\"name\":\"costEstimate\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"peopleAffected\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"resolutionTime\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"lessonsLearned\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"incident\",\"kind\":\"object\",\"type\":\"IncidentReport\",\"relationName\":\"AfterActionReportToIncidentReport\"}],\"dbName\":null},\"KPIBenchmark\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"month\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"targetAvgResponse\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"targetOccupancy\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"targetVolunteer\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"ResourceCost\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"resourceType\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"unitCost\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"unitType\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"expenditures\",\"kind\":\"object\",\"type\":\"ResourceExpenditure\",\"relationName\":\"ResourceCostToResourceExpenditure\"}],\"dbName\":null},\"DisasterBudget\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"eventName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"allocatedBudget\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"expenditures\",\"kind\":\"object\",\"type\":\"ResourceExpenditure\",\"relationName\":\"DisasterBudgetToResourceExpenditure\"}],\"dbName\":null},\"ResourceExpenditure\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"resourceCostId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"quantity\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"totalCost\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"budgetId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"resourceCost\",\"kind\":\"object\",\"type\":\"ResourceCost\",\"relationName\":\"ResourceCostToResourceExpenditure\"},{\"name\":\"budget\",\"kind\":\"object\",\"type\":\"DisasterBudget\",\"relationName\":\"DisasterBudgetToResourceExpenditure\"}],\"dbName\":null},\"RolePermission\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"role\",\"kind\":\"enum\",\"type\":\"Role\"},{\"name\":\"module\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"canView\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"canEdit\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"canDelete\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedBy\",\"kind\":\"scalar\",\"type\":\"String\"}],\"dbName\":null},\"UserSessionLog\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"ipAddress\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"device\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"location\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"loginTime\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"UserToUserSessionLog\"}],\"dbName\":null},\"CampResident\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"campId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"nic\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"familySize\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"checkInTime\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"checkOutTime\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"status\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"camp\",\"kind\":\"object\",\"type\":\"ReliefCamp\",\"relationName\":\"CampResidentToReliefCamp\"}],\"dbName\":null},\"CampInventory\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"campId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"itemType\",\"kind\":\"enum\",\"type\":\"InventoryItemType\"},{\"name\":\"quantity\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"threshold\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"lastUpdated\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"camp\",\"kind\":\"object\",\"type\":\"ReliefCamp\",\"relationName\":\"CampInventoryToReliefCamp\"}],\"dbName\":null},\"CampSchedule\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"campId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"activityName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"startTime\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"endTime\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"type\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"camp\",\"kind\":\"object\",\"type\":\"ReliefCamp\",\"relationName\":\"CampScheduleToReliefCamp\"}],\"dbName\":null},\"HospitalReferral\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"campId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"patientName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"conditionSeverity\",\"kind\":\"enum\",\"type\":\"Severity\"},{\"name\":\"hospitalAssigned\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"transportMethod\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"outcome\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"ReferralStatus\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"camp\",\"kind\":\"object\",\"type\":\"ReliefCamp\",\"relationName\":\"HospitalReferralToReliefCamp\"}],\"dbName\":null},\"CampTransferRequest\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"fromCampId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"toCampId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"peopleCount\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"status\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"requestDate\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"fromCamp\",\"kind\":\"object\",\"type\":\"ReliefCamp\",\"relationName\":\"TransfersOut\"},{\"name\":\"toCamp\",\"kind\":\"object\",\"type\":\"ReliefCamp\",\"relationName\":\"TransfersIn\"}],\"dbName\":null},\"DonorCampaign\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"donorName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"contributionAmount\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"targetCategories\",\"kind\":\"enum\",\"type\":\"TokenCategory\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"tokens\",\"kind\":\"object\",\"type\":\"ReliefToken\",\"relationName\":\"DonorCampaignToReliefToken\"}],\"dbName\":null},\"VolunteerSkill\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"volunteerId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"skillName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"certificationUrl\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"volunteer\",\"kind\":\"object\",\"type\":\"VolunteerProfile\",\"relationName\":\"VolunteerProfileToVolunteerSkill\"}],\"dbName\":null},\"VolunteerTraining\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"volunteerId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"trainingName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"completedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"expiresAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"volunteer\",\"kind\":\"object\",\"type\":\"VolunteerProfile\",\"relationName\":\"VolunteerProfileToVolunteerTraining\"}],\"dbName\":null},\"VolunteerCheckIn\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"volunteerId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"checkInTime\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"checkOutTime\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"latitude\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"longitude\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"zone\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"activeHours\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"volunteer\",\"kind\":\"object\",\"type\":\"VolunteerProfile\",\"relationName\":\"VolunteerCheckInToVolunteerProfile\"}],\"dbName\":null},\"VolunteerWellbeing\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"volunteerId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"recordedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"physicalRating\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"mentalRating\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"needsResources\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"distressFlag\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"volunteer\",\"kind\":\"object\",\"type\":\"VolunteerProfile\",\"relationName\":\"VolunteerProfileToVolunteerWellbeing\"}],\"dbName\":null},\"VolunteerBadge\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"volunteerId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"badgeType\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"earnedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"volunteer\",\"kind\":\"object\",\"type\":\"VolunteerProfile\",\"relationName\":\"VolunteerBadgeToVolunteerProfile\"}],\"dbName\":null},\"ChatSession\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"requestId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"counselorId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"status\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"startedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"endedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"moodAfter\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"messages\",\"kind\":\"object\",\"type\":\"ChatMessage\",\"relationName\":\"ChatMessageToChatSession\"}],\"dbName\":null},\"ChatMessage\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"sessionId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"session\",\"kind\":\"object\",\"type\":\"ChatSession\",\"relationName\":\"ChatMessageToChatSession\"},{\"name\":\"senderId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"content\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"GroupTherapySession\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"description\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"campId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"counselorId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"scheduledFor\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"maxParticipants\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"status\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"participants\",\"kind\":\"object\",\"type\":\"GroupTherapyParticipant\",\"relationName\":\"GroupTherapyParticipantToGroupTherapySession\"}],\"dbName\":null},\"Donation\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"donorId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"donorName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"type\",\"kind\":\"enum\",\"type\":\"DonationType\"},{\"name\":\"amount\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"itemsDescription\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"transactionId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"paymentGateway\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"transactionDate\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"DonationStatus\"},{\"name\":\"campId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"donor\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"DonationToUser\"},{\"name\":\"camp\",\"kind\":\"object\",\"type\":\"ReliefCamp\",\"relationName\":\"DonationToReliefCamp\"}],\"dbName\":null},\"SafetyCheckIn\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"SafetyStatus\"},{\"name\":\"message\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"latitude\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"longitude\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"user\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"SafetyCheckInToUser\"}],\"dbName\":null},\"FamilyMember\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"primaryUserId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"relation\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"SafetyStatus\"},{\"name\":\"notes\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"primaryUser\",\"kind\":\"object\",\"type\":\"User\",\"relationName\":\"FamilyMemberToUser\"}],\"dbName\":null},\"GroupTherapyParticipant\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"sessionId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"session\",\"kind\":\"object\",\"type\":\"GroupTherapySession\",\"relationName\":\"GroupTherapyParticipantToGroupTherapySession\"},{\"name\":\"userId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"attendanceStatus\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"notes\",\"kind\":\"scalar\",\"type\":\"String\"}],\"dbName\":null},\"MentalHealthGuide\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"content\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"tags\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"isOfflineAvailable\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null},\"RainfallReading\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"stationId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"stationName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"district\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"province\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"latitude\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"longitude\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"rainfallMmPerHour\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"cumulativeRain24h\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"cumulativeRain72h\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"riskLevel\",\"kind\":\"enum\",\"type\":\"WaterRiskLevel\"},{\"name\":\"recordedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"fetchedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"source\",\"kind\":\"scalar\",\"type\":\"String\"}],\"dbName\":null},\"RiverWaterLevel\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"gaugeId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"riverName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"stationName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"district\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"latitude\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"longitude\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"waterLevelMetres\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"flowRateCumecs\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"alertLevel\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"minorFloodLevel\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"majorFloodLevel\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"RiverStatus\"},{\"name\":\"changeFromLastHour\",\"kind\":\"scalar\",\"type\":\"Float\"},{\"name\":\"trend\",\"kind\":\"enum\",\"type\":\"WaterTrend\"},{\"name\":\"recordedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"fetchedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"source\",\"kind\":\"scalar\",\"type\":\"String\"}],\"dbName\":null},\"DownstreamMapping\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"gaugeId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"riverName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"stationName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"targetDistricts\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null}},\"enums\":{},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = {
  getRuntime: () => require('./query_engine_bg.js'),
  getQueryEngineWasmModule: async () => {
    const loader = (await import('#wasm-engine-loader')).default
    const engine = (await loader).default
    return engine 
  }
}
config.compilerWasm = undefined

config.injectableEdgeEnv = () => ({
  parsed: {
    DATABASE_URL: typeof globalThis !== 'undefined' && globalThis['DATABASE_URL'] || typeof process !== 'undefined' && process.env && process.env.DATABASE_URL || undefined
  }
})

if (typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined) {
  Debug.enable(typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined)
}

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

