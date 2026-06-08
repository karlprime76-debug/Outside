-- 20240612_final_sync
-- Comble les écarts entre le schéma Prisma et la base Supabase production.
-- Toutes les opérations sont idempotentes (IF NOT EXISTS / IF EXISTS).
-- Risque de perte de données : ZÉRO.

-- =================================================================
-- SECTION 1 : Ajout des valeurs d'enum manquantes
-- =================================================================

-- MomentEventType (manquent: PROFILE_OPEN, FOLLOW_FROM_MOMENT, NOT_INTERESTED, SEE_MORE_LIKE_THIS, REPORT)
ALTER TYPE "MomentEventType" ADD VALUE IF NOT EXISTS 'PROFILE_OPEN';
ALTER TYPE "MomentEventType" ADD VALUE IF NOT EXISTS 'FOLLOW_FROM_MOMENT';
ALTER TYPE "MomentEventType" ADD VALUE IF NOT EXISTS 'NOT_INTERESTED';
ALTER TYPE "MomentEventType" ADD VALUE IF NOT EXISTS 'SEE_MORE_LIKE_THIS';
ALTER TYPE "MomentEventType" ADD VALUE IF NOT EXISTS 'REPORT';

-- NotificationType (manquent: PLAN_REMINDER, DROP_AVAILABLE, MISSION_AVAILABLE, PLAN_GROUP_MESSAGE, WEEKLY_RECAP_READY, AMBASSADOR_TO_DISCOVER)
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PLAN_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DROP_AVAILABLE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MISSION_AVAILABLE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PLAN_GROUP_MESSAGE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WEEKLY_RECAP_READY';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'AMBASSADOR_TO_DISCOVER';

-- Mood (manquent: DANCE, WALK, FREE, MEET_PEOPLE, CALM, TONIGHT, NOW)
ALTER TYPE "Mood" ADD VALUE IF NOT EXISTS 'DANCE';
ALTER TYPE "Mood" ADD VALUE IF NOT EXISTS 'WALK';
ALTER TYPE "Mood" ADD VALUE IF NOT EXISTS 'FREE';
ALTER TYPE "Mood" ADD VALUE IF NOT EXISTS 'MEET_PEOPLE';
ALTER TYPE "Mood" ADD VALUE IF NOT EXISTS 'CALM';
ALTER TYPE "Mood" ADD VALUE IF NOT EXISTS 'TONIGHT';
ALTER TYPE "Mood" ADD VALUE IF NOT EXISTS 'NOW';

-- ReportReason (manquent: SCAM, VIOLENCE, HATE, SEXUAL_CONTENT, PRIVATE_INFO, COPYRIGHT)
ALTER TYPE "ReportReason" ADD VALUE IF NOT EXISTS 'SCAM';
ALTER TYPE "ReportReason" ADD VALUE IF NOT EXISTS 'VIOLENCE';
ALTER TYPE "ReportReason" ADD VALUE IF NOT EXISTS 'HATE';
ALTER TYPE "ReportReason" ADD VALUE IF NOT EXISTS 'SEXUAL_CONTENT';
ALTER TYPE "ReportReason" ADD VALUE IF NOT EXISTS 'PRIVATE_INFO';
ALTER TYPE "ReportReason" ADD VALUE IF NOT EXISTS 'COPYRIGHT';

-- ConversationType (manquent: GROUP, PLAN)
ALTER TYPE "ConversationType" ADD VALUE IF NOT EXISTS 'GROUP';
ALTER TYPE "ConversationType" ADD VALUE IF NOT EXISTS 'PLAN';

-- =================================================================
-- SECTION 2 : Nouvelles tables
-- =================================================================

-- DailyChallenge
CREATE TABLE IF NOT EXISTS "DailyChallenge" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "rewardLabel" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DailyChallenge_key_key" UNIQUE ("key")
);

CREATE INDEX IF NOT EXISTS "DailyChallenge_key_idx" ON "DailyChallenge"("key");
CREATE INDEX IF NOT EXISTS "DailyChallenge_active_idx" ON "DailyChallenge"("active");

-- UserChallengeProgress
CREATE TABLE IF NOT EXISTS "UserChallengeProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeKey" TEXT NOT NULL,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserChallengeProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserChallengeProgress_userId_challengeKey_key" ON "UserChallengeProgress"("userId", "challengeKey");
CREATE INDEX IF NOT EXISTS "UserChallengeProgress_userId_idx" ON "UserChallengeProgress"("userId");
CREATE INDEX IF NOT EXISTS "UserChallengeProgress_challengeKey_idx" ON "UserChallengeProgress"("challengeKey");

