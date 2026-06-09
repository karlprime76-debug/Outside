import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
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

  // Seed referral badges
  const badges = [
    {
      key: "FIRST_INVITE",
      name: "Premier invité",
      description: "Tu as invité ton premier ami sur OUTSIDE",
      icon: "🎯",
    },
    {
      key: "FIVE_INVITES",
      name: "5 amis ramenés",
      description: "Tu as ramené 5 amis sur OUTSIDE",
      icon: "🌟",
    },
    {
      key: "CIRCLE_LAUNCHER",
      name: "Cercle lancé",
      description: "Tu as lancé ton cercle sur OUTSIDE",
      icon: "🚀",
    },
    {
      key: "LOCAL_AMBASSADOR",
      name: "Ambassadeur local",
      description: "Tu es un ambassadeur OUTSIDE dans ta ville",
      icon: "🏆",
    },
  ];

  for (const badge of badges) {
    await db.badge.upsert({
      where: { key: badge.key },
      update: {},
      create: badge,
    });
  }

  console.log("Seeded badges:", badges.length);
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
