import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function seedOutsideDrops() {
  console.log("🌟 Seeding OUTSIDE Drops...");

  const drops = [
    // Global Drops
    {
      city: null,
      countryCode: null,
      title: "Gratuit Aujourd'hui",
      description: "Découvre 5 plans entièrement gratuits cette semaine",
      type: "free_plans",
      targetUrl: "/home?filter=free",
      active: true,
    },
    {
      city: null,
      countryCode: null,
      title: "Créateurs à Suivre",
      description: "Les meilleurs créateurs de moments cette semaine",
      type: "trending_creators",
      targetUrl: "/ambassadors",
      active: true,
    },
    {
      city: null,
      countryCode: null,
      title: "Plan du Jour",
      description: "Le plan incontournable de la journée",
      type: "plan_of_day",
      targetUrl: "/discover/mystery-plan",
      active: true,
    },

    // Cotonou Drops
    {
      city: "Cotonou",
      countryCode: "BJ",
      title: "Soirée Gastronomie à Cotonou",
      description: "Les meilleurs restaurants du moment à Cotonou",
      type: "food_experience",
      targetUrl: "/discover/tonight-assistant?city=Cotonou&mood=FOOD",
      active: true,
    },
    {
      city: "Cotonou",
      countryCode: "BJ",
      title: "Évènements Locaux",
      description: "5 événements cette semaine à Cotonou",
      type: "local_events",
      targetUrl: "/city/Cotonou/highlights",
      active: true,
    },
    {
      city: "Cotonou",
      countryCode: "BJ",
      title: "Starter Pack Cotonou",
      description: "Bienvenue! Commence ici pour découvrir Cotonou",
      type: "onboarding",
      targetUrl: "/city/Cotonou/starter-pack",
      active: true,
    },

    // Abidjan Drops
    {
      city: "Abidjan",
      countryCode: "CI",
      title: "Nuit Abidjan",
      description: "Les meilleurs plans pour la nuit à Abidjan",
      type: "nightlife",
      targetUrl: "/discover/tonight-assistant?city=Abidjan&mood=MUSIC",
      active: true,
    },
    {
      city: "Abidjan",
      countryCode: "CI",
      title: "Sport & Fitness",
      description: "Plans sportifs cette semaine à Abidjan",
      type: "sports",
      targetUrl: "/discover/tonight-assistant?city=Abidjan&mood=SPORT",
      active: true,
    },
    {
      city: "Abidjan",
      countryCode: "CI",
      title: "Starter Pack Abidjan",
      description: "Découvre Abidjan avec notre guide local",
      type: "onboarding",
      targetUrl: "/city/Abidjan/starter-pack",
      active: true,
    },

    // Paris Drops
    {
      city: "Paris",
      countryCode: "FR",
      title: "Culture à Paris",
      description: "Expositions et événements culturels cette semaine",
      type: "culture",
      targetUrl: "/discover/tonight-assistant?city=Paris&mood=CULTURE",
      active: true,
    },
    {
      city: "Paris",
      countryCode: "FR",
      title: "Cafés Parisiens",
      description: "Les meilleurs endroits pour un café tranquille",
      type: "chill",
      targetUrl: "/discover/tonight-assistant?city=Paris&mood=CHILL",
      active: true,
    },
    {
      city: "Paris",
      countryCode: "FR",
      title: "Starter Pack Paris",
      description: "Nouvelle à Paris? Commence par ici",
      type: "onboarding",
      targetUrl: "/city/Paris/starter-pack",
      active: true,
    },
  ];

  for (const drop of drops) {
    try {
      // Check if drop already exists
      const existing = await db.outsideDrop.findFirst({
        where: {
          city: drop.city,
          countryCode: drop.countryCode,
          title: drop.title,
        },
      });

      if (existing) {
        // Update if exists
        await db.outsideDrop.update({
          where: { id: existing.id },
          data: {
            description: drop.description,
            type: drop.type,
            targetUrl: drop.targetUrl,
            active: drop.active,
          },
        });
      } else {
        // Create if doesn't exist
        await db.outsideDrop.create({
          data: drop,
        });
      }
      console.log(`✅ Dropped: ${drop.title}`);
    } catch (error) {
      console.error(`❌ Error seeding drop "${drop.title}":`, error);
    }
  }

  console.log("✅ OUTSIDE Drops seeding complete!");
}

seedOutsideDrops()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