-- CityMission
CREATE TABLE IF NOT EXISTS "CityMission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT,
    "rewardLabel" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CityMission_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CityMission_key_key" UNIQUE ("key")
);

CREATE INDEX IF NOT EXISTS "CityMission_key_idx" ON "CityMission"("key");
CREATE INDEX IF NOT EXISTS "CityMission_city_idx" ON "CityMission"("city");
CREATE INDEX IF NOT EXISTS "CityMission_active_idx" ON "CityMission"("active");

-- UserCityMissionProgress
CREATE TABLE IF NOT EXISTS "UserCityMissionProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionKey" TEXT NOT NULL,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserCityMissionProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserCityMissionProgress_userId_missionKey_key" ON "UserCityMissionProgress"("userId", "missionKey");
CREATE INDEX IF NOT EXISTS "UserCityMissionProgress_userId_idx" ON "UserCityMissionProgress"("userId");
CREATE INDEX IF NOT EXISTS "UserCityMissionProgress_missionKey_idx" ON "UserCityMissionProgress"("missionKey");

-- OnboardingProgress
CREATE TABLE IF NOT EXISTS "OnboardingProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hasProfilePhoto" BOOLEAN NOT NULL DEFAULT false,
    "hasActiveCity" BOOLEAN NOT NULL DEFAULT false,
    "hasFollowedUsers" BOOLEAN NOT NULL DEFAULT false,
    "hasSavedPlan" BOOLEAN NOT NULL DEFAULT false,
    "hasViewedMoment" BOOLEAN NOT NULL DEFAULT false,
    "hasActivatedStatus" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OnboardingProgress_userId_key" UNIQUE ("userId")
);

CREATE INDEX IF NOT EXISTS "OnboardingProgress_userId_idx" ON "OnboardingProgress"("userId");

