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
