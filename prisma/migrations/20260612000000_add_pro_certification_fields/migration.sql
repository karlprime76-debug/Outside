-- 20260612000000_add_pro_certification_fields
-- Adds ProCertificationStatus enum and certification columns to ProAccount

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ProCertificationStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add certification columns to ProAccount
ALTER TABLE "ProAccount" ADD COLUMN IF NOT EXISTS "certificationStatus" "ProCertificationStatus" NOT NULL DEFAULT 'NOT_REQUESTED';
ALTER TABLE "ProAccount" ADD COLUMN IF NOT EXISTS "certificationRequestedAt" TIMESTAMP(3);
ALTER TABLE "ProAccount" ADD COLUMN IF NOT EXISTS "certificationReviewedAt" TIMESTAMP(3);
