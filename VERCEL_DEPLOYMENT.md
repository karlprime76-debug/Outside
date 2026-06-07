# Vercel Deployment Guide - OUTSIDE

## Problem: Error on /home page

The error "Oups, une erreur est survenue" on `https://outside-tau.vercel.app/home` is likely caused by missing environment variables on Vercel.

## Required Environment Variables

Configure these in your Vercel project settings (Settings > Environment Variables):

### Database (Required)
```
DATABASE_URL=postgresql://user:password@host:5432/postgres
DIRECT_URL=postgresql://user:password@host:5432/postgres
```

### NextAuth (Required - CRITICAL)
```
NEXTAUTH_URL=https://outside-tau.vercel.app
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production
```

**IMPORTANT**: `NEXTAUTH_URL` must be set to your production URL, NOT localhost.

### App Configuration
```
APP_URL=https://outside-tau.vercel.app
NODE_ENV=production
```

### Supabase (Required if using Supabase)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### LiveKit (Required if using LiveKit)
```
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
```

### Optional
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DEMO_GLOBAL_VISIBILITY=false
```

## Steps to Fix

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add all the required variables above
4. Redeploy your application

## Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Database Setup

Make sure your PostgreSQL database is accessible from Vercel:
1. Use a managed database (Neon, Supabase, Railway, etc.)
2. Ensure the DATABASE_URL allows external connections
3. Run migrations: `npm run db:migrate`

## Verification

After setting environment variables:
1. Trigger a new deployment on Vercel
2. Check the deployment logs for any errors
3. Test the /home page

## Common Issues

- **NEXTAUTH_URL mismatch**: Ensure it matches your Vercel domain exactly
- **Database connection**: Verify DATABASE_URL is correct and database allows external connections
- **Missing secrets**: All secrets must be set, especially NEXTAUTH_SECRET
