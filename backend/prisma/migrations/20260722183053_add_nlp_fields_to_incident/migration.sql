-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CITIZEN', 'VOLUNTEER', 'ADMIN', 'DMC_OFFICER', 'FIELD_RESPONDER');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'EN_ROUTE', 'ON_SITE');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('INFO', 'WARNING', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "TokenStatus" AS ENUM ('ACTIVE', 'PARTIALLY_USED', 'FULLY_USED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "DamageCategory" AS ENUM ('RESIDENTIAL', 'AGRICULTURAL', 'INFRASTRUCTURE', 'COMMERCIAL', 'UTILITY', 'OTHER');

-- CreateEnum
CREATE TYPE "DamageLevel" AS ENUM ('NONE', 'MINOR', 'MODERATE', 'MAJOR', 'TOTAL_LOSS');

-- CreateEnum
CREATE TYPE "DamageStatus" AS ENUM ('PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'SENIOR_REVIEW', 'APPROVED');

-- CreateEnum
CREATE TYPE "VerifierRole" AS ENUM ('GRAMA_NILADHARI', 'VILLAGE_OFFICER', 'COMMUNITY_LEADER', 'NGO_OFFICER', 'LOCAL_AUTHORITY');

-- CreateEnum
CREATE TYPE "VerificationResult" AS ENUM ('CONFIRMED', 'REJECTED', 'NEEDS_INVESTIGATION');

-- CreateEnum
CREATE TYPE "SupportType" AS ENUM ('COUNSELING', 'CHILD_SUPPORT', 'TRAUMA_CARE', 'GRIEF_SUPPORT', 'GENERAL');

-- CreateEnum
CREATE TYPE "SupportUrgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SupportStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "InventoryItemType" AS ENUM ('FOOD', 'WATER', 'MEDICAL', 'BLANKETS', 'HYGIENE');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'ADMITTED', 'DISCHARGED');

-- CreateEnum
CREATE TYPE "TokenCategory" AS ENUM ('MEDICAL', 'FOOD', 'CLOTHING', 'SHELTER', 'TRANSPORT', 'EDUCATION', 'MENTAL_HEALTH');

-- CreateEnum
CREATE TYPE "DonationType" AS ENUM ('MONETARY', 'MATERIAL');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'RECEIVED', 'ALLOCATED');

-- CreateEnum
CREATE TYPE "SafetyStatus" AS ENUM ('SAFE', 'NEEDS_HELP', 'UNKNOWN', 'INJURED', 'EVACUATED', 'TRAPPED', 'SHELTERED');

-- CreateEnum
CREATE TYPE "WaterRiskLevel" AS ENUM ('NORMAL', 'WATCH', 'WARNING', 'DANGER');

-- CreateEnum
CREATE TYPE "RiverStatus" AS ENUM ('NORMAL', 'ALERT', 'MINOR_FLOOD', 'MAJOR_FLOOD');

