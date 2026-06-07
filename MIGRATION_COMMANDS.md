# Production Migration for referralCode

## Problem
The column `User.referralCode` does not exist in the production database, causing API routes to fail with 500 errors.

## Solution
A manual migration has been created to add the `referralCode` column to the User table.

## Migration File
`prisma/migrations/20240607_add_referral_code/migration.sql`

## Production Migration Command

### Option 1: Using psql directly
```bash
psql $DATABASE_URL -f prisma/migrations/20240607_add_referral_code/migration.sql
```

### Option 2: Using Prisma migrate (if migrations are tracked)
```bash
npx prisma migrate deploy
```

### Option 3: Using Supabase SQL Editor
Copy and paste this SQL into your Supabase SQL Editor:

```sql
-- Add referralCode column to User table
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;

-- Add unique constraint on referralCode
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
```

## Verification
After applying the migration, verify that the column exists:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'referralCode';
```

## Expected Result
- Column `referralCode` should exist with type `text`
- Should be nullable (is_nullable = YES)
- Should have a unique index

## API Routes to Test After Migration
- /api/auth/me
- /api/onboarding
- /api/places
- /api/plans
- /api/moments
- /api/availability

These should no longer return 500 errors after the migration is applied.
