# OUTSIDE

The world is outside. Find what is happening around you. Right now.

## Tech Stack

- Next.js 15 + App Router
- React 18 + TypeScript
- Tailwind CSS 3
- Prisma + PostgreSQL
- NextAuth.js (v5 beta)
- Zod validation

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your DATABASE_URL, NEXTAUTH_SECRET, and other environment variables
DATABASE_URL="postgresql://user:password@host:5432/postgres"
DIRECT_URL="postgresql://user:password@host:5432/postgres"

# NextAuth
# En local : http://localhost:3000
# En production Vercel : https://outside-tau.vercel.app
NEXTAUTH_URL="http://localhost:3000"

# Générer avec : node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"

# OAuth (optional - configure in production)
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=

# App
APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Cron jobs
# Générer avec : node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CRON_SECRET="your-cron-secret-change-this-in-production"

# Demo / seed visibility
# Mettre à "true" uniquement pour rendre les données demo visibles globalement.
DEMO_GLOBAL_VISIBILITY="false"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
# SUPABASE_SERVICE_ROLE_KEY est uniquement côté serveur. Ne jamais l'utiliser dans un composant client.
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# LiveKit
# LIVEKIT_API_SECRET est serveur uniquement. Ne jamais l'utiliser dans un composant client.
LIVEKIT_API_KEY="your-livekit-api-key"
LIVEKIT_API_SECRET="your-livekit-api-secret"
NEXT_PUBLIC_LIVEKIT_URL="wss://your-project.livekit.cloud"
# Fallback serveur optionnel si différent de NEXT_PUBLIC_LIVEKIT_URL
LIVEKIT_URL="wss://your-project.livekit.cloud"

# Web Push / PWA notifications
# Générer les clés VAPID avec un script ou npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_SUBJECT="mailto:contact@outside.app"

# 3. Generate Prisma client
npm run db:generate

# 4. Run migrations
npm run db:migrate

# 5. Seed cities
npm run db:seed

# 6. Start dev server
npm run dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed cities data |

## Features

- **Auth**: Register, login, session with NextAuth
- **Onboarding**: Bio, neighborhood, budget, moods, language
- **Plans**: Create, join, leave, filter by mood/budget/city
- **Places**: Browse places by category, view upcoming plans
- **Passport**: Travel mode, city switching
- **Admin**: Stats dashboard (users, plans, places, reports)
- **Reports**: User and plan reporting system
- **Security**: Role-based access, ownership checks, plan visibility

## Project Structure

```
src/
  app/            # Next.js App Router
    (app)/        # Authenticated routes
    (auth)/       # Public auth routes
    admin/        # Admin dashboard
    api/          # API routes
  components/     # React components
  lib/            # Utils, auth, db, validation
  hooks/          # Custom hooks
  types/          # Shared types
docs/             # Documentation
prisma/
  schema.prisma   # Database schema
  seed.ts         # Seed data
```
# Outside
