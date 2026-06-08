-- Create AccountKind enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "AccountKind" AS ENUM ('STANDARD', 'OFFICIAL_GUIDE', 'OFFICIAL_CITY', 'OFFICIAL_PARTNER', 'VERIFIED_CREATOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add accountKind column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountKind" "AccountKind" NOT NULL DEFAULT 'STANDARD';
