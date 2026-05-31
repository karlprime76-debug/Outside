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
# Edit .env.local with your DATABASE_URL and NEXTAUTH_SECRET

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
