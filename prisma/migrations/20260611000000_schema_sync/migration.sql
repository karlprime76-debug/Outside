-- 20260611000000_schema_sync
-- Comprehensive schema sync: adds all missing tables, columns, enums.
-- All operations are idempotent (IF NOT EXISTS / DO EXCEPTION blocks).
-- Additive uniquement — risque zéro.

-- =================================================================
-- SECTION 1 : Missing columns on existing tables
-- (tables exist but need new columns)
-- =================================================================

-- DailyChallenge: type, targetValue, rewardPoints
ALTER TABLE "DailyChallenge" ADD COLUMN IF NOT EXISTS "type" "ChallengeType" NOT NULL DEFAULT 'CREATE_PLAN';
ALTER TABLE "DailyChallenge" ADD COLUMN IF NOT EXISTS "targetValue" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "DailyChallenge" ADD COLUMN IF NOT EXISTS "rewardPoints" INTEGER NOT NULL DEFAULT 10;

-- CityMission: type, targetValue, rewardPoints
ALTER TABLE "CityMission" ADD COLUMN IF NOT EXISTS "type" "ChallengeType" NOT NULL DEFAULT 'CREATE_PLAN';
ALTER TABLE "CityMission" ADD COLUMN IF NOT EXISTS "targetValue" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "CityMission" ADD COLUMN IF NOT EXISTS "rewardPoints" INTEGER NOT NULL DEFAULT 50;

-- UserChallengeProgress: currentValue, updatedAt
ALTER TABLE "UserChallengeProgress" ADD COLUMN IF NOT EXISTS "currentValue" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserChallengeProgress" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- UserCityMissionProgress: currentValue, updatedAt
ALTER TABLE "UserCityMissionProgress" ADD COLUMN IF NOT EXISTS "currentValue" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserCityMissionProgress" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- UserTripHistory: isPrivate
ALTER TABLE "UserTripHistory" ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN NOT NULL DEFAULT true;

-- Plan: isOfficial
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "isOfficial" BOOLEAN NOT NULL DEFAULT false;

-- User: stripeConnectId (unique), stripeOnboardingComplete
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeConnectId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false;

-- =================================================================
-- SECTION 2 : Missing enum values
-- =================================================================

ALTER TYPE "AccountKind" ADD VALUE IF NOT EXISTS 'PARTNER_VENUE';
ALTER TYPE "PlanPriceType" ADD VALUE IF NOT EXISTS 'TICKETED';
ALTER TYPE "MomentEventType" ADD VALUE IF NOT EXISTS 'HASHTAG_OPEN';
ALTER TYPE "MomentEventType" ADD VALUE IF NOT EXISTS 'HASHTAG_FOLLOW';
ALTER TYPE "MomentEventType" ADD VALUE IF NOT EXISTS 'HASHTAG_UNFOLLOW';
ALTER TYPE "ConversationType" ADD VALUE IF NOT EXISTS 'DIRECT';