-- CreateEnum
CREATE TYPE "WaterTrend" AS ENUM ('RISING', 'FALLING', 'STABLE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CITIZEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "region" TEXT,
    "hasMobileApp" BOOLEAN NOT NULL DEFAULT false,
    "isFieldActive" BOOLEAN NOT NULL DEFAULT false,
    "lastCheckInTime" TIMESTAMP(3),
    "nic" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorGracePeriodEnds" TIMESTAMP(3),
    "twoFactorSecret" TEXT,
    "profilePicture" TEXT,
    "currentSectorId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentReport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT NOT NULL,
    "images" TEXT[],
    "reporterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "province" TEXT,
    "zoneId" TEXT,
    "zoneName" TEXT,
    "mlConfidence" DOUBLE PRECISION,
    "detectedLanguage" TEXT,
    "languageConfidence" DOUBLE PRECISION,
    "translatedText" TEXT,
    "nlpEntities" JSONB,

    CONSTRAINT "IncidentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "AlertType" NOT NULL DEFAULT 'INFO',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "latitudes" DOUBLE PRECISION[],
    "locations" TEXT[],
    "longitudes" DOUBLE PRECISION[],
    "acknowledgementRate" DOUBLE PRECISION,
    "channels" JSONB,
    "scheduledTime" TIMESTAMP(3),
    "translatedMsgSinhala" TEXT,
    "translatedMsgTamil" TEXT,
    "targetSectors" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sector" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "type" TEXT NOT NULL DEFAULT 'GRID',
    "polygonData" JSONB,
    "district" TEXT,
    "province" TEXT,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReliefCamp" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "totalCapacity" INTEGER NOT NULL,
    "services" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "waitTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReliefCamp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "capacity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "contact" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "incidentId" TEXT,
    "assignedToId" TEXT,
    "assignedById" TEXT,
    "priority" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "incidentsJoined" INTEGER NOT NULL DEFAULT 0,
    "readinessScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "priority" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "peopleCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignedVolunteerId" TEXT,
    "escalationLevel" TEXT NOT NULL DEFAULT 'NONE',
    "phone" TEXT,

    CONSTRAINT "HelpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpRequestEscalation" (
    "id" TEXT NOT NULL,
    "helpRequestId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HelpRequestEscalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportVerification" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissingPerson" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "description" TEXT NOT NULL,
    "lastSeen" TEXT NOT NULL,
    "photo" TEXT,
    "reportedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'MISSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nic" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "gender" TEXT,
    "isUnidentified" BOOLEAN NOT NULL DEFAULT false,
    "reunificationNotes" TEXT,
    "reunificationStatus" TEXT NOT NULL DEFAULT 'NONE',

    CONSTRAINT "MissingPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MLLog" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT,
    "inputData" JSONB NOT NULL,
    "prediction" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "modelVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MLLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentHistory" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "status" "Status" NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceRequestMatch" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceRequestMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReliefToken" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "qrCodeData" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campId" TEXT,
    "status" "TokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "maxUsage" INTEGER NOT NULL DEFAULT 1,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categories" "TokenCategory"[],
    "donorId" TEXT,
    "fraudRiskScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "householdId" TEXT,
    "isHouseholdBundle" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReliefToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReliefTokenClaim" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedBy" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "proofImage" TEXT,
    "campId" TEXT,
    "notes" TEXT,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,

    CONSTRAINT "ReliefTokenClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DamageAssessment" (
    "id" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "incidentId" TEXT,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "category" "DamageCategory" NOT NULL,
    "structuralDamage" "DamageLevel" NOT NULL DEFAULT 'NONE',
    "cropDamage" "DamageLevel" NOT NULL DEFAULT 'NONE',
    "utilityDamage" "DamageLevel" NOT NULL DEFAULT 'NONE',
    "roadDamage" "DamageLevel" NOT NULL DEFAULT 'NONE',
    "affectedPersons" INTEGER,
    "estimatedLoss" DOUBLE PRECISION,
    "mediaUrls" TEXT[],
    "status" "DamageStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "notes" TEXT,
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aiEstimatedCost" DOUBLE PRECISION,
    "aiEstimatedDamage" TEXT,
    "compensationEligibilityScore" DOUBLE PRECISION,
    "compensationEligible" BOOLEAN NOT NULL DEFAULT false,
    "familyVulnerabilityScore" INTEGER,
    "incomeBracket" TEXT,
    "polygonData" JSONB,
    "propertyOwnershipStatus" TEXT,
    "reviewerNotes" TEXT,

    CONSTRAINT "DamageAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalVerifier" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verifierRole" "VerifierRole" NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "orgName" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "verificationsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalVerifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifierAction" (
    "id" TEXT NOT NULL,
    "verifierId" TEXT NOT NULL,
    "incidentId" TEXT,
    "helpRequestId" TEXT,
    "result" "VerificationResult" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerifierAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PsychologicalSupportRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "SupportType" NOT NULL DEFAULT 'GENERAL',
    "description" TEXT,
    "urgency" "SupportUrgency" NOT NULL DEFAULT 'MEDIUM',
    "status" "SupportStatus" NOT NULL DEFAULT 'PENDING',
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "affectedCount" INTEGER,
    "assignedToId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "checkInStatus" TEXT DEFAULT 'PENDING',
    "nextCheckInDate" TIMESTAMP(3),

    CONSTRAINT "PsychologicalSupportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreatForecast" (
    "id" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "threatType" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "forecastTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreatForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftHandover" (
    "id" TEXT NOT NULL,
    "shiftTime" TIMESTAMP(3) NOT NULL,
    "incidentsOpened" INTEGER NOT NULL DEFAULT 0,
    "incidentsClosed" INTEGER NOT NULL DEFAULT 0,
    "resourcesDeployed" INTEGER NOT NULL DEFAULT 0,
    "volunteersActive" INTEGER NOT NULL DEFAULT 0,
    "criticalItems" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftHandover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvacuationRoute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvacuationRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerLocation" (
    "id" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "skill" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreatProjection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "polygonCoords" JSONB NOT NULL,
    "riskLevel" "Severity" NOT NULL DEFAULT 'HIGH',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThreatProjection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AfterActionReport" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "timeline" JSONB NOT NULL,
    "resourcesUsed" JSONB NOT NULL,
    "costEstimate" DOUBLE PRECISION NOT NULL,
    "peopleAffected" INTEGER NOT NULL,
    "resolutionTime" INTEGER NOT NULL,
    "lessonsLearned" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AfterActionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KPIBenchmark" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "targetAvgResponse" INTEGER NOT NULL,
    "targetOccupancy" DOUBLE PRECISION NOT NULL,
    "targetVolunteer" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KPIBenchmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceCost" (
    "id" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "unitType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisasterBudget" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "allocatedBudget" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisasterBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceExpenditure" (
    "id" TEXT NOT NULL,
    "resourceCostId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "budgetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceExpenditure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "module" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSessionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "device" TEXT,
    "location" TEXT,
    "loginTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSessionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampResident" (
    "id" TEXT NOT NULL,
    "campId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nic" TEXT,
    "familySize" INTEGER NOT NULL DEFAULT 1,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "CampResident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampInventory" (
    "id" TEXT NOT NULL,
    "campId" TEXT NOT NULL,
    "itemType" "InventoryItemType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "threshold" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampSchedule" (
    "id" TEXT NOT NULL,
    "campId" TEXT NOT NULL,
    "activityName" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "CampSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalReferral" (
    "id" TEXT NOT NULL,
    "campId" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "conditionSeverity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "hospitalAssigned" TEXT NOT NULL,
    "transportMethod" TEXT,
    "outcome" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HospitalReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampTransferRequest" (
    "id" TEXT NOT NULL,
    "fromCampId" TEXT NOT NULL,
    "toCampId" TEXT NOT NULL,
    "peopleCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampTransferRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorCampaign" (
    "id" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "contributionAmount" DOUBLE PRECISION NOT NULL,
    "targetCategories" "TokenCategory"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonorCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerSkill" (
    "id" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "certificationUrl" TEXT,

    CONSTRAINT "VolunteerSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerTraining" (
    "id" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "trainingName" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "VolunteerTraining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerCheckIn" (
    "id" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutTime" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "zone" TEXT,
    "activeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "VolunteerCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerWellbeing" (
    "id" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "physicalRating" INTEGER NOT NULL,
    "mentalRating" INTEGER NOT NULL,
    "needsResources" BOOLEAN NOT NULL DEFAULT false,
    "distressFlag" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VolunteerWellbeing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerBadge" (
    "id" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "badgeType" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolunteerBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "counselorId" TEXT,
    "userId" TEXT NOT NULL DEFAULT 'anonymous',
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "moodAfter" TEXT,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupTherapySession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "campId" TEXT,
    "counselorId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "maxParticipants" INTEGER NOT NULL DEFAULT 20,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "GroupTherapySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "donorId" TEXT,
    "donorName" TEXT NOT NULL,
    "type" "DonationType" NOT NULL,
    "amount" DOUBLE PRECISION,
    "itemsDescription" TEXT,
    "transactionId" TEXT,
    "paymentGateway" TEXT,
    "transactionDate" TIMESTAMP(3),
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "campId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyCheckIn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SafetyStatus" NOT NULL,
    "message" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetyCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL,
    "primaryUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "status" "SafetyStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupTherapyParticipant" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attendanceStatus" TEXT NOT NULL DEFAULT 'REGISTERED',
    "notes" TEXT,

    CONSTRAINT "GroupTherapyParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentalHealthGuide" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "isOfflineAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentalHealthGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RainfallReading" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "stationName" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "rainfallMmPerHour" DOUBLE PRECISION NOT NULL,
    "cumulativeRain24h" DOUBLE PRECISION NOT NULL,
    "cumulativeRain72h" DOUBLE PRECISION NOT NULL,
    "riskLevel" "WaterRiskLevel" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,

    CONSTRAINT "RainfallReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiverWaterLevel" (
    "id" TEXT NOT NULL,
    "gaugeId" TEXT NOT NULL,
    "riverName" TEXT NOT NULL,
    "stationName" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "waterLevelMetres" DOUBLE PRECISION NOT NULL,
    "flowRateCumecs" DOUBLE PRECISION NOT NULL,
    "alertLevel" DOUBLE PRECISION NOT NULL,
    "minorFloodLevel" DOUBLE PRECISION NOT NULL,
    "majorFloodLevel" DOUBLE PRECISION NOT NULL,
    "status" "RiverStatus" NOT NULL,
    "changeFromLastHour" DOUBLE PRECISION NOT NULL,
    "trend" "WaterTrend" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,

    CONSTRAINT "RiverWaterLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DownstreamMapping" (
    "id" TEXT NOT NULL,
    "gaugeId" TEXT NOT NULL,
    "riverName" TEXT NOT NULL,
    "stationName" TEXT NOT NULL,
    "targetDistricts" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DownstreamMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nic_key" ON "User"("nic");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerProfile_userId_key" ON "VolunteerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReliefToken_code_key" ON "ReliefToken"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LocalVerifier_userId_key" ON "LocalVerifier"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AfterActionReport_incidentId_key" ON "AfterActionReport"("incidentId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceCost_resourceType_key" ON "ResourceCost"("resourceType");

-- CreateIndex
CREATE UNIQUE INDEX "DownstreamMapping_gaugeId_key" ON "DownstreamMapping"("gaugeId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_currentSectorId_fkey" FOREIGN KEY ("currentSectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentReport" ADD CONSTRAINT "IncidentReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "IncidentReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerProfile" ADD CONSTRAINT "VolunteerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRequest" ADD CONSTRAINT "HelpRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRequestEscalation" ADD CONSTRAINT "HelpRequestEscalation_helpRequestId_fkey" FOREIGN KEY ("helpRequestId") REFERENCES "HelpRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportVerification" ADD CONSTRAINT "ReportVerification_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "IncidentReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportVerification" ADD CONSTRAINT "ReportVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentHistory" ADD CONSTRAINT "IncidentHistory_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "IncidentReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationLog" ADD CONSTRAINT "LocationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReliefToken" ADD CONSTRAINT "ReliefToken_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "DonorCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReliefToken" ADD CONSTRAINT "ReliefToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReliefTokenClaim" ADD CONSTRAINT "ReliefTokenClaim_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "ReliefToken"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DamageAssessment" ADD CONSTRAINT "DamageAssessment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "IncidentReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DamageAssessment" ADD CONSTRAINT "DamageAssessment_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalVerifier" ADD CONSTRAINT "LocalVerifier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifierAction" ADD CONSTRAINT "VerifierAction_helpRequestId_fkey" FOREIGN KEY ("helpRequestId") REFERENCES "HelpRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifierAction" ADD CONSTRAINT "VerifierAction_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "IncidentReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifierAction" ADD CONSTRAINT "VerifierAction_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "LocalVerifier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PsychologicalSupportRequest" ADD CONSTRAINT "PsychologicalSupportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AfterActionReport" ADD CONSTRAINT "AfterActionReport_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "IncidentReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceExpenditure" ADD CONSTRAINT "ResourceExpenditure_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "DisasterBudget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceExpenditure" ADD CONSTRAINT "ResourceExpenditure_resourceCostId_fkey" FOREIGN KEY ("resourceCostId") REFERENCES "ResourceCost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSessionLog" ADD CONSTRAINT "UserSessionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampResident" ADD CONSTRAINT "CampResident_campId_fkey" FOREIGN KEY ("campId") REFERENCES "ReliefCamp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampInventory" ADD CONSTRAINT "CampInventory_campId_fkey" FOREIGN KEY ("campId") REFERENCES "ReliefCamp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampSchedule" ADD CONSTRAINT "CampSchedule_campId_fkey" FOREIGN KEY ("campId") REFERENCES "ReliefCamp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalReferral" ADD CONSTRAINT "HospitalReferral_campId_fkey" FOREIGN KEY ("campId") REFERENCES "ReliefCamp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampTransferRequest" ADD CONSTRAINT "CampTransferRequest_fromCampId_fkey" FOREIGN KEY ("fromCampId") REFERENCES "ReliefCamp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampTransferRequest" ADD CONSTRAINT "CampTransferRequest_toCampId_fkey" FOREIGN KEY ("toCampId") REFERENCES "ReliefCamp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerSkill" ADD CONSTRAINT "VolunteerSkill_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "VolunteerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerTraining" ADD CONSTRAINT "VolunteerTraining_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "VolunteerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerCheckIn" ADD CONSTRAINT "VolunteerCheckIn_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "VolunteerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerWellbeing" ADD CONSTRAINT "VolunteerWellbeing_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "VolunteerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerBadge" ADD CONSTRAINT "VolunteerBadge_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "VolunteerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_campId_fkey" FOREIGN KEY ("campId") REFERENCES "ReliefCamp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyCheckIn" ADD CONSTRAINT "SafetyCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_primaryUserId_fkey" FOREIGN KEY ("primaryUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupTherapyParticipant" ADD CONSTRAINT "GroupTherapyParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GroupTherapySession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
