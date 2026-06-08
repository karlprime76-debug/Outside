-- Create missing enums idempotently
DO $$ BEGIN
    CREATE TYPE "OutsideStatusType" AS ENUM ('OUT_NOW', 'AVAILABLE', 'LOOKING_FOR_FOOD', 'LOOKING_FOR_CHILL', 'LOOKING_FOR_SPORT', 'LOOKING_FOR_MUSIC', 'DO_NOT_DISTURB');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MomentEventType" AS ENUM ('IMPRESSION', 'VIEW', 'COMPLETE_VIEW', 'REPLAY', 'LIKE', 'UNLIKE', 'COMMENT', 'SHARE', 'SHARE_DM', 'SAVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AudioSourceType" AS ENUM ('OUTSIDE_LIBRARY', 'USER_ORIGINAL', 'ARTIST_UPLOAD', 'MOMENT_ORIGINAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AudioStatus" AS ENUM ('ACTIVE', 'PENDING_REVIEW', 'BLOCKED', 'DELETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create UserOutsideStatus table
CREATE TABLE IF NOT EXISTS "UserOutsideStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "OutsideStatusType" NOT NULL,
    "text" TEXT,
    "city" TEXT,
    "countryCode" TEXT,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserOutsideStatus_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserOutsideStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "UserOutsideStatus_userId_key" UNIQUE ("userId")
);

CREATE INDEX IF NOT EXISTS "UserOutsideStatus_city_idx" ON "UserOutsideStatus"("city");
CREATE INDEX IF NOT EXISTS "UserOutsideStatus_expiresAt_idx" ON "UserOutsideStatus"("expiresAt");

-- Create MomentEvent table
CREATE TABLE IF NOT EXISTS "MomentEvent" (
    "id" TEXT NOT NULL,
    "momentId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "MomentEventType" NOT NULL,
    "watchMs" INTEGER,
    "percent" DOUBLE PRECISION,
    "source" TEXT,
    "city" TEXT,
    "countryCode" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MomentEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MomentEvent_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "Moment"("id") ON DELETE CASCADE,
    CONSTRAINT "MomentEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "MomentEvent_momentId_idx" ON "MomentEvent"("momentId");
CREATE INDEX IF NOT EXISTS "MomentEvent_userId_idx" ON "MomentEvent"("userId");
CREATE INDEX IF NOT EXISTS "MomentEvent_type_idx" ON "MomentEvent"("type");
CREATE INDEX IF NOT EXISTS "MomentEvent_createdAt_idx" ON "MomentEvent"("createdAt");

-- Create AudioTrack table
CREATE TABLE IF NOT EXISTS "AudioTrack" (
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
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AudioTrack_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AudioTrack_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "AudioTrack_ownerId_idx" ON "AudioTrack"("ownerId");
CREATE INDEX IF NOT EXISTS "AudioTrack_status_idx" ON "AudioTrack"("status");
CREATE INDEX IF NOT EXISTS "AudioTrack_sourceType_idx" ON "AudioTrack"("sourceType");
CREATE INDEX IF NOT EXISTS "AudioTrack_usageCount_idx" ON "AudioTrack"("usageCount");

-- Add mediaPath column to DirectMessage
ALTER TABLE "DirectMessage" ADD COLUMN IF NOT EXISTS "mediaPath" TEXT;

-- Add audioTrackId and audio columns to Moment
ALTER TABLE "Moment" ADD COLUMN IF NOT EXISTS "audioTrackId" TEXT;
ALTER TABLE "Moment" ADD COLUMN IF NOT EXISTS "audioStartTime" INTEGER DEFAULT 0;
ALTER TABLE "Moment" ADD COLUMN IF NOT EXISTS "audioVolume" DOUBLE PRECISION DEFAULT 1;

-- Add FK for Moment.audioTrackId idempotently
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Moment_audioTrackId_fkey'
    ) THEN
        ALTER TABLE "Moment" ADD CONSTRAINT "Moment_audioTrackId_fkey"
            FOREIGN KEY ("audioTrackId") REFERENCES "AudioTrack"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- Add isCommunityConfirmed column to Plan
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "isCommunityConfirmed" BOOLEAN NOT NULL DEFAULT false;
