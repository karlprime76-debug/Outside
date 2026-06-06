import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding founder badges...");

  // Check if badges already exist
  const existingBadges = await prisma.badge.findMany({
    where: {
      key: {
        in: [
          "FOUNDER_MEMBER",
          "FIRST_CREATOR",
          "FIRST_ORGANIZER",
          "CITY_AMBASSADOR",
          "CIRCLE_LAUNCHED",
        ],
      },
    },
  });

  if (existingBadges.length > 0) {
    console.log("Founder badges already exist, skipping seed.");
    return;
  }

  // Create founder badges
  const badges = await Promise.all([
    prisma.badge.create({
      data: {
        key: "FOUNDER_MEMBER",
        name: "Membre fondateur",
        description: "Tu fais partie des premiers à construire OUTSIDE.",
        icon: "🚀",
      },
    }),
    prisma.badge.create({
      data: {
        key: "FIRST_CREATOR",
        name: "Premier créateur",
        description: "Premier à publier un Moment dans ta ville.",
        icon: "📸",
      },
    }),
    prisma.badge.create({
      data: {
        key: "FIRST_ORGANIZER",
        name: "Premier organisateur",
        description: "Premier à créer un plan dans ta ville.",
        icon: "📅",
      },
    }),
    prisma.badge.create({
      data: {
        key: "CITY_AMBASSADOR",
        name: "Ambassadeur de ville",
        description: "Tu représentes OUTSIDE dans ta ville.",
        icon: "🏆",
      },
    }),
    prisma.badge.create({
      data: {
        key: "CIRCLE_LAUNCHED",
        name: "Cercle lancé",
        description: "Tu as ramené 5 amis sur OUTSIDE.",
        icon: "👥",
      },
    }),
  ]);

  console.log(`Created ${badges.length} founder badges:`);
  badges.forEach((badge) => {
    console.log(`- ${badge.key}: ${badge.name}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
