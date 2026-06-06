# Status: OUTSIDE Retention Engine Implementation

## ✅ Already Implemented

### Models (Schema)
- ✅ UserBadge + Badge
- ✅ DailyChallenge + UserChallengeProgress
- ✅ CityMission + UserCityMissionProgress
- ✅ OutsideDrop
- ✅ OutsideTip
- ✅ ReferralInvite
- ✅ Conversation with type PLAN
- ✅ User.accountKind + User.isAmbassador

### APIs
- ✅ GET /api/home/drops - Drops retrieval + grouping
- ✅ GET /api/challenges/daily - Challenges + progress tracking
- ✅ POST /api/challenges/daily - Complete challenge + badge award logic
- ✅ GET /api/missions/city - Missions + progress tracking
- ✅ POST /api/missions/city - Complete mission

### Seeders
- ✅ seed-retention.ts - Drops, Challenges, Missions, Tips
- ✅ seed-founder-badges.ts - 5 badges (FOUNDER_MEMBER, FIRST_CREATOR, FIRST_ORGANIZER, CITY_AMBASSADOR, CIRCLE_LAUNCHED)
- ✅ seed-official-accounts.ts - 7 official accounts + badges

### Components
- ✅ OutsideDrops component
- ✅ DailyChallenges component
- ✅ CityMissions component
- ✅ OnboardingChecklist component
- ✅ TonightSection component

### Home Page
- ✅ Integrated OutsideDrops, DailyChallenges, CityMissions, TonightSection

---

## 🔨 TODO: Phase-by-Phase Implementation Plan

### PHASE 2: Programme Fondateurs - COMPLETION
- [ ] Add automatic badge assignment logic in:
  - First moment published → FIRST_CREATOR badge
  - First plan created → FIRST_ORGANIZER badge
  - Referral invite accepted → CIRCLE_LAUNCHED badge (need 5 referrals)
  - Ambassador status → CITY_AMBASSADOR badge
- [ ] Create badge display component (avatar with badge overlay)
- [ ] Show badges on: profile, passeport, user cards, comments
- [ ] Update seeder to ensure all founder users get FOUNDER_MEMBER badge

### PHASE 3: OUTSIDE Drops - COMPLETION
- [ ] Enhance seed-retention.ts with city-specific and country-specific drops
- [ ] Implement drop types:
  - plan_tonight → /tonight
  - discover_accounts → /friends
  - challenge_today → /moments/new
  - place_test → /places
  - moment_trending → /moments
  - plan_free → /plans?budget=FREE
  - idea_official → /discover