Loaded Prisma config from "C:\Users\HP s\CascadeProjects\OUTSIDE\prisma.config.ts".
-- CreateEnum
DO $\$ BEGIN CREATE TYPE "UserRole" AS ENUM ('USER', 'PRO', 'ADMIN', 'MODERATOR'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "AccountKind" AS ENUM ('STANDARD', 'OFFICIAL_GUIDE', 'OFFICIAL_CITY', 'OFFICIAL_PARTNER', 'VERIFIED_CREATOR', 'PARTNER_VENUE'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'BLOCKED'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "NotificationType" AS ENUM ('FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'FOLLOW', 'PLAN_INVITE', 'PLAN_REMINDER', 'LIVE_STARTED', 'PRO_EVENT', 'PRO_APPROVED', 'BADGE_EARNED', 'SYSTEM', 'DM_MESSAGE', 'MOMENT_LIKE', 'MOMENT_COMMENT', 'DROP_AVAILABLE', 'MISSION_AVAILABLE', 'CHALLENGE_COMPLETED', 'PLAN_GROUP_MESSAGE', 'WEEKLY_RECAP_READY', 'AMBASSADOR_TO_DISCOVER', 'PLAN_REVIEW_PENDING', 'PLAN_CONFIRMED', 'NEW_PLAN', 'PLAN_JOINED'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "ChallengeType" AS ENUM ('CREATE_PLAN', 'JOIN_PLAN', 'POST_MOMENT', 'FOLLOW_FRIEND', 'ADD_FRIEND', 'CHECK_IN', 'VERIFY_PLAN', 'INVITE_REFERRAL', 'REACH_LEVEL', 'COMPLETE_PROFILE'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "AvailabilityMood" AS ENUM ('FOOD', 'CHILL', 'SPORT', 'MUSIC', 'OUT', 'STUDY', 'BUSINESS', 'TRAVEL'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "BudgetLevel" AS ENUM ('FREE', 'LOW', 'MEDIUM', 'PREMIUM'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "Mood" AS ENUM ('CHILL', 'FOOD', 'SPORT', 'PARTY', 'MUSIC', 'DATING', 'FRIENDS', 'STUDY', 'BUSINESS', 'CULTURE', 'TRAVEL', 'GAMING', 'FITNESS', 'DANCE', 'WALK', 'FREE', 'MEET_PEOPLE', 'CALM', 'TONIGHT', 'NOW'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "PlanVisibility" AS ENUM ('PUBLIC', 'FRIENDS', 'FRIENDS_OF_FRIENDS', 'CIRCLE', 'INVITE_ONLY', 'PRIVATE'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'FULL', 'CANCELLED', 'COMPLETED'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "OutsideStatusType" AS ENUM ('OUT_NOW', 'AVAILABLE', 'LOOKING_FOR_FOOD', 'LOOKING_FOR_CHILL', 'LOOKING_FOR_SPORT', 'LOOKING_FOR_MUSIC', 'DO_NOT_DISTURB'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "PlaceVibeSignalType" AS ENUM ('CALM', 'CROWDED', 'GOOD_MOOD', 'EXPENSIVE', 'FREE_ENTRY', 'SAFE', 'LOUD_MUSIC', 'GOOD_FOOD', 'BAD_MOOD'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "PlanInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "MomentType" AS ENUM ('PHOTO', 'VIDEO'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "MomentVisibility" AS ENUM ('PUBLIC', 'FRIENDS', 'PLAN_PARTICIPANTS', 'PRIVATE'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "ConversationType" AS ENUM ('DIRECT', 'GROUP', 'PLAN'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'DELETED'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "DirectMessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'MOMENT', 'PROFILE', 'PLAN', 'PLAN_INVITE', 'SYSTEM'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "DirectMessagePermission" AS ENUM ('FRIENDS_ONLY', 'FRIENDS_AND_FOLLOWING', 'EVERYONE'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "AudioSourceType" AS ENUM ('OUTSIDE_LIBRARY', 'USER_ORIGINAL', 'ARTIST_UPLOAD', 'MOMENT_ORIGINAL'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "AudioStatus" AS ENUM ('ACTIVE', 'PENDING_REVIEW', 'BLOCKED', 'DELETED'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "MomentEventType" AS ENUM ('IMPRESSION', 'VIEW', 'COMPLETE_VIEW', 'REPLAY', 'LIKE', 'UNLIKE', 'COMMENT', 'SHARE', 'SHARE_DM', 'SAVE', 'PROFILE_OPEN', 'FOLLOW_FROM_MOMENT', 'NOT_INTERESTED', 'SEE_MORE_LIKE_THIS', 'REPORT', 'HASHTAG_OPEN', 'HASHTAG_FOLLOW', 'HASHTAG_UNFOLLOW'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "PlaceCategory" AS ENUM ('RESTAURANT', 'CAFE', 'LOUNGE', 'MAQUIS', 'BEACH', 'GYM', 'CINEMA', 'CULTURE', 'SPORT', 'EVENT', 'SHOP', 'OTHER'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "PlanCategory" AS ENUM ('CHILL', 'FOOD', 'SPORT', 'MUSIC', 'SORTIE', 'CULTURE', 'BUSINESS', 'VOYAGE', 'ETUDES', 'AUTRE'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "PlanPriceType" AS ENUM ('FREE', 'PAID', 'FROM', 'TICKETED'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "SafetyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'OPEN', 'REVIEWING', 'REVIEWED', 'RESOLVED', 'REJECTED', 'DISMISSED'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "ReportReason" AS ENUM ('INAPPROPRIATE_CONTENT', 'HARASSMENT', 'SPAM', 'FAKE_PROFILE', 'DANGEROUS_PLAN', 'UNDERAGE', 'SCAM', 'VIOLENCE', 'HATE', 'SEXUAL_CONTENT', 'PRIVATE_INFO', 'COPYRIGHT', 'OTHER'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "ParticipantStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "PlanAttendanceStatus" AS ENUM ('GOING', 'MAYBE', 'LEFT'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "LiveStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED', 'REPORTED', 'BLOCKED'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "LiveVisibility" AS ENUM ('PUBLIC', 'CITY', 'PLAN_PARTICIPANTS', 'EVENT_ATTENDEES', 'PRIVATE'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "ProAccountStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "ProBusinessType" AS ENUM ('ORGANIZER', 'VENUE', 'BRAND', 'RESTAURANT_BAR', 'EVENT_AGENCY', 'PROMOTER', 'ARTIST_TEAM', 'OTHER'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'ENDED'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "EventVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'INVITE_ONLY'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "IdentityVerificationStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "VenueVerificationStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "PlanReviewStatus" AS ENUM ('PENDING', 'SUBMITTED', 'EXPIRED'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateEnum
DO $\$ BEGIN CREATE TYPE "TrustSignalType" AS ENUM ('PROFILE_PHOTO', 'EMAIL_VERIFIED', 'PHONE_VERIFIED', 'IDENTITY_VERIFIED', 'PLAN_ATTENDANCE', 'RESPECTFUL', 'REAL_PROFILE', 'REAL_PLAN'); EXCEPTION WHEN duplicate_object THEN null; END $\$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "User"
    "id" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "emailVerified" TIMESTAMP(3),
    "phone" TEXT,
    "phoneVerified" TIMESTAMP(3),
    "image" TEXT,
    "coverImage" TEXT,
    "bio" TEXT,
    "socialLinks" TEXT,
    "gender" "Gender",
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "accountKind" "AccountKind" NOT NULL DEFAULT 'STANDARD',
    "isDemoAccount" BOOLEAN NOT NULL DEFAULT false,
    "birthDate" TIMESTAMP(3),
    "isAdultConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedAt" TIMESTAMP(3),
    "privacyAcceptedAt" TIMESTAMP(3),
    "homeCityId" TEXT,
    "activeCityId" TEXT,
    "neighborhood" TEXT,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "preferredBudget" "BudgetLevel",
    "preferredMoods" "Mood"[],
    "country" TEXT,
    "countryCode" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "referralCode" TEXT,
    "isAmbassador" BOOLEAN NOT NULL DEFAULT false,
    "ambassadorCity" TEXT,
    "trustScore" INTEGER NOT NULL DEFAULT 0,
    "identityVerificationStatus" "IdentityVerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "travelModeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "stripeConnectId" TEXT,
    "stripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserSettings"
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileVisibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "showCityOnProfile" BOOLEAN NOT NULL DEFAULT true,
    "allowFriendRequests" BOOLEAN NOT NULL DEFAULT true,
    "directMessagePermission" "DirectMessagePermission" NOT NULL DEFAULT 'FRIENDS_ONLY',
    "allowFollowers" BOOLEAN NOT NULL DEFAULT true,
    "allowFriendSuggestions" BOOLEAN NOT NULL DEFAULT true,
    "privateDiscoveryMode" BOOLEAN NOT NULL DEFAULT false,
    "notificationFriendRequests" BOOLEAN NOT NULL DEFAULT true,
    "notificationPlanInvites" BOOLEAN NOT NULL DEFAULT true,
    "notificationPlanReminders" BOOLEAN NOT NULL DEFAULT true,
    "notificationLiveStarted" BOOLEAN NOT NULL DEFAULT true,
    "notificationCityLives" BOOLEAN NOT NULL DEFAULT true,
    "notificationProEvents" BOOLEAN NOT NULL DEFAULT true,
    "notificationMoments" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushDm" BOOLEAN NOT NULL DEFAULT true,
    "pushPlans" BOOLEAN NOT NULL DEFAULT true,
    "pushPlanReminders" BOOLEAN NOT NULL DEFAULT true,
    "pushMoments" BOOLEAN NOT NULL DEFAULT true,
    "pushLive" BOOLEAN NOT NULL DEFAULT true,
    "pushPro" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PushSubscription"
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Conversation"
    "id" TEXT NOT NULL,
    "type" "ConversationType" NOT NULL DEFAULT 'DIRECT',
    "planId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ConversationParticipant"
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),
    "mutedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "DirectMessage"
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT,
    "mediaUrl" TEXT,
    "mediaPath" TEXT,
    "mediaName" TEXT,
    "mediaMimeType" TEXT,
    "mediaSize" INTEGER,
    "type" "DirectMessageType" NOT NULL DEFAULT 'TEXT',
    "momentId" TEXT,
    "metadata" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "DirectMessageReaction"
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectMessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "City"
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Place"
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "PlaceCategory" NOT NULL,
    "cityId" TEXT NOT NULL,
    "neighborhood" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "priceLevel" "BudgetLevel",
    "openingHours" TEXT,
    "images" TEXT[],
    "isPartner" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "safetyLevel" "SafetyLevel" NOT NULL DEFAULT 'MEDIUM',
    "popularityScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlaceWishlist"
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaceWishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Plan"
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "planCategory" "PlanCategory" NOT NULL DEFAULT 'AUTRE',
    "mood" "Mood" NOT NULL,
    "budgetLevel" "BudgetLevel" NOT NULL DEFAULT 'MEDIUM',
    "budgetAmount" DECIMAL(65,30),
    "budgetCurrency" TEXT,
    "budgetIsFrom" BOOLEAN NOT NULL DEFAULT false,
    "priceType" "PlanPriceType" NOT NULL DEFAULT 'FREE',
    "estimatedCost" DOUBLE PRECISION,
    "cityId" TEXT NOT NULL,
    "countryCode" TEXT,
    "placeId" TEXT,
    "neighborhood" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "maxParticipants" INTEGER NOT NULL DEFAULT 10,
    "visibility" "PlanVisibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "isTravelerFriendly" BOOLEAN NOT NULL DEFAULT false,
    "safetyLevel" "SafetyLevel" NOT NULL DEFAULT 'MEDIUM',
    "rules" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "bookingUrl" TEXT,
    "circleId" TEXT,
    "ticketPrice" DOUBLE PRECISION,
    "stripeProductId" TEXT,
    "stripePriceId" TEXT,
    "isCommunityConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isExpress" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "recurrence" TEXT,
    "recurrenceEndDate" TIMESTAMP(3),
    "parentPlanId" TEXT,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlanInvitation"
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "PlanInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SavedPlan"
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlanParticipant"
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'PENDING',
    "attendance" "PlanAttendanceStatus" NOT NULL DEFAULT 'GOING',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedInAt" TIMESTAMP(3),
    "checkinPhotoUrl" TEXT,

    CONSTRAINT "PlanParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlanParticipantReview"
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanParticipantReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlanPoll"
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "multiple" BOOLEAN NOT NULL DEFAULT false,
    "endsAt" TIMESTAMP(3),
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanPoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlanPollOption"
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanPollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlanPollVote"
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanPollVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlanReminder"
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlanMessage"
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Moment"
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" "MomentType" NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "caption" TEXT,
    "city" TEXT,
    "countryCode" TEXT,
    "visibility" "MomentVisibility" NOT NULL DEFAULT 'PUBLIC',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "planId" TEXT,
    "placeId" TEXT,
    "eventId" TEXT,
    "liveId" TEXT,
    "audioTrackId" TEXT,
    "audioStartTime" INTEGER DEFAULT 0,
    "audioVolume" DOUBLE PRECISION DEFAULT 1,
    "mediaWidth" INTEGER,
    "mediaHeight" INTEGER,
    "mediaDuration" INTEGER,
    "mediaCrop" JSONB,
    "videoStartTime" INTEGER,
    "videoEndTime" INTEGER,
    "mediaAspectRatio" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Moment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AudioTrack"
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "title" TEXT NOT NULL,
    "artistName" TEXT,
    "sourceType" "AudioSourceType" NOT NULL DEFAULT 'USER_ORIGINAL',
    "status" "AudioStatus" NOT NULL DEFAULT 'ACTIVE',
    "audioUrl" TEXT NOT NULL,
    "audioPath" TEXT,
    "duration" INTEGER,
    "coverUrl" TEXT,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "isOriginal" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "rightsConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "rightsNote" TEXT,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AudioTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "MomentEvent"
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "MomentEventType" NOT NULL,
    "watchMs" INTEGER,
    "percent" DOUBLE PRECISION,
    "source" TEXT,
    "city" TEXT,
    "countryCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MomentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "MomentScore"
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "viralScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "localScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "safetyScore" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "replays" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "dmShares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "reports" INTEGER NOT NULL DEFAULT 0,
    "profileOpens" INTEGER NOT NULL DEFAULT 0,
    "followsGenerated" INTEGER NOT NULL DEFAULT 0,
    "notInterested" INTEGER NOT NULL DEFAULT 0,
    "seeMoreLikeThis" INTEGER NOT NULL DEFAULT 0,
    "avgWatchMs" INTEGER NOT NULL DEFAULT 0,
    "replayRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quickSkipRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "audienceLevel" INTEGER NOT NULL DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MomentScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserQualityScore"
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "trust" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reportsPenalty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creatorBoost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserQualityScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserTrustProfile"
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
    "lastCalculatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTrustProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "MomentReaction"
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '❤️',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MomentReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "MomentComment"
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MomentComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Badge"
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserBadge"
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Report"
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT,
    "planId" TEXT,
    "placeId" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserBlock"
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserVisitedCity"
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "firstVisitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVisitedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserVisitedCity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Friendship"
    "id" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "FriendRequest"
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "FriendRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Follow"
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Notification"
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "data" TEXT,
    "recipientId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorImage" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TrustReview"
    "id" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewedId" TEXT NOT NULL,
    "planId" TEXT,
    "wasPresent" BOOLEAN,
    "respectful" BOOLEAN,
    "realProfile" BOOLEAN,
    "realPlan" BOOLEAN,
    "goodVibe" BOOLEAN,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "IdentityVerification"
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "IdentityVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "fullName" TEXT,
    "documentType" TEXT,
    "documentPath" TEXT,
    "selfiePath" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentityVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TrustSignal"
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TrustSignalType" NOT NULL,
    "label" TEXT NOT NULL,
    "value" BOOLEAN NOT NULL DEFAULT true,
    "validatedByUserId" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Availability"
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mood" "AvailabilityMood" NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LiveSession"
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "LiveStatus" NOT NULL DEFAULT 'SCHEDULED',
    "visibility" "LiveVisibility" NOT NULL DEFAULT 'CITY',
    "city" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "hostId" TEXT NOT NULL,
    "planId" TEXT,
    "eventId" TEXT,
    "placeId" TEXT,
    "thumbnailUrl" TEXT,
    "streamProvider" TEXT,
    "streamKey" TEXT,
    "playbackUrl" TEXT,
    "livekitRoomName" TEXT,
    "viewerCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProAccount"
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessType" "ProBusinessType" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "city" TEXT,
    "addressLabel" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "socialMedia" JSONB,
    "documentUrl" TEXT,
    "category" TEXT,
    "status" "ProAccountStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAccountKind" "AccountKind",
    "verifiedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProVenue"
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProVenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProEvent"
    "id" TEXT NOT NULL,
    "proAccountId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "coverImageUrl" TEXT,
    "city" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "venueName" TEXT,
    "addressLabel" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "priceLabel" TEXT,
    "currency" TEXT,
    "ticketUrl" TEXT,
    "reservationUrl" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SafetyContact"
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trustedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlanSafetyShare"
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "trustedUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SHARED',
    "arrivedAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanSafetyShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserTripHistory"
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "countryCode" TEXT,
    "source" TEXT NOT NULL,
    "planId" TEXT,
    "eventId" TEXT,
    "momentId" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTripHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "OutingCircle"
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutingCircle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "OutingCircleMember"
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutingCircleMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserOutsideStatus"
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "OutsideStatusType" NOT NULL,
    "text" TEXT,
    "city" TEXT,
    "countryCode" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOutsideStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlaceVibeSignal"
    "id" TEXT NOT NULL,
    "placeId" TEXT,
    "userId" TEXT NOT NULL,
    "city" TEXT,
    "countryCode" TEXT,
    "type" "PlaceVibeSignalType" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaceVibeSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "DailyChallenge"
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "ChallengeType" NOT NULL DEFAULT 'CREATE_PLAN',
    "targetValue" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rewardLabel" TEXT NOT NULL,
    "rewardPoints" INTEGER NOT NULL DEFAULT 10,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserChallengeProgress"
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeKey" TEXT NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserChallengeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CityMission"
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "ChallengeType" NOT NULL DEFAULT 'CREATE_PLAN',
    "targetValue" INTEGER NOT NULL DEFAULT 5,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT,
    "rewardLabel" TEXT NOT NULL,
    "rewardPoints" INTEGER NOT NULL DEFAULT 50,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CityMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserCityMissionProgress"
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionKey" TEXT NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCityMissionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "OnboardingProgress"
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hasProfilePhoto" BOOLEAN NOT NULL DEFAULT false,
    "hasActiveCity" BOOLEAN NOT NULL DEFAULT false,
    "hasFollowedUsers" BOOLEAN NOT NULL DEFAULT false,
    "hasSavedPlan" BOOLEAN NOT NULL DEFAULT false,
    "hasViewedMoment" BOOLEAN NOT NULL DEFAULT false,
    "hasActivatedStatus" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "OutsideTip"
    "id" TEXT NOT NULL,
    "city" TEXT,
    "countryCode" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mood" "Mood",
    "actionLabel" TEXT NOT NULL,
    "actionUrl" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutsideTip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReferralInvite"
    "id" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "invitedEmail" TEXT,
    "invitedPhone" TEXT,
    "acceptedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "ReferralInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "OutsideDrop"
    "id" TEXT NOT NULL,
    "city" TEXT,
    "countryCode" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "targetUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutsideDrop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlanExpense"
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "paidById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlanExpenseShare"
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "settled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PlanExpenseShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Hashtag"
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "displayName" TEXT,
    "city" TEXT,
    "countryCode" TEXT,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "momentUsageCount" INTEGER NOT NULL DEFAULT 0,
    "planUsageCount" INTEGER NOT NULL DEFAULT 0,
    "trendingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "localTrendingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hashtag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "MomentHashtag"
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "hashtagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MomentHashtag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlanHashtag"
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "hashtagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanHashtag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserHashtagFollow"
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hashtagId" TEXT NOT NULL,
    "city" TEXT,
    "countryCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserHashtagFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RateLimit"
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "VerificationToken"
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PasswordResetToken"
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Ticket"
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scannedAt" TIMESTAMP(3),
    "scannedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeConnectId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_homeCityId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_activeCityId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_isAvailable_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_username_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_countryCode_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserSettings_userId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_userId_endpoint_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Conversation_updatedAt_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Conversation_planId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ConversationParticipant_userId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ConversationParticipant_conversationId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ConversationParticipant_conversationId_userId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DirectMessage_conversationId_createdAt_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DirectMessage_senderId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DirectMessage_momentId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DirectMessageReaction_messageId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DirectMessageReaction_userId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "DirectMessageReaction_messageId_userId_emoji_key" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "City_name_country_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Place_cityId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Place_category_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Place_isVisible_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlaceWishlist_userId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlaceWishlist_placeId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PlaceWishlist_userId_placeId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Plan_cityId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Plan_creatorId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Plan_status_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Plan_visibility_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Plan_mood_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Plan_planCategory_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Plan_startDate_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Plan_createdAt_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanInvitation_receiverId_status_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanInvitation_planId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PlanInvitation_planId_receiverId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SavedPlan_userId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SavedPlan_planId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SavedPlan_userId_planId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanParticipant_planId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanParticipant_userId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PlanParticipant_planId_userId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanParticipantReview_planId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanParticipantReview_reviewerId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanParticipantReview_reviewedUserId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PlanParticipantReview_planId_reviewerId_reviewedUserId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanPoll_planId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanPollOption_pollId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanPollVote_optionId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PlanPollVote_optionId_userId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanReminder_userId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanReminder_planId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanReminder_remindAt_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanReminder_sentAt_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanMessage_planId_createdAt_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanMessage_authorId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Moment_city_createdAt_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Moment_authorId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Moment_planId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Moment_placeId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Moment_createdAt_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Moment_visibility_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AudioTrack_ownerId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AudioTrack_status_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AudioTrack_sourceType_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AudioTrack_usageCount_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MomentEvent_momentId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MomentEvent_userId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MomentEvent_type_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MomentEvent_createdAt_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MomentScore_momentId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MomentScore_score_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MomentScore_viralScore_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MomentScore_localScore_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MomentScore_audienceLevel_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MomentScore_updatedAt_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserQualityScore_userId_key" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserTrustProfile_userId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MomentReaction_momentId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MomentReaction_userId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MomentReaction_momentId_userId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MomentComment_momentId_createdAt_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MomentComment_userId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Badge_key_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserBadge_userId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserBadge_userId_badgeId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Report_reporterId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Report_targetType_targetId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Report_status_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserBlock_blockerId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserBlock_blockedId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserBlock_blockerId_blockedId_key" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserVisitedCity_userId_cityId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Friendship_initiatorId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Friendship_receiverId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Friendship_initiatorId_receiverId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FriendRequest_receiverId_status_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FriendRequest_senderId_status_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "FriendRequest_senderId_receiverId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Follow_followerId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Follow_followingId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Follow_followerId_followingId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_recipientId_isRead_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TrustReview_reviewedId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TrustReview_reviewerId_reviewedId_planId_key" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "IdentityVerification_userId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TrustSignal_userId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TrustSignal_type_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Availability_city_isActive_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Availability_userId_isActive_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LiveSession_hostId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LiveSession_status_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LiveSession_city_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LiveSession_createdAt_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ProAccount_userId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProAccount_userId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProAccount_status_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProAccount_city_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProVenue_ownerId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProVenue_city_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProVenue_status_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProEvent_proAccountId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProEvent_status_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProEvent_city_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProEvent_startsAt_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SafetyContact_userId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SafetyContact_trustedUserId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SafetyContact_userId_trustedUserId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanSafetyShare_userId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanSafetyShare_planId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanSafetyShare_trustedUserId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserTripHistory_userId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserTripHistory_city_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserTripHistory_createdAt_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OutingCircle_ownerId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OutingCircleMember_circleId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OutingCircleMember_userId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "OutingCircleMember_circleId_userId_key" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserOutsideStatus_userId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserOutsideStatus_city_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserOutsideStatus_expiresAt_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlaceVibeSignal_placeId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlaceVibeSignal_city_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlaceVibeSignal_createdAt_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "DailyChallenge_key_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DailyChallenge_key_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DailyChallenge_active_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserChallengeProgress_userId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserChallengeProgress_challengeKey_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserChallengeProgress_userId_challengeKey_key" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CityMission_key_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CityMission_key_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CityMission_city_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CityMission_active_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserCityMissionProgress_userId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserCityMissionProgress_missionKey_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserCityMissionProgress_userId_missionKey_key" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "OnboardingProgress_userId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OnboardingProgress_userId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OutsideTip_city_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OutsideTip_countryCode_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OutsideTip_active_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ReferralInvite_code_key" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ReferralInvite_acceptedUserId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReferralInvite_inviterId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReferralInvite_code_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReferralInvite_acceptedUserId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OutsideDrop_city_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OutsideDrop_countryCode_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OutsideDrop_active_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OutsideDrop_type_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanExpense_planId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanExpenseShare_expenseId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PlanExpenseShare_expenseId_userId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Hashtag_tag_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Hashtag_city_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Hashtag_countryCode_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Hashtag_isOfficial_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Hashtag_trendingScore_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Hashtag_localTrendingScore_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Hashtag_tag_city_countryCode_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MomentHashtag_momentId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MomentHashtag_hashtagId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MomentHashtag_momentId_hashtagId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanHashtag_planId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanHashtag_hashtagId_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PlanHashtag_planId_hashtagId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserHashtagFollow_userId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserHashtagFollow_hashtagId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserHashtagFollow_city_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserHashtagFollow_userId_hashtagId_key" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "RateLimit_identifier_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RateLimit_identifier_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RateLimit_resetAt_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PasswordResetToken_email_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PasswordResetToken_token_idx" ON

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Ticket_stripeSessionId_key" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Ticket_planId_idx" ON

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Ticket_userId_idx" ON

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_homeCityId_fkey" FOREIGN KEY ("homeCityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeCityId_fkey" FOREIGN KEY ("activeCityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessageReaction" ADD CONSTRAINT "DirectMessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "DirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessageReaction" ADD CONSTRAINT "DirectMessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceWishlist" ADD CONSTRAINT "PlaceWishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceWishlist" ADD CONSTRAINT "PlaceWishlist_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "OutingCircle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_parentPlanId_fkey" FOREIGN KEY ("parentPlanId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanInvitation" ADD CONSTRAINT "PlanInvitation_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanInvitation" ADD CONSTRAINT "PlanInvitation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanInvitation" ADD CONSTRAINT "PlanInvitation_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPlan" ADD CONSTRAINT "SavedPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPlan" ADD CONSTRAINT "SavedPlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanParticipant" ADD CONSTRAINT "PlanParticipant_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanParticipant" ADD CONSTRAINT "PlanParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanParticipantReview" ADD CONSTRAINT "PlanParticipantReview_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanParticipantReview" ADD CONSTRAINT "PlanParticipantReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanParticipantReview" ADD CONSTRAINT "PlanParticipantReview_reviewedUserId_fkey" FOREIGN KEY ("reviewedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanPoll" ADD CONSTRAINT "PlanPoll_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanPollOption" ADD CONSTRAINT "PlanPollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "PlanPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanPollVote" ADD CONSTRAINT "PlanPollVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "PlanPollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanReminder" ADD CONSTRAINT "PlanReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanReminder" ADD CONSTRAINT "PlanReminder_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanMessage" ADD CONSTRAINT "PlanMessage_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanMessage" ADD CONSTRAINT "PlanMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Moment" ADD CONSTRAINT "Moment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Moment" ADD CONSTRAINT "Moment_audioTrackId_fkey" FOREIGN KEY ("audioTrackId") REFERENCES "AudioTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioTrack" ADD CONSTRAINT "AudioTrack_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTrustProfile" ADD CONSTRAINT "UserTrustProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MomentReaction" ADD CONSTRAINT "MomentReaction_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MomentReaction" ADD CONSTRAINT "MomentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MomentComment" ADD CONSTRAINT "MomentComment_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MomentComment" ADD CONSTRAINT "MomentComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVisitedCity" ADD CONSTRAINT "UserVisitedCity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVisitedCity" ADD CONSTRAINT "UserVisitedCity_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustReview" ADD CONSTRAINT "TrustReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustReview" ADD CONSTRAINT "TrustReview_reviewedId_fkey" FOREIGN KEY ("reviewedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityVerification" ADD CONSTRAINT "IdentityVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustSignal" ADD CONSTRAINT "TrustSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProAccount" ADD CONSTRAINT "ProAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProVenue" ADD CONSTRAINT "ProVenue_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProEvent" ADD CONSTRAINT "ProEvent_proAccountId_fkey" FOREIGN KEY ("proAccountId") REFERENCES "ProAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyContact" ADD CONSTRAINT "SafetyContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyContact" ADD CONSTRAINT "SafetyContact_trustedUserId_fkey" FOREIGN KEY ("trustedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSafetyShare" ADD CONSTRAINT "PlanSafetyShare_trustedUserId_fkey" FOREIGN KEY ("trustedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutingCircle" ADD CONSTRAINT "OutingCircle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutingCircleMember" ADD CONSTRAINT "OutingCircleMember_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "OutingCircle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutingCircleMember" ADD CONSTRAINT "OutingCircleMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOutsideStatus" ADD CONSTRAINT "UserOutsideStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChallengeProgress" ADD CONSTRAINT "UserChallengeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCityMissionProgress" ADD CONSTRAINT "UserCityMissionProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralInvite" ADD CONSTRAINT "ReferralInvite_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralInvite" ADD CONSTRAINT "ReferralInvite_acceptedUserId_fkey" FOREIGN KEY ("acceptedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanExpense" ADD CONSTRAINT "PlanExpense_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanExpense" ADD CONSTRAINT "PlanExpense_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanExpenseShare" ADD CONSTRAINT "PlanExpenseShare_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "PlanExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanExpenseShare" ADD CONSTRAINT "PlanExpenseShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MomentHashtag" ADD CONSTRAINT "MomentHashtag_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MomentHashtag" ADD CONSTRAINT "MomentHashtag_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "Hashtag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanHashtag" ADD CONSTRAINT "PlanHashtag_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanHashtag" ADD CONSTRAINT "PlanHashtag_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "Hashtag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHashtagFollow" ADD CONSTRAINT "UserHashtagFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHashtagFollow" ADD CONSTRAINT "UserHashtagFollow_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "Hashtag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

