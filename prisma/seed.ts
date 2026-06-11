import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // ── Cities ──
  const cities = [
    { name: "Cotonou", country: "Benin", countryCode: "BJ", currency: "XOF", timezone: "Africa/Porto-Novo", language: "fr", latitude: 6.36536, longitude: 2.41833 },
    { name: "Abidjan", country: "Cote d'Ivoire", countryCode: "CI", currency: "XOF", timezone: "Africa/Abidjan", language: "fr", latitude: 5.35995, longitude: -4.00826 },
    { name: "Paris", country: "France", countryCode: "FR", currency: "EUR", timezone: "Europe/Paris", language: "fr", latitude: 48.8566, longitude: 2.3522 },
    { name: "Lagos", country: "Nigeria", countryCode: "NG", currency: "NGN", timezone: "Africa/Lagos", language: "en", latitude: 6.5244, longitude: 3.3792 },
    { name: "New York", country: "United States", countryCode: "US", currency: "USD", timezone: "America/New_York", language: "en", latitude: 40.7128, longitude: -74.006 },
    { name: "Dubai", country: "United Arab Emirates", countryCode: "AE", currency: "AED", timezone: "Asia/Dubai", language: "en", latitude: 25.2048, longitude: 55.2708 },
  ];

  for (const city of cities) {
    await db.city.upsert({
      where: { name_country: { name: city.name, country: city.country } },
      update: {},
      create: city,
    });
  }
  console.log("Seeded cities:", cities.length);

  // ── Badges (all badge systems in one pass) ──
  const ALL_BADGES = [
    // Founder badges (lowercase to match badges.ts)
    { key: "founder_member", name: "Membre Fondateur", description: "Tu fais partie des premiers à construire OUTSIDE.", icon: "🚀" },
    { key: "founder_creator", name: "Premier Créateur", description: "Parmi les premiers à publier du contenu sur OUTSIDE.", icon: "✨" },
    { key: "founder_organizer", name: "Premier Organisateur", description: "Parmi les premiers à créer un plan sur OUTSIDE.", icon: "📅" },
    { key: "ambassador_city", name: "Ambassadeur de Ville", description: "Ambassadeur officiel OUTSIDE pour cette ville.", icon: "🏙️" },
    { key: "circle_launched", name: "Cercle Lancé", description: "Tu as invité tes amis sur OUTSIDE.", icon: "👥" },
    // Referral badges
    { key: "FIRST_INVITE", name: "Premier invité", description: "Tu as invité ton premier ami sur OUTSIDE", icon: "🎯" },
    { key: "FIVE_INVITES", name: "5 amis ramenés", description: "Tu as ramené 5 amis sur OUTSIDE", icon: "🌟" },
    { key: "CIRCLE_LAUNCHER", name: "Cercle lancé", description: "Tu as lancé ton cercle sur OUTSIDE", icon: "🚀" },
    { key: "LOCAL_AMBASSADOR", name: "Ambassadeur local", description: "Tu es un ambassadeur OUTSIDE dans ta ville", icon: "🏆" },
    { key: "REFERRED_BY_FRIEND", name: "Invité par un ami", description: "Tu as rejoint OUTSIDE via l'invitation d'un ami", icon: "🤝" },
    // Trust/community badges
    { key: "trust_active", name: "Confiance active", description: "Membre actif et de confiance", icon: "🛡️" },
    { key: "trust_reliable", name: "Fiable", description: "Membre fiable de la communauté", icon: "🤝" },
    { key: "trust_organizer", name: "Organisateur de confiance", description: "Organisateur reconnu", icon: "📋" },
    { key: "trust_ambassador", name: "Ambassadeur de confiance", description: "Ambassadeur reconnu", icon: "⭐" },
    { key: "presence_confirmed", name: "Présence confirmée", description: "Présence confirmée à plusieurs plans", icon: "✅" },
    { key: "organizer_confirmed", name: "Organisateur confirmé", description: "Organisateur de plans confirmé", icon: "📅" },
    // Achievement badges
    { key: "first_plan_created", name: "Premier plan créé", description: "Tu as créé ton premier plan", icon: "🎉" },
    { key: "first_plan_joined", name: "Premier plan rejoint", description: "Tu as rejoint ton premier plan", icon: "🤗" },
    { key: "first_moment", name: "Premier Moment", description: "Tu as publié ton premier Moment", icon: "📸" },
    { key: "punctual", name: "À l'heure", description: "Tu t'es checké à 5 plans", icon: "⏰" },
    { key: "explorer", name: "Explorateur", description: "Plans dans 3+ villes", icon: "🌍" },
    { key: "food_hunter", name: "Food Hunter", description: "3+ plans Food", icon: "🍽️" },
    { key: "night_life", name: "Night Life", description: "3+ plans Party", icon: "🌙" },
    { key: "sportif", name: "Sportif", description: "3+ plans Sport", icon: "⚽" },
    { key: "traveler", name: "Traveler", description: "Plan traveler-friendly rejoint", icon: "✈️" },
    { key: "always_outside", name: "Always Outside", description: "10 plans rejoints", icon: "🔥" },
    { key: "reliable_organizer", name: "Organisateur fiable", description: "5 plans créés", icon: "📊" },
    { key: "new_outside", name: "New Outside", description: "Bienvenue sur OUTSIDE", icon: "🌟" },
    // Contribution badges
    { key: "active_creator", name: "Créateur actif", description: "10 Moments publiés", icon: "📸" },
    { key: "explorer_plans", name: "Découvreur", description: "5 plans rejoints", icon: "🧭" },
    { key: "social_butterfly", name: "Amis proches", description: "10 amis", icon: "👥" },
    { key: "trending_creator", name: "Tendance", description: "Moment viral", icon: "🔥" },
    // Onboarding badge
    { key: "PROFILE_LAUNCHED", name: "Profil lancé", description: "Tu as complété ton profil OUTSIDE", icon: "🎯" },
  ];

  for (const badge of ALL_BADGES) {
    await db.badge.upsert({
      where: { key: badge.key },
      update: {},
      create: badge,
    });
  }
  console.log(`Seeded ${ALL_BADGES.length} badges`);

  // ── Outside Drops ──
  const DROPS = [
    { id: "default-drop-1", title: "Plans à faire ce soir", description: "Découvre les plans actifs dans ta ville", type: "plan_tonight", targetUrl: "/tonight", active: true },
    { id: "default-drop-2", title: "Comptes à découvrir", description: "Suis les comptes officiels et ambassadeurs", type: "discover_accounts", targetUrl: "/friends", active: true },
    { id: "default-drop-3", title: "Défi du jour", description: "Publie ton premier Moment sur OUTSIDE", type: "challenge_today", targetUrl: "/moments/new", active: true },
    { id: "default-drop-4", title: "Lieu à tester", description: "Découvre un nouveau lieu dans ta ville", type: "place_test", targetUrl: "/places", active: true },
    { id: "default-drop-5", title: "Moment qui monte", description: "Les Moments populaires dans ta ville", type: "moment_trending", targetUrl: "/moments", active: true },
    { id: "default-drop-6", title: "Plan gratuit", description: "Rejoins un plan gratuit", type: "plan_free", targetUrl: "/plans?budget=FREE", active: true },
    { id: "default-drop-7", title: "Idée sortie officielle", description: "Nos suggestions de sorties officielles", type: "idea_official", targetUrl: "/discover", active: true },
  ];

  for (const drop of DROPS) {
    await db.outsideDrop.upsert({ where: { id: drop.id }, update: {}, create: drop });
  }
  console.log(`Seeded ${DROPS.length} Outside Drops`);

  // ── Daily Challenges ──
  const CHALLENGES = [
    { key: "first_moment", title: "Publie ton premier Moment", description: "Partage un moment de ta journée avec la communauté", rewardLabel: "Badge Premier Moment", type: "POST_MOMENT", targetValue: 1, rewardPoints: 20 },
    { key: "follow_3_users", title: "Suis 3 comptes", description: "Découvre et suis 3 personnes intéressantes", rewardLabel: "+15 points", type: "FOLLOW_FRIEND", targetValue: 3, rewardPoints: 15 },
    { key: "create_express_plan", title: "Crée un plan ce soir", description: "Lance un plan rapide pour ce soir", rewardLabel: "Badge Premier plan", type: "CREATE_PLAN", targetValue: 1, rewardPoints: 25 },
    { key: "join_plan_today", title: "Rejoins un plan", description: "Participe à une sortie organisée aujourd'hui", rewardLabel: "+10 points", type: "JOIN_PLAN", targetValue: 1, rewardPoints: 10 },
    { key: "add_friend_today", title: "Ajoute un ami", description: "Élargis ton cercle sur OUTSIDE", rewardLabel: "+10 points", type: "ADD_FRIEND", targetValue: 1, rewardPoints: 10 },
  ];

  for (const c of CHALLENGES) {
    await db.dailyChallenge.upsert({ where: { key: c.key }, update: c, create: c });
  }
  console.log(`Seeded ${CHALLENGES.length} Daily Challenges`);

  // ── City Missions ──
  const MISSIONS = [
    { key: "publish_moment_city", title: "Explorateur urbain", description: "Partage 5 moments depuis ta ville", rewardLabel: "+50 points", type: "POST_MOMENT", targetValue: 5, rewardPoints: 50 },
    { key: "create_3_plans", title: "Organisateur né", description: "Organise 3 sorties cette semaine", rewardLabel: "+100 points", type: "CREATE_PLAN", targetValue: 3, rewardPoints: 100 },
    { key: "join_5_plans", title: "Social Butterfly", description: "Participe à 5 plans différents", rewardLabel: "+75 points", type: "JOIN_PLAN", targetValue: 5, rewardPoints: 75 },
    { key: "add_10_friends", title: "Cercle étendu", description: "Connecte-toi avec 10 nouveaux amis", rewardLabel: "Badge Cercle lancé", type: "ADD_FRIEND", targetValue: 10, rewardPoints: 100 },
  ];

  for (const m of MISSIONS) {
    await db.cityMission.upsert({ where: { key: m.key }, update: m, create: m });
  }
  console.log(`Seeded ${MISSIONS.length} City Missions`);

  // ── Outside Tips ──
  const TIPS = [
    { id: "default-tip-1", title: "Trouve un plan gratuit ce soir", description: "Explore les sorties sans dépenser dans ta ville", mood: "FREE", actionLabel: "Découvrir", actionUrl: "/plans?budget=FREE", active: true },
    { id: "default-tip-2", title: "Publie l'ambiance d'un lieu", description: "Partage l'atmosphère d'un spot que tu connais", mood: "CHILL", actionLabel: "Publier", actionUrl: "/places", active: true },
    { id: "default-tip-3", title: "Crée un plan express", description: "Lance une sortie rapide pour ce soir", mood: "TONIGHT", actionLabel: "Créer", actionUrl: "/plans/new?mood=TONIGHT", active: true },
    { id: "default-tip-4", title: "Invite quelqu'un à sortir", description: "Ramène ton cercle sur OUTSIDE", mood: null, actionLabel: "Inviter", actionUrl: "/invite", active: true },
    { id: "default-tip-5", title: "Utilise l'assistant ce soir", description: "Trouve quoi faire selon ton mood et budget", mood: "FOOD", actionLabel: "Assistant", actionUrl: "/tonight-assistant", active: true },
  ] as const;

  for (const tip of TIPS) {
    const createData: Parameters<typeof db.outsideTip.create>[0]["data"] = {
      id: tip.id,
      title: tip.title,
      description: tip.description,
      mood: tip.mood ?? undefined,
      actionLabel: tip.actionLabel,
      actionUrl: tip.actionUrl,
      active: tip.active,
    };
    await db.outsideTip.upsert({ where: { id: tip.id }, update: createData, create: createData });
  }
  console.log(`Seeded ${TIPS.length} Outside Tips`);

  // ── Official OUTSIDE Accounts ──
  const OFFICIAL = [
    { email: "guide@outside.com", username: "outside_guide", name: "OUTSIDE Guide", bio: "Compte officiel OUTSIDE — Guide et conseils pour profiter de l'app", cityId: "Cotonou", accountKind: "OFFICIAL_GUIDE" as const },
    { email: "cotonou@outside.com", username: "outside_cotonou", name: "OUTSIDE Cotonou", bio: "Compte officiel OUTSIDE Cotonou — Les meilleurs plans à Cotonou", cityId: "Cotonou", accountKind: "OFFICIAL_CITY" as const },
    { email: "abidjan@outside.com", username: "outside_abidjan", name: "OUTSIDE Abidjan", bio: "Compte officiel OUTSIDE Abidjan — Les meilleurs plans à Abidjan", cityId: "Abidjan", accountKind: "OFFICIAL_CITY" as const },
    { email: "paris@outside.com", username: "outside_paris", name: "OUTSIDE Paris", bio: "Compte officiel OUTSIDE Paris — Les meilleurs plans à Paris", cityId: "Paris", accountKind: "OFFICIAL_CITY" as const },
    { email: "food@outside.com", username: "outside_food", name: "OUTSIDE Food", bio: "Compte officiel OUTSIDE Food — Les meilleurs plans food et restaurants", cityId: null, accountKind: "OFFICIAL_PARTNER" as const },
    { email: "night@outside.com", username: "outside_night", name: "OUTSIDE Night", bio: "Compte officiel OUTSIDE Night — Les meilleurs plans nocturnes", cityId: null, accountKind: "OFFICIAL_PARTNER" as const },
    { email: "sport@outside.com", username: "outside_sport", name: "OUTSIDE Sport", bio: "Compte officiel OUTSIDE Sport — Les meilleurs plans sportifs", cityId: null, accountKind: "OFFICIAL_PARTNER" as const },
  ];

  for (const acc of OFFICIAL) {
    const existing = await db.user.findUnique({ where: { username: acc.username } });
    let homeCityId: string | undefined;
    let activeCityId: string | undefined;
    if (acc.cityId) {
      const city = await db.city.findUnique({ where: { name_country: { name: acc.cityId, country: cities.find(c => c.name === acc.cityId)?.country ?? "" } } });
      if (city) { homeCityId = city.id; activeCityId = city.id; }
    }
    if (!existing) {
      const password = await bcrypt.hash(Math.random().toString(36).slice(-8), 12);
      await db.user.create({
        data: {
          email: acc.email, username: acc.username, name: acc.name, bio: acc.bio,
          password, isVerified: true, emailVerified: new Date(),
          termsAcceptedAt: new Date(), privacyAcceptedAt: new Date(),
          language: "fr", role: "USER", homeCityId, activeCityId, isDemoAccount: false,
          accountKind: acc.accountKind,
        },
      });
      console.log(`Created official account: ${acc.username}`);
    } else {
      await db.user.update({
        where: { id: existing.id },
        data: { accountKind: acc.accountKind, isVerified: true },
      });
    }
  }

  // ── Award founder badge to any users registered before seed ──
  const firstUsers = await db.user.findMany({
    where: { isDemoAccount: false },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  const founderBadge = await db.badge.findUnique({ where: { key: "founder_member" } });
  if (founderBadge) {
    for (const u of firstUsers) {
      const existing = await db.userBadge.findUnique({
        where: { userId_badgeId: { userId: u.id, badgeId: founderBadge.id } },
      });
      if (!existing) {
        await db.userBadge.create({ data: { userId: u.id, badgeId: founderBadge.id } }).catch(() => {});
      }
    }
    console.log(`Checked founder badge for ${firstUsers.length} users`);
  }

  console.log("✅ Seed complete!");
}

main()
  .then(async () => { await db.$disconnect(); })
  .catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