- [ ] Create admin API for managing drops
- [ ] Add error handling if drops fail to load (Home shouldn't break)

### PHASE 4: Missions & Challenges - DATA POPULATION
- [ ] Verify all challenges exist:
  - publish_first_moment
  - follow_3_accounts
  - save_plan
  - create_express_plan
  - activate_availability
  - invite_friend
  - add_profile_photo
- [ ] Populate city missions (per city):
  - publish_moment_at_city
  - create_free_plan
  - discover_3_local_accounts
  - signal_place_vibe
  - join_plan_this_week
  - invite_circle_to_app
- [ ] Seeder should be idempotent (upsert not create)

### PHASE 5: Ambassadors - DISPLAY & MANAGEMENT
- [ ] Create page: /ambassadors or /city/[city]/ambassadors
- [ ] Filter: User where isAmbassador=true + accountKind matches official
- [ ] Show ambassador cards with:
  - Profile photo
  - Name
  - City/Badge
  - Bio
  - Follow button
- [ ] Admin API: POST /api/admin/ambassadors/{userId}/assign

### PHASE 6: Starter Pack - NEW API
- [ ] GET /api/cities/[city]/starter-pack
  - suggestedUsers: 5 active users / ambassadors in city
  - ambassadors: all ambassadors in city
  - places: 5 popular places in city
  - missions: 5 city missions
  - plans: 5 active plans in city
  - moments: 5 recent moments in city
  - officialTips: 3 OutsideTips for city
  - Success even if some fail (never block)
- [ ] Create page: /city/[city]/starter-pack or modal in home

### PHASE 7: Local Highlights - NEW API
- [ ] GET /api/cities/[city]/highlights
  - trendingCreators: Top 5 creators by MomentScore.localScore
  - activeOrganizers: Top 5 organizers by plan count
  - trendingMoments: Top 3 moments by score (non-reported, non-deleted)
  - topSavedPlans: Top 3 plans by save count
  - cityMakers: Top 5 most trusted users in city
  - Display as "À découvrir", "Actif cette semaine", "Fait bouger la ville"
  - Exclude reported accounts/content
  - No aggressively humiliating numbers

### PHASE 8: Tonight Assistant - NEW API & COMPONENT
- [ ] POST /api/discover/tonight-assistant
  - Input: city, budget, mood, company (solo/friends), timeframe (now/tonight/weekend), freeOnly
  - Output: {plans[], places[], accounts[], moments[], suggestion}
  - Fallback CTA: "Crée un plan express Food", "Invite ton cercle"
- [ ] Create bottom sheet or page: /tonight-assistant
- [ ] Add CTA button on home

### PHASE 9: Mystery Plan - NEW API & COMPONENT
- [ ] POST /api/plans/mystery
  - Input: mood, budget, city, duration, company
  - Output: existing plan OR idea OR pre-filled express form
  - Rules: Never invent fake events, label ideas clearly
- [ ] Create bottom sheet or quick modal
- [ ] Add CTA button: "Plan mystère" on home
- [ ] CTA: "Créer ce plan"

### PHASE 10: Plan Group Messages - VERIFICATION
- [ ] Ensure Conversation.type = PLAN works:
  - Only plan participants can see group
  - User leaves plan → verify access removed
  - Notifications send only to plan members
- [ ] Add UI badge "Plan" in DM list for plan conversations
- [ ] CTA after plan ends: "Créer un cercle avec ces personnes"

### PHASE 11: Weekly Recap - NEW API & NOTIFICATION
- [ ] GET /api/recap/weekly
  - Moments published this week
  - Plans joined/created
  - New followers
  - Badges earned
  - Most active city
  - Suggestions for next week
  - Stats must be real (no faux data)
- [ ] Show on: /activity, /passport, home once/week
- [ ] Send WEEKLY_RECAP_READY notification
- [ ] Email option (optional)

### PHASE 12: Empty States - COMPONENT UPDATES
- [ ] Moments page empty:
  - "Lance le premier Moment dans ta ville"
  - CTA: Publish, Discover, Starter Pack
- [ ] Plans page empty:
  - "Aucun plan actif ici pour le moment"
  - CTA: Create, Free today, Mystery
- [ ] DM empty:
  - "Ramène ton cercle sur OUTSIDE"
  - CTA: Invite, Discover, Share plan
- [ ] Friends empty:
  - "Ajoute tes premiers amis"
  - CTA: Active, Ambassadors, Invite circle
- [ ] Passeport empty:
  - "Ton Passeport se remplit quand tu sors"
  - CTA: Join plan, Publish moment, Missions

### PHASE 13: Admin Retention - NEW PAGES
- [ ] /admin/retention (ADMIN only)
  - Stats: Total drops, missions, badges, official accounts
  - List and edit drops
  - List and edit missions
  - List and edit official tips
  - Manage ambassadors
- [ ] /admin/retention/drops - CRUD Drops
- [ ] /admin/retention/missions - CRUD Missions
- [ ] /admin/retention/ambassadors - Assign/Revoke

### PHASE 14: Notifications - INTEGRATION
- [ ] Send NOTIFICATION_TYPE.DROP_AVAILABLE when new drop added
- [ ] Send NOTIFICATION_TYPE.MISSION_AVAILABLE when user reaches threshold
- [ ] Send NOTIFICATION_TYPE.BADGE_EARNED when badge awarded
- [ ] Send NOTIFICATION_TYPE.AMBASSADOR_TO_DISCOVER for ambassadors
- [ ] Respect UserSettings: notificationDrop, notificationMission, etc.
- [ ] Don't spam: Max 2 per day per type

### PHASE 15: Tests - COMPREHENSIVE CHECKLIST
- [ ] New user (no friends): Home not empty, has Drops, Missions, empty states with CTA
- [ ] City with content: Starter Pack works, Highlights work, Plans/Moments show
- [ ] City without content: Graceful fallback, CTA to create
- [ ] Active user: Weekly recap works, correct stats
- [ ] Creator: FIRST_CREATOR badge earned
- [ ] Plan organizer: FIRST_ORGANIZER badge earned
- [ ] Ambassador: Badge displays, in /ambassadors
- [ ] Plan participant: Group messages work, after-plan circle CTA works
- [ ] Mystery Plan: Works, creates plan correctly
- [ ] Tonight Assistant: Works, recommends or suggests CTA
- [ ] Mobile: All CTAs functional, not broken
- [ ] Desktop: Same functionality
- [ ] No faux users/likes/comments/DMs/events
- [ ] No data exposed inappropriately

---

## Critical Rules: NON-NEGOTIABLE
- ❌ NO fake users
- ❌ NO fake engagement
- ❌ NO fake content
- ❌ NO breaking auth, moments, plans, dm, notifications, passport, profiles
- ✅ YES reusing existing models
- ✅ YES non-destructive migrations (upsert/idempotent seeders)
- ✅ YES clear official/editorial labeling
- ✅ YES graceful error handling (never block home)
