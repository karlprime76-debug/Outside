import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CONTRIBUTION_BADGES = [
  { key: "active_creator", name: "Créateur actif", description: "Tu as publié 10 Moments.", icon: "📸" },
  { key: "explorer_plans", name: "Découvreur", description: "Tu as rejoint 5 plans.", icon: "🧭" },
  { key: "reliable_organizer", name: "Organisateur fiable", description: "Tu as créé 5 plans.", icon: "📅" },
  { key: "social_butterfly", name: "Amis proches", description: "Tu as 10 amis.", icon: "👥" },
  { key: "trending_creator", name: "Tendance", description: "Un de tes Moments a atteint le niveau viral 2+.", icon: "🔥" },
];

async function main() {
  console.log("Seeding contribution badges...");

  const existing = await prisma.badge.findMany({
    where: { key: { in: CONTRIBUTION_BADGES.map((b) => b.key) } },
  });

  if (existing.length > 0) {
    console.log("Contribution badges already exist, skipping seed.");
    return;
  }

  const badges = await Promise.all(
    CONTRIBUTION_BADGES.map((badge) =>
      prisma.badge.create({ data: badge })
    )
  );

  console.log(`Created ${badges.length} contribution badges:`);
  badges.forEach((b) => console.log(`- ${b.key}: ${b.name}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
