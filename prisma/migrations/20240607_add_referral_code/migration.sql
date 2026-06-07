-- Add referralCode column to User table
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;

-- Add unique constraint on referralCode
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
