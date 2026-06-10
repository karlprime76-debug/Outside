import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding official OUTSIDE hashtags...");

  const officialHashtags = [
    // Global official hashtags
    { tag: "outsidetonight", displayName: "#OutsideTonight", city: null, countryCode: null },
    { tag: "planexpress", displayName: "#PlanExpress", city: null, countryCode: null },
    { tag: "outsidefood", displayName: "#OutsideFood", city: null, countryCode: null },
    { tag: "outsidesport", displayName: "#OutsideSport", city: null, countryCode: null },
    { tag: "outsidemusic", displayName: "#OutsideMusic", city: null, countryCode: null },
    { tag: "outsidechill", displayName: "#OutsideChill", city: null, countryCode: null },
    { tag: "gratuitaujourdhui", displayName: "#GratuitAujourd'hui", city: null, countryCode: null },
    { tag: "quibougecesoir", displayName: "#QuiBougeCeSoir", city: null, countryCode: null },
    
    // City-specific official hashtags
    { tag: "cotonoutonight", displayName: "#CotonouTonight", city: "Cotonou", countryCode: "BJ" },
    { tag: "abidjantonight", displayName: "#AbidjanTonight", city: "Abidjan", countryCode: "CI" },
    { tag: "paristonight", displayName: "#ParisTonight", city: "Paris", countryCode: "FR" },
    { tag: "lagostonight", displayName: "#LagosTonight", city: "Lagos", countryCode: "NG" },
    { tag: "newyorktonight", displayName: "#NewYorkTonight", city: "New York", countryCode: "US" },
    { tag: "dubaitonight", displayName: "#DubaiTonight", city: "Dubai", countryCode: "AE" },
    
    // Category-specific official hashtags
    { tag: "afterwork", displayName: "#Afterwork", city: null, countryCode: null },
    { tag: "burger", displayName: "#Burger", city: null, countryCode: null },
    { tag: "foodie", displayName: "#Foodie", city: null, countryCode: null },
    { tag: "nightlife", displayName: "#Nightlife", city: null, countryCode: null },
    { tag: "weekendvibes", displayName: "#WeekendVibes", city: null, countryCode: null },
  ];

  for (const hashtag of officialHashtags) {
    const whereClause: any = {
      tag: hashtag.tag,
    };

    if (hashtag.city) {
      whereClause.city = hashtag.city;
    }

    if (hashtag.countryCode) {
      whereClause.countryCode = hashtag.countryCode;
    }

    // If both are null, we need to explicitly set them to null for the unique constraint
    if (!hashtag.city && !hashtag.countryCode) {
      whereClause.city = null;
      whereClause.countryCode = null;
    }

    await prisma.hashtag.upsert({
      where: {
        tag_city_countryCode: whereClause,
      },
      update: {
        isOfficial: true,
      },
      create: {
        tag: hashtag.tag,
        displayName: hashtag.displayName,
        city: hashtag.city ?? null,
        countryCode: hashtag.countryCode ?? null,
        isOfficial: true,
        usageCount: 0,
        momentUsageCount: 0,
        planUsageCount: 0,
        trendingScore: 0,
        localTrendingScore: 0,
      },
    });
  }

  console.log(`Seeded ${officialHashtags.length} official hashtags`);
}

main()
  .catch((e) => {
    console.error("Error seeding official hashtags:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