-- OutsideTip
CREATE TABLE IF NOT EXISTS "OutsideTip" (
    "id" TEXT NOT NULL,
    "city" TEXT,
    "countryCode" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mood" "Mood",
    "actionLabel" TEXT NOT NULL,
    "actionUrl" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OutsideTip_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OutsideTip_city_idx" ON "OutsideTip"("city");
CREATE INDEX IF NOT EXISTS "OutsideTip_countryCode_idx" ON "OutsideTip"("countryCode");
CREATE INDEX IF NOT EXISTS "OutsideTip_active_idx" ON "OutsideTip"("active");

-- OutsideDrop
CREATE TABLE IF NOT EXISTS "OutsideDrop" (
    "id" TEXT NOT NULL,
    "city" TEXT,
    "countryCode" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "targetUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMPTZ,
    "endsAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OutsideDrop_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OutsideDrop_city_idx" ON "OutsideDrop"("city");
CREATE INDEX IF NOT EXISTS "OutsideDrop_countryCode_idx" ON "OutsideDrop"("countryCode");
CREATE INDEX IF NOT EXISTS "OutsideDrop_active_idx" ON "OutsideDrop"("active");
CREATE INDEX IF NOT EXISTS "OutsideDrop_type_idx" ON "OutsideDrop"("type");

-- ReferralInvite
CREATE TABLE IF NOT EXISTS "ReferralInvite" (
    "id" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "invitedEmail" TEXT,
    "invitedPhone" TEXT,
    "acceptedUserId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMPTZ,
    CONSTRAINT "ReferralInvite_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ReferralInvite_code_key" UNIQUE ("code"),
    CONSTRAINT "ReferralInvite_acceptedUserId_key" UNIQUE ("acceptedUserId")
);

CREATE INDEX IF NOT EXISTS "ReferralInvite_inviterId_idx" ON "ReferralInvite"("inviterId");
CREATE INDEX IF NOT EXISTS "ReferralInvite_code_idx" ON "ReferralInvite"("code");
CREATE INDEX IF NOT EXISTS "ReferralInvite_acceptedUserId_idx" ON "ReferralInvite"("acceptedUserId");

-- DirectMessageReaction
CREATE TABLE IF NOT EXISTS "DirectMessageReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DirectMessageReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DirectMessageReaction_messageId_userId_emoji_key" ON "DirectMessageReaction"("messageId", "userId", "emoji");
CREATE INDEX IF NOT EXISTS "DirectMessageReaction_messageId_idx" ON "DirectMessageReaction"("messageId");
CREATE INDEX IF NOT EXISTS "DirectMessageReaction_userId_idx" ON "DirectMessageReaction"("userId");

-- SavedPlan
CREATE TABLE IF NOT EXISTS "SavedPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedPlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SavedPlan_userId_planId_key" ON "SavedPlan"("userId", "planId");
CREATE INDEX IF NOT EXISTS "SavedPlan_userId_idx" ON "SavedPlan"("userId");
CREATE INDEX IF NOT EXISTS "SavedPlan_planId_idx" ON "SavedPlan"("planId");

-- PlanParticipantReview
DO $$ BEGIN
    CREATE TYPE "PlanReviewStatus" AS ENUM ('PENDING', 'SUBMITTED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "PlanParticipantReview" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewedUserId" TEXT,
    "wasPresent" BOOLEAN,
    "wasRespectful" BOOLEAN,
    "profileSeemedReal" BOOLEAN,
    "planWasReal" BOOLEAN,
    "comment" TEXT,
    "status" "PlanReviewStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlanParticipantReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PlanParticipantReview_planId_idx" ON "PlanParticipantReview"("planId");
CREATE INDEX IF NOT EXISTS "PlanParticipantReview_reviewerId_idx" ON "PlanParticipantReview"("reviewerId");
CREATE INDEX IF NOT EXISTS "PlanParticipantReview_reviewedUserId_idx" ON "PlanParticipantReview"("reviewedUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "PlanParticipantReview_planId_reviewerId_reviewedUserId_key" ON "PlanParticipantReview"("planId", "reviewerId", "reviewedUserId");

-- PlanReminder
CREATE TABLE IF NOT EXISTS "PlanReminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "remindAt" TIMESTAMPTZ NOT NULL,
    "sentAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlanReminder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PlanReminder_userId_idx" ON "PlanReminder"("userId");
CREATE INDEX IF NOT EXISTS "PlanReminder_planId_idx" ON "PlanReminder"("planId");
CREATE INDEX IF NOT EXISTS "PlanReminder_remindAt_idx" ON "PlanReminder"("remindAt");
CREATE INDEX IF NOT EXISTS "PlanReminder_sentAt_idx" ON "PlanReminder"("sentAt");

-- UserTrustProfile
CREATE TABLE IF NOT EXISTS "UserTrustProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "outsideScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "presenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "respectScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "realProfileScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "organizerScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "plansJoined" INTEGER NOT NULL DEFAULT 0,
    "plansCreated" INTEGER NOT NULL DEFAULT 0,
    "validatedAttendances" INTEGER NOT NULL DEFAULT 0,
    "positiveReviews" INTEGER NOT NULL DEFAULT 0,
    "reportsCount" INTEGER NOT NULL DEFAULT 0,
    "level" TEXT NOT NULL DEFAULT 'Nouveau',
    "lastCalculatedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserTrustProfile_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserTrustProfile_userId_key" UNIQUE ("userId")
);

-- ProVenue
DO $$ BEGIN
    CREATE TYPE "VenueVerificationStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "ProVenue" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "city" TEXT,
    "area" TEXT,
    "addressPublic" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "instagram" TEXT,
    "tiktok" TEXT,
    "logoUrl" TEXT,
    "documentUrl" TEXT,
    "status" "VenueVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProVenue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProVenue_ownerId_idx" ON "ProVenue"("ownerId");
CREATE INDEX IF NOT EXISTS "ProVenue_city_idx" ON "ProVenue"("city");
CREATE INDEX IF NOT EXISTS "ProVenue_status_idx" ON "ProVenue"("status");

-- SafetyContact
CREATE TABLE IF NOT EXISTS "SafetyContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trustedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SafetyContact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SafetyContact_userId_trustedUserId_key" ON "SafetyContact"("userId", "trustedUserId");
CREATE INDEX IF NOT EXISTS "SafetyContact_userId_idx" ON "SafetyContact"("userId");
CREATE INDEX IF NOT EXISTS "SafetyContact_trustedUserId_idx" ON "SafetyContact"("trustedUserId");

-- PlanSafetyShare
CREATE TABLE IF NOT EXISTS "PlanSafetyShare" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "trustedUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SHARED',
    "arrivedAt" TIMESTAMPTZ,
    "returnedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlanSafetyShare_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PlanSafetyShare_userId_idx" ON "PlanSafetyShare"("userId");
CREATE INDEX IF NOT EXISTS "PlanSafetyShare_planId_idx" ON "PlanSafetyShare"("planId");
CREATE INDEX IF NOT EXISTS "PlanSafetyShare_trustedUserId_idx" ON "PlanSafetyShare"("trustedUserId");

-- UserTripHistory
CREATE TABLE IF NOT EXISTS "UserTripHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "countryCode" TEXT,
    "source" TEXT NOT NULL,
    "planId" TEXT,
    "eventId" TEXT,
    "momentId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserTripHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UserTripHistory_userId_idx" ON "UserTripHistory"("userId");
CREATE INDEX IF NOT EXISTS "UserTripHistory_city_idx" ON "UserTripHistory"("city");
CREATE INDEX IF NOT EXISTS "UserTripHistory_createdAt_idx" ON "UserTripHistory"("createdAt");

-- PlaceVibeSignal
DO $$ BEGIN
    CREATE TYPE "PlaceVibeSignalType" AS ENUM ('CALM', 'CROWDED', 'GOOD_MOOD', 'EXPENSIVE', 'FREE_ENTRY', 'SAFE', 'LOUD_MUSIC', 'GOOD_FOOD', 'BAD_MOOD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "PlaceVibeSignal" (
    "id" TEXT NOT NULL,
    "placeId" TEXT,
    "userId" TEXT NOT NULL,
    "city" TEXT,
    "countryCode" TEXT,
    "type" "PlaceVibeSignalType" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlaceVibeSignal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PlaceVibeSignal_placeId_idx" ON "PlaceVibeSignal"("placeId");
CREATE INDEX IF NOT EXISTS "PlaceVibeSignal_city_idx" ON "PlaceVibeSignal"("city");
CREATE INDEX IF NOT EXISTS "PlaceVibeSignal_createdAt_idx" ON "PlaceVibeSignal"("createdAt");

-- =================================================================
-- SECTION 3 : Colonnes manquantes sur les tables existantes
-- =================================================================

-- Plan: confirmationScore, isExpress, expiresAt
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "confirmationScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "isExpress" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMPTZ;

-- Moment: mediaWidth, mediaHeight, mediaDuration, mediaCrop, videoStartTime, videoEndTime, mediaAspectRatio
ALTER TABLE "Moment" ADD COLUMN IF NOT EXISTS "mediaWidth" INTEGER;
ALTER TABLE "Moment" ADD COLUMN IF NOT EXISTS "mediaHeight" INTEGER;
ALTER TABLE "Moment" ADD COLUMN IF NOT EXISTS "mediaDuration" INTEGER;
ALTER TABLE "Moment" ADD COLUMN IF NOT EXISTS "mediaCrop" JSONB;
ALTER TABLE "Moment" ADD COLUMN IF NOT EXISTS "videoStartTime" INTEGER;
ALTER TABLE "Moment" ADD COLUMN IF NOT EXISTS "videoEndTime" INTEGER;
ALTER TABLE "Moment" ADD COLUMN IF NOT EXISTS "mediaAspectRatio" TEXT;

-- DirectMessage: mediaMimeType, mediaName, mediaSize
ALTER TABLE "DirectMessage" ADD COLUMN IF NOT EXISTS "mediaMimeType" TEXT;
ALTER TABLE "DirectMessage" ADD COLUMN IF NOT EXISTS "mediaName" TEXT;
ALTER TABLE "DirectMessage" ADD COLUMN IF NOT EXISTS "mediaSize" INTEGER;

-- Conversation.planId
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "planId" TEXT;
CREATE INDEX IF NOT EXISTS "Conversation_planId_idx" ON "Conversation"("planId");

-- PlanParticipant.attendance
DO $$ BEGIN
    CREATE TYPE "PlanAttendanceStatus" AS ENUM ('GOING', 'MAYBE', 'LEFT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "PlanParticipant" ADD COLUMN IF NOT EXISTS "attendance" "PlanAttendanceStatus" NOT NULL DEFAULT 'GOING';

-- UserSettings: notificationPlanReminders, pushPlanReminders
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "notificationPlanReminders" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "pushPlanReminders" BOOLEAN NOT NULL DEFAULT true;

-- =================================================================
-- SECTION 4 : Correction des colonnes lowerCamelCase dans MomentScore
-- =================================================================
-- Problème : la migration 20240607 a créé la table avec des identifiants
-- non quotés (ex : momentId → momentid), puis 20240611 a ajouté des
-- colonnes camelCase (ex : "viralScore"). On a maintenant des doublons.
-- Solution : recopier les données des lowercase vers camelCase puis
-- supprimer les lowercase.

-- Backfill : copier les données des colonnes lowercase vers camelCase
UPDATE "MomentScore" SET "viralScore" = viralscore WHERE "viralScore" = 0 AND viralscore != 0;
UPDATE "MomentScore" SET "localScore" = localscore WHERE "localScore" = 0 AND localscore != 0;
UPDATE "MomentScore" SET "qualityScore" = qualityscore WHERE "qualityScore" = 0 AND qualityscore != 0;
UPDATE "MomentScore" SET "safetyScore" = safetyscore WHERE "safetyScore" = 1 AND safetyscore != 1;
UPDATE "MomentScore" SET "dmShares" = dmshares WHERE "dmShares" = 0 AND dmshares != 0;
UPDATE "MomentScore" SET "profileOpens" = profileopens WHERE "profileOpens" = 0 AND profileopens != 0;
UPDATE "MomentScore" SET "followsGenerated" = followsgenerated WHERE "followsGenerated" = 0 AND followsgenerated != 0;
UPDATE "MomentScore" SET "notInterested" = notinterested WHERE "notInterested" = 0 AND notinterested != 0;
UPDATE "MomentScore" SET "seeMoreLikeThis" = seemorelikethis WHERE "seeMoreLikeThis" = 0 AND seemorelikethis != 0;
UPDATE "MomentScore" SET "avgWatchMs" = avgwatchms WHERE "avgWatchMs" = 0 AND avgwatchms != 0;
UPDATE "MomentScore" SET "replayRate" = replayrate WHERE "replayRate" = 0 AND replayrate != 0;
UPDATE "MomentScore" SET "quickSkipRate" = quickskiprate WHERE "quickSkipRate" = 0 AND quickskiprate != 0;
UPDATE "MomentScore" SET "audienceLevel" = audiencelevel WHERE "audienceLevel" = 0 AND audiencelevel != 0;
UPDATE "MomentScore" SET "lastCalculatedAt" = lastcalculatedat WHERE "lastCalculatedAt" IS NULL AND lastcalculatedat IS NOT NULL;

-- Supprimer les colonnes lowercase en double
ALTER TABLE "MomentScore" DROP COLUMN IF EXISTS viralscore;
ALTER TABLE "MomentScore" DROP COLUMN IF EXISTS localscore;
ALTER TABLE "MomentScore" DROP COLUMN IF EXISTS qualityscore;
ALTER TABLE "MomentScore" DROP COLUMN IF EXISTS safetyscore;
ALTER TABLE "MomentScore" DROP COLUMN IF EXISTS dmshares;
ALTER TABLE "MomentScore" DROP COLUMN IF EXISTS profileopens;
ALTER TABLE "MomentScore" DROP COLUMN IF EXISTS followsgenerated;
ALTER TABLE "MomentScore" DROP COLUMN IF EXISTS notinterested;
ALTER TABLE "MomentScore" DROP COLUMN IF EXISTS seemorelikethis;
ALTER TABLE "MomentScore" DROP COLUMN IF EXISTS avgwatchms;
ALTER TABLE "MomentScore" DROP COLUMN IF EXISTS replayrate;
ALTER TABLE "MomentScore" DROP COLUMN IF EXISTS quickskiprate;
ALTER TABLE "MomentScore" DROP COLUMN IF EXISTS audiencelevel;
ALTER TABLE "MomentScore" DROP COLUMN IF EXISTS lastcalculatedat;
ALTER TABLE "MomentScore" DROP COLUMN IF EXISTS createdat;
ALTER TABLE "MomentScore" DROP COLUMN IF EXISTS updatedat;

-- Renommer momentid → momentId (préserve les données)
DO $$ BEGIN
    ALTER TABLE "MomentScore" RENAME COLUMN momentid TO "momentId";
EXCEPTION
    WHEN undefined_column THEN null;
END $$;

-- Supprimer l'ancienne contrainte unique lowercase et en créer une nouvelle
ALTER TABLE "MomentScore" DROP CONSTRAINT IF EXISTS "MomentScore_momentid_key";
ALTER TABLE "MomentScore" ADD CONSTRAINT "MomentScore_momentId_key" UNIQUE ("momentId");

-- Ajouter l'index manquant audienceLevel
CREATE INDEX IF NOT EXISTS "MomentScore_audienceLevel_idx" ON "MomentScore"("audienceLevel");

-- =================================================================
-- SECTION 5 : Correction des colonnes lowerCamelCase dans UserQualityScore
-- =================================================================

-- Backfill : copier les données des colonnes lowercase vers camelCase
UPDATE "UserQualityScore" SET "reportsPenalty" = reportspenalty WHERE "reportsPenalty" = 0 AND reportspenalty != 0;
UPDATE "UserQualityScore" SET "creatorBoost" = creatorboost WHERE "creatorBoost" = 0 AND creatorboost != 0;
UPDATE "UserQualityScore" SET "lastCalculatedAt" = lastcalculatedat WHERE "lastCalculatedAt" IS NULL AND lastcalculatedat IS NOT NULL;

-- Supprimer les colonnes lowercase en double
ALTER TABLE "UserQualityScore" DROP COLUMN IF EXISTS reportspenalty;
ALTER TABLE "UserQualityScore" DROP COLUMN IF EXISTS creatorboost;
ALTER TABLE "UserQualityScore" DROP COLUMN IF EXISTS lastcalculatedat;
ALTER TABLE "UserQualityScore" DROP COLUMN IF EXISTS createdat;
ALTER TABLE "UserQualityScore" DROP COLUMN IF EXISTS updatedat;

-- Renommer userid → userId (préserve les données)
DO $$ BEGIN
    ALTER TABLE "UserQualityScore" RENAME COLUMN userid TO "userId";
EXCEPTION
    WHEN undefined_column THEN null;
END $$;

-- Supprimer l'ancienne contrainte unique lowercase et en créer une nouvelle
ALTER TABLE "UserQualityScore" DROP CONSTRAINT IF EXISTS "UserQualityScore_userid_key";
ALTER TABLE "UserQualityScore" ADD CONSTRAINT "UserQualityScore_userId_key" UNIQUE ("userId");

-- =================================================================
-- SECTION 6 : Contraintes de clés étrangères manquantes
-- =================================================================

-- FK: UserOutsideStatus → User (si manquant)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserOutsideStatus_userId_fkey') THEN
        ALTER TABLE "UserOutsideStatus" ADD CONSTRAINT "UserOutsideStatus_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FK: MomentEvent → Moment
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MomentEvent_momentId_fkey') THEN
        ALTER TABLE "MomentEvent" ADD CONSTRAINT "MomentEvent_momentId_fkey"
            FOREIGN KEY ("momentId") REFERENCES "Moment"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FK: MomentEvent → User
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MomentEvent_userId_fkey') THEN
        ALTER TABLE "MomentEvent" ADD CONSTRAINT "MomentEvent_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- FK: AudioTrack → User
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AudioTrack_ownerId_fkey') THEN
        ALTER TABLE "AudioTrack" ADD CONSTRAINT "AudioTrack_ownerId_fkey"
            FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- FK: Moment → AudioTrack
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Moment_audioTrackId_fkey') THEN
        ALTER TABLE "Moment" ADD CONSTRAINT "Moment_audioTrackId_fkey"
            FOREIGN KEY ("audioTrackId") REFERENCES "AudioTrack"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- FK: DirectMessageReaction → DirectMessage
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DirectMessageReaction_messageId_fkey') THEN
        ALTER TABLE "DirectMessageReaction" ADD CONSTRAINT "DirectMessageReaction_messageId_fkey"
            FOREIGN KEY ("messageId") REFERENCES "DirectMessage"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FK: DirectMessageReaction → User
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DirectMessageReaction_userId_fkey') THEN
        ALTER TABLE "DirectMessageReaction" ADD CONSTRAINT "DirectMessageReaction_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FK: SavedPlan → User
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SavedPlan_userId_fkey') THEN
        ALTER TABLE "SavedPlan" ADD CONSTRAINT "SavedPlan_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FK: SavedPlan → Plan
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SavedPlan_planId_fkey') THEN
        ALTER TABLE "SavedPlan" ADD CONSTRAINT "SavedPlan_planId_fkey"
            FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FK: PlanParticipantReview → Plan
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlanParticipantReview_planId_fkey') THEN
        ALTER TABLE "PlanParticipantReview" ADD CONSTRAINT "PlanParticipantReview_planId_fkey"
            FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FK: PlanParticipantReview → User (reviewer)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlanParticipantReview_reviewerId_fkey') THEN
        ALTER TABLE "PlanParticipantReview" ADD CONSTRAINT "PlanParticipantReview_reviewerId_fkey"
            FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FK: PlanParticipantReview → User (reviewed)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlanParticipantReview_reviewedUserId_fkey') THEN
        ALTER TABLE "PlanParticipantReview" ADD CONSTRAINT "PlanParticipantReview_reviewedUserId_fkey"
            FOREIGN KEY ("reviewedUserId") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FK: PlanReminder → User
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlanReminder_userId_fkey') THEN
        ALTER TABLE "PlanReminder" ADD CONSTRAINT "PlanReminder_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FK: PlanReminder → Plan
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlanReminder_planId_fkey') THEN
        ALTER TABLE "PlanReminder" ADD CONSTRAINT "PlanReminder_planId_fkey"
            FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FK: UserTrustProfile → User
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserTrustProfile_userId_fkey') THEN
        ALTER TABLE "UserTrustProfile" ADD CONSTRAINT "UserTrustProfile_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FK: ProVenue → User
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProVenue_ownerId_fkey') THEN
        ALTER TABLE "ProVenue" ADD CONSTRAINT "ProVenue_ownerId_fkey"
            FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FK: SafetyContact → User
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SafetyContact_userId_fkey') THEN
        ALTER TABLE "SafetyContact" ADD CONSTRAINT "SafetyContact_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FK: SafetyContact → trusted User
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SafetyContact_trustedUserId_fkey') THEN
        ALTER TABLE "SafetyContact" ADD CONSTRAINT "SafetyContact_trustedUserId_fkey"
            FOREIGN KEY ("trustedUserId") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FK: PlanSafetyShare → User (trusted)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlanSafetyShare_trustedUserId_fkey') THEN
        ALTER TABLE "PlanSafetyShare" ADD CONSTRAINT "PlanSafetyShare_trustedUserId_fkey"
            FOREIGN KEY ("trustedUserId") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FK: UserChallengeProgress → User
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserChallengeProgress_userId_fkey') THEN
        ALTER TABLE "UserChallengeProgress" ADD CONSTRAINT "UserChallengeProgress_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FK: UserCityMissionProgress → User
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserCityMissionProgress_userId_fkey') THEN
        ALTER TABLE "UserCityMissionProgress" ADD CONSTRAINT "UserCityMissionProgress_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FK: OnboardingProgress → User
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OnboardingProgress_userId_fkey') THEN
        ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FK: ReferralInvite → User (inviter)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReferralInvite_inviterId_fkey') THEN
        ALTER TABLE "ReferralInvite" ADD CONSTRAINT "ReferralInvite_inviterId_fkey"
            FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- FK: ReferralInvite → User (accepted)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReferralInvite_acceptedUserId_fkey') THEN
        ALTER TABLE "ReferralInvite" ADD CONSTRAINT "ReferralInvite_acceptedUserId_fkey"
            FOREIGN KEY ("acceptedUserId") REFERENCES "User"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- FK: DailyChallenge → DailyChallenge (none needed)
-- FK: CityMission → CityMission (none needed)
-- FK: OutsideTip → OutsideTip (none needed)
-- FK: OutsideDrop → OutsideDrop (none needed)

-- =================================================================
-- SECTION 7 : Index manquants sur les tables existantes
-- =================================================================

CREATE INDEX IF NOT EXISTS "Report_targetType_targetId_idx" ON "Report"("targetType", "targetId");

-- =================================================================
-- SECTION 8 : Marquer la migration 20240608 comme appliquée si elle existe
-- (elle a été créée sur feature/referrals mais pas sur main,
--  et son SQL est déjà couvert par 20240609_fix_missing_columns)
-- =================================================================
-- Note : on ne fait rien ici car le prisma migrate deploy s'en charge
-- automatiquement en fonction des fichiers présents.
