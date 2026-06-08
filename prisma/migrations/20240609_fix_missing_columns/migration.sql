-- Create AccountKind enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "AccountKind" AS ENUM ('STANDARD', 'OFFICIAL_GUIDE', 'OFFICIAL_CITY', 'OFFICIAL_PARTNER', 'VERIFIED_CREATOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add accountKind column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountKind" "AccountKind" NOT NULL DEFAULT 'STANDARD';

-- Add isAmbassador column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAmbassador" BOOLEAN NOT NULL DEFAULT false;

-- Add ambassadorCity column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ambassadorCity" TEXT;

-- Add trustScore column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trustScore" INTEGER NOT NULL DEFAULT 0;

-- Add identityVerificationStatus column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "identityVerificationStatus" "IdentityVerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED';