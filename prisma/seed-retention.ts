import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding retention data (Drops, Missions, Tips)...");

  // Create Outside Drops
  const drops = await Promise.all([
    prisma.outsideDrop.upsert({
      where: { id: "default-drop-1" },
      update: {},
      create: {
        id: "default-drop-1",
        title: "Plans à faire ce soir",
        description: "Découvre les plans actifs dans ta ville pour ce soir",
        type: "plan_tonight",
        targetUrl: "/tonight",
        active: true,
      },
    }),
    prisma.outsideDrop.upsert({
      where: { id: "default-drop-2" },
      update: {},
      create: {
        id: "default-drop-2",
        title: "Comptes à découvrir",
        description: "Suis les comptes officiels et ambassadeurs de ta ville",
        type: "discover_accounts",
        targetUrl: "/friends",
        active: true,
      },
    }),
    prisma.outsideDrop.upsert({
      where: { id: "default-drop-3" },
      update: {},
      create: {
        id: "default-drop-3",
        title: "Défi du jour",
        description: "Publie ton premier Moment sur OUTSIDE",
        type: "challenge_today",
        targetUrl: "/moments/new",
        active: true,
      },
    }),
    prisma.outsideDrop.upsert({
      where: { id: "default-drop-4" },
      update: {},
      create: {
        id: "default-drop-4",
        title: "Lieu à tester",
        description: "Découvre un nouveau lieu dans ta ville",
        type: "place_test",
        targetUrl: "/places",
        active: true,
      },
    }),
    prisma.outsideDrop.upsert({
      where: { id: "default-drop-5" },
      update: {},
      create: {
        id: "default-drop-5",
        title: "Moment qui monte",
        description: "Voici les Moments populaires dans ta ville",
        type: "moment_trending",
        targetUrl: "/moments",
        active: true,
      },
    }),
    prisma.outsideDrop.upsert({
      where: { id: "default-drop-6" },
      update: {},
      create: {
        id: "default-drop-6",
        title: "Plan gratuit",
        description: "Rejoins un plan gratuit dans ta ville",
        type: "plan_free",
        targetUrl: "/plans?budget=FREE",
        active: true,
      },
    }),
    prisma.outsideDrop.upsert({
      where: { id: "default-drop-7" },
      update: {},
      create: {
        id: "default-drop-7",
        title: "Idée sortie officielle",
        description: "Découvre nos suggestions de sorties officielles",
        type: "idea_official",
        targetUrl: "/discover",
        active: true,
      },
    }),
  ]);

  console.log(`Created ${drops.length} Outside Drops`);

  // Create Daily Challenges
  const challenges = await Promise.all([
    prisma.dailyChallenge.upsert({
      where: { key: "first_moment" },
      update: {},
      create: {
        key: "first_moment",
        title: "Publie ton premier Moment",
        description: "Partage un moment de ta journée avec la communauté",
        rewardLabel: "+10 points",
        active: true,
      },
    }),
    prisma.dailyChallenge.upsert({
      where: { key: "follow_3_users" },
      update: {},
      create: {
        key: "follow_3_users",
        title: "Suis 3 comptes",
        description: "Découvre et suis 3 personnes intéressantes",
        rewardLabel: "+5 points",
        active: true,
      },
    }),
    prisma.dailyChallenge.upsert({
      where: { key: "save_plan" },
      update: {},
      create: {
        key: "save_plan",
        title: "Sauvegarde un plan",
        description: "Sauvegarde un plan qui t'intéresse pour plus tard",
        rewardLabel: "+5 points",
        active: true,
      },
    }),
    prisma.dailyChallenge.upsert({
      where: { key: "create_express_plan" },
      update: {},
      create: {
        key: "create_express_plan",
        title: "Crée un plan express",
        description: "Lance un plan rapide pour ce soir",
        rewardLabel: "+15 points",
        active: true,
      },
    }),
    prisma.dailyChallenge.upsert({
      where: { key: "activate_status" },
      update: {},
      create: {
        key: "activate_status",
        title: "Active ton statut",
        description: "Montre que tu es disponible pour sortir",
        rewardLabel: "+5 points",
        active: true,
      },
    }),
  ]);

  console.log(`Created ${challenges.length} Daily Challenges`);

  // Create City Missions (global first, then city-specific)
  const missions = await Promise.all([
    prisma.cityMission.upsert({
      where: { key: "publish_moment_city" },
      update: {},
      create: {
        key: "publish_moment_city",
        title: "Publie un Moment dans ta ville",
        description: "Partage un moment depuis ta ville active",
        rewardLabel: "Badge Premier créateur",
        active: true,
      },
    }),
    prisma.cityMission.upsert({
      where: { key: "create_free_plan" },
      update: {},
      create: {
        key: "create_free_plan",
        title: "Crée un plan gratuit",
        description: "Organise une sortie gratuite pour ta ville",
        rewardLabel: "+20 points",
        active: true,
      },
    }),
    prisma.cityMission.upsert({
      where: { key: "discover_3_local" },
      update: {},
      create: {
        key: "discover_3_local",
        title: "Découvre 3 comptes locaux",
        description: "Suis 3 personnes actives dans ta ville",
        rewardLabel: "+10 points",
        active: true,
      },
    }),
    prisma.cityMission.upsert({
      where: { key: "join_plan_week" },
      update: {},
      create: {
        key: "join_plan_week",
        title: "Rejoins un plan cette semaine",
        description: "Participe à un plan organisé dans ta ville",
        rewardLabel: "+15 points",
        active: true,
      },
    }),
    prisma.cityMission.upsert({
      where: { key: "invite_circle" },
      update: {},
      create: {
        key: "invite_circle",
        title: "Invite ton cercle",
        description: "Ramène 3 amis sur OUTSIDE",
        rewardLabel: "Badge Cercle lancé",
        active: true,
      },
    }),
  ]);

  console.log(`Created ${missions.length} City Missions`);

  // Create Outside Tips
  const tips = await Promise.all([
    prisma.outsideTip.upsert({
      where: { id: "default-tip-1" },
      update: {},
      create: {
        id: "default-tip-1",
        title: "Commence avec le Starter Pack",
        description: "Découvre les comptes à suivre, les lieux et les missions de ta ville",
        mood: "CHILL",
        actionLabel: "Voir le Starter Pack",
        actionUrl: "/cities/{city}/starter-pack",
        active: true,
      },
    }),
    prisma.outsideTip.upsert({
      where: { id: "default-tip-2" },
      update: {},
      create: {
        id: "default-tip-2",
        title: "Utilise l'assistant ce soir",
        description: "Trouve quoi faire ce soir en fonction de ton mood et budget",
        mood: "FOOD",
        actionLabel: "Assistant ce soir",
        actionUrl: "/tonight-assistant",
        active: true,
      },
    }),
    prisma.outsideTip.upsert({
      where: { id: "default-tip-3" },
      update: {},
      create: {
        id: "default-tip-3",
        title: "Essaie le Plan mystère",
        description: "Laisse OUTSIDE te proposer une sortie surprise",
        mood: "PARTY",
        actionLabel: "Plan mystère",
        actionUrl: "/plans/mystery",
        active: true,
      },
    }),
    prisma.outsideTip.upsert({
      where: { id: "default-tip-4" },
      update: {},
      create: {
        id: "default-tip-4",
        title: "Active ton statut",
        description: "Montre aux autres que tu es disponible pour sortir",
        mood: null,
        actionLabel: "Activer",
        actionUrl: "/available",
        active: true,
      },
    }),
  ]);

  console.log(`Created ${tips.length} Outside Tips`);

  console.log("Retention data seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
