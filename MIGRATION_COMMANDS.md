# Production Migration for Missing Database Columns

## Problem
The production database is missing several columns that exist in the Prisma schema, causing API routes to fail with 500 errors:
- `User.referralCode` - causes all routes touching User to crash
- `MomentScore.audienceLevel` and `MomentScore.lastCalculatedAt` - causes /api/moments to crash
- `UserQualityScore` columns - causes feed builder to crash

## Solution
A manual migration has been created to add all missing columns to the production database.

## Migration File
`prisma/migrations/20240607_add_referral_code/migration.sql`

## Complete Production Migration SQL

**Execute this SQL in your Supabase SQL Editor:**

```sql
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
```

## Steps to Apply

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Create a new query

2. **Paste and Execute**
   - Copy the SQL above
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Verify**
   - Check that the query executed successfully
   - No errors should appear

## Verification Queries

After applying the migration, verify the columns exist:

```sql
-- Check User.referralCode
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'referralCode';

-- Check MomentScore columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'MomentScore' AND column_name IN ('audienceLevel', 'lastCalculatedAt');

-- Check UserQualityScore columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'UserQualityScore' AND column_name IN ('score', 'trust', 'activity', 'reportsPenalty', 'creatorBoost', 'lastCalculatedAt');
```

## Expected Results
- All columns should exist with correct data types
- No errors should appear
- API routes should no longer return 500 errors

## API Routes to Test After Migration
- /api/auth/me
- /api/onboarding
- /api/places
- /api/plans
- /api/moments
- /api/availability

These should no longer return 500 errors after the migration is applied.

## Important Notes
- The migration uses `IF NOT EXISTS` to avoid errors if columns already exist
- This migration is safe to run multiple times
- No data will be deleted or modified
- Vercel deployment will not apply this migration automatically - it must be run manually in Supabase
