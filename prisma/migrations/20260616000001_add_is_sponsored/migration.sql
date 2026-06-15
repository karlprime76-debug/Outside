-- 20260616000001_add_is_sponsored
-- Adds isSponsored column to Moment table for sponsored content

ALTER TABLE "Moment" ADD COLUMN IF NOT EXISTS "isSponsored" BOOLEAN NOT NULL DEFAULT false;
