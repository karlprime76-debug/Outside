-- Add referralCode column to User table
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "referralCode" TEXT;

-- Add unique constraint on referralCode
CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key"
ON "User"("referralCode");

-- Add audienceLevel column to MomentScore table if missing
ALTER TABLE "MomentScore"
ADD COLUMN IF NOT EXISTS "audienceLevel" INTEGER DEFAULT 0;

-- Add lastCalculatedAt column to MomentScore table if missing
ALTER TABLE "MomentScore"
ADD COLUMN IF NOT EXISTS "lastCalculatedAt" TIMESTAMP;

-- Add score column to UserQualityScore table if missing
ALTER TABLE "UserQualityScore"
ADD COLUMN IF NOT EXISTS "score" REAL DEFAULT 50;

-- Add trust column to UserQualityScore table if missing
ALTER TABLE "UserQualityScore"
ADD COLUMN IF NOT EXISTS "trust" REAL DEFAULT 0;

-- Add activity column to UserQualityScore table if missing
ALTER TABLE "UserQualityScore"
ADD COLUMN IF NOT EXISTS "activity" REAL DEFAULT 0;

-- Add reportsPenalty column to UserQualityScore table if missing
ALTER TABLE "UserQualityScore"
ADD COLUMN IF NOT EXISTS "reportsPenalty" REAL DEFAULT 0;

-- Add creatorBoost column to UserQualityScore table if missing
ALTER TABLE "UserQualityScore"
ADD COLUMN IF NOT EXISTS "creatorBoost" REAL DEFAULT 0;

-- Add lastCalculatedAt column to UserQualityScore table if missing
ALTER TABLE "UserQualityScore"
ADD COLUMN IF NOT EXISTS "lastCalculatedAt" TIMESTAMP;
