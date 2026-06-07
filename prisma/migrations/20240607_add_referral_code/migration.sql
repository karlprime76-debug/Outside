-- Add referralCode column to User table
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "referralCode" TEXT;

-- Add unique constraint on referralCode
CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key"
ON "User"("referralCode");
