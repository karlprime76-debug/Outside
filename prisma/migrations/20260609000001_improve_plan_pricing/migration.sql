-- CreateEnum
CREATE TYPE "PlanPriceType" AS ENUM ('FREE', 'PAID', 'FROM');

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN "priceType" "PlanPriceType" NOT NULL DEFAULT 'FREE';

-- Backfill existing rows with computed priceType
UPDATE "Plan"
SET "priceType" = 'FREE'
WHERE "budgetLevel" = 'FREE' OR "budgetAmount" IS NULL OR "budgetAmount" = 0;

UPDATE "Plan"
SET "priceType" = 'FROM'
WHERE "budgetIsFrom" = true AND ("budgetLevel" != 'FREE' OR "budgetLevel" IS NULL);

-- Remaining rows are PAID
UPDATE "Plan"
SET "priceType" = 'PAID'
WHERE "priceType" = 'FREE' AND ("budgetLevel" != 'FREE' AND "budgetAmount" IS NOT NULL AND "budgetAmount" != 0);
