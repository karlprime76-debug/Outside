import { PrismaClient, Mood } from "@prisma/client";

const db = new PrismaClient();

async function seedOfficialTips() {
  console.log("💡 Seeding Official Tips...");

  const tips = [
    // Global Tips
    {
      city: null,
      countryCode: null,
      title: "Remplis ton profil",
      description: "Une bonne photo rend ta communauté plus confiante",
      mood: null as Mood | null,
      actionLabel: "Aller au profil",
      actionUrl: "/profile/edit",
      active: true,
    },
    {
      city: null,
      countryCode: null,
      title: "Suis d'autres créateurs",
      description: "Découvre des plans intéressants en suivant d'autres utilisateurs",
      mood: null as Mood | null,
      actionLabel: "Découvrir",
      actionUrl: "/ambassadors",
      active: true,
    },
    {
      city: null,
      countryCode: null,
      title: "Plans gratuits plus visibles",
      description: "Crée un plan express gratuit pour plus de visibilité",
      mood: Mood.FREE,
      actionLabel: "Créer un plan",
      actionUrl: "/plans/create",
      active: true,
    },
    {
      city: null,
      countryCode: null,
      title: "Partage tes moments",
      description: "Inspire ta communauté locale en partageant tes sorties",
      mood: null as Mood | null,
      actionLabel: "Publier",
      actionUrl: "/moments/create",
      active: true,
    },

    // Cotonou Tips
    {
      city: "Cotonou",
      countryCode: "BJ",
      title: "Meilleur moment à Cotonou",
      description: "Entre 19h et 22h, la ville s'anime! C'est le moment pour sortir",
      mood: Mood.TONIGHT,
      actionLabel: "Que faire ce soir?",
      actionUrl: "/discover/tonight-assistant?city=Cotonou",
      active: true,
    },
    {
      city: "Cotonou",
      countryCode: "BJ",
      title: "Zone portuaire",
      description: "À découvrir absolument pour des moments incontournables",
      mood: null as Mood | null,
      actionLabel: "Voir les plans",
      actionUrl: "/home",
      active: true,
    },

    // Abidjan Tips
    {
      city: "Abidjan",
      countryCode: "CI",
      title: "Les Plateaux Abidjanais",
      description: "Parfaits pour les plans business et culture",
      mood: Mood.BUSINESS,
      actionLabel: "Plans à Abidjan",
      actionUrl: "/home",
      active: true,
    },
    {
      city: "Abidjan",
      countryCode: "CI",
      title: "Restaurants du Plateau",
      description: "Food de qualité et ambiance chaleureuse",
      mood: Mood.FOOD,
      actionLabel: "Diner ce soir",
      actionUrl: "/discover/tonight-assistant?city=Abidjan&mood=FOOD",
      active: true,
    },

    // Paris Tips
    {
      city: "Paris",
      countryCode: "FR",
      title: "Rive gauche pour la culture",
      description: "Plans culture et chill réunis",
      mood: Mood.CULTURE,
      actionLabel: "Explorer",
      actionUrl: "/discover/tonight-assistant?city=Paris&mood=CULTURE",
      active: true,
    },
    {
      city: "Paris",
      countryCode: "FR",
      title: "Parcs parisiens",
      description: "Parfaits pour les plans détente et marche",
      mood: Mood.WALK,
      actionLabel: "Sortir maintenant",
      actionUrl: "/discover/tonight-assistant?city=Paris&mood=WALK",
      active: true,
    },
  ];

  for (const tip of tips) {
    try {
      // Check if tip already exists
      const existing = await db.outsideTip.findFirst({
        where: {
          city: tip.city,
          countryCode: tip.countryCode,
          title: tip.title,
        },
      });

      if (existing) {
        // Update if exists
        await db.outsideTip.update({
          where: { id: existing.id },
          data: {
            description: tip.description,
            mood: tip.mood,
            actionLabel: tip.actionLabel,
            actionUrl: tip.actionUrl,
            active: tip.active,
          },
        });
      } else {
        // Create if doesn't exist
        await db.outsideTip.create({
          data: tip,
        });
      }
      console.log(`✅ Tip: ${tip.title}`);
    } catch (error) {
      console.error(`❌ Error seeding tip "${tip.title}":`, error);
    }
  }

  console.log("✅ Official Tips seeding complete!");
}

seedOfficialTips()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
