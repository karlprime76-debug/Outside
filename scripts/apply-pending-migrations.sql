-- Run this in Supabase SQL Editor (Dashboard > SQL > New query)
-- Idempotent: safe to run multiple times.
-- Fixes: User.lastActiveDate, currentStreak, longestStreak, Plan.priceType

-- 20260609000000_add_streak_fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActiveDate" TIMESTAMPTZ;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "currentStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "longestStreak" INTEGER NOT NULL DEFAULT 0;

-- 20260609000001_improve_plan_pricing
DO $$ BEGIN
    CREATE TYPE "PlanPriceType" AS ENUM ('FREE', 'PAID', 'FROM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "priceType" "PlanPriceType" NOT NULL DEFAULT 'FREE';

UPDATE "Plan"
SET "priceType" = 'FREE'
WHERE "budgetLevel" = 'FREE' OR "budgetAmount" IS NULL OR "budgetAmount" = 0;

UPDATE "Plan"
SET "priceType" = 'FROM'
WHERE "budgetIsFrom" = true AND ("budgetLevel" != 'FREE' OR "budgetLevel" IS NULL);

UPDATE "Plan"
SET "priceType" = 'PAID'
WHERE "priceType" = 'FREE' AND ("budgetLevel" != 'FREE' AND "budgetAmount" IS NOT NULL AND "budgetAmount" != 0);

-- Mark migrations as applied (skip if already recorded)
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
SELECT gen_random_uuid()::text, '', NOW(), '20260609000000_add_streak_fields', NULL, NULL, NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20260609000000_add_streak_fields');

INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
SELECT gen_random_uuid()::text, '', NOW(), '20260609000001_improve_plan_pricing', NULL, NULL, NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20260609000001_improve_plan_pricing');
