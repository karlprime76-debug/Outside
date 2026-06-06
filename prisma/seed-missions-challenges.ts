import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding missions and challenges...");

  // Global daily challenges (not city-specific)
  const challenges = [
    {
      key: "publish_first_moment",
      title: "Publie ton premier Moment",
      description: "Partage ce que tu fais en ce moment",
      rewardLabel: "Badge débutant",
    },
    {
      key: "follow_3_accounts",
      title: "Suis 3 comptes",
      description: "Découvre des créateurs dans ta ville",
      rewardLabel: "+3 personnes",
    },
    {
      key: "save_plan",
      title: "Sauvegarde un plan",
      description: "Garde un plan pour plus tard",
      rewardLabel: "Plan sauvegardé",
    },
    {
      key: "create_plan_express",
      title: "Crée un plan express",
      description: "Organise quelque chose rapidement",
      rewardLabel: "Organisateur",
    },
    {
      key: "set_available",
      title: "Active 'Je suis dispo'",
      description: "Montre que tu es disponible",
      rewardLabel: "Actif",
    },
    {
      key: "invite_friend",
      title: "Invite un ami",
      description: "Ramène quelqu'un sur OUTSIDE",
      rewardLabel: "+1 cercle",
    },
    {
      key: "add_profile_pic",
      title: "Ajoute une photo de profil",
      description: "Complète ton profil",
      rewardLabel: "Profil complet",
    },
  ];

  for (const challenge of challenges) {
    const existing = await prisma.dailyChallenge.findUnique({
      where: { key: challenge.key },
    });

    if (!existing) {
      await prisma.dailyChallenge.create({
        data: challenge,
      });
      console.log(`✓ Created challenge: ${challenge.key}`);
    }
  }

  // City-specific missions
  const cityMissions = [
    {
      key: "publish_moment_city",
      title: "Publie un Moment à {ville}",
      description: "Montre ce qui se passe dans ta ville",
      rewardLabel: "Créateur local",
    },
    {
      key: "create_free_plan",
      title: "Crée un plan gratuit",
      description: "Propose une sortie gratuite",
      rewardLabel: "Organisateur généreux",
    },
    {
      key: "discover_local_accounts",
      title: "Découvre 3 comptes locaux",
      description: "Connecte-toi avec ta communauté",
      rewardLabel: "Connecté",
    },
    {
      key: "rate_place_vibe",
      title: "Signale l'ambiance d'un lieu",
      description: "Aide les autres avec ton avis",
      rewardLabel: "Guide local",
    },
    {
      key: "join_plan_this_week",
      title: "Rejoins un plan cette semaine",
      description: "Participe à quelque chose",
      rewardLabel: "Participant",
    },
    {
      key: "invite_circle",
      title: "Invite ton cercle",
      description: "Ramène tes amis sur OUTSIDE",
      rewardLabel: "+N amis",
    },
  ];

  for (const mission of cityMissions) {
    const existing = await prisma.cityMission.findUnique({
      where: { key: mission.key },
    });

    if (!existing) {
      await prisma.cityMission.create({
        data: {
          ...mission,
          city: null, // Generic for all cities
        },
      });
      console.log(`✓ Created mission: ${mission.key}`);
    }
  }

  console.log("✓ Missions and challenges seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
