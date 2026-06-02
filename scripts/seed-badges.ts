import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BADGES = [
  {
    key: "first_plan_created",
    name: "Premier plan",
    description: "Tu as créé ton premier plan dehors.",
    icon: "map-pin",
  },
  {
    key: "first_plan_joined",
    name: "Première sortie",
    description: "Tu as rejoint ton premier plan.",
    icon: "users",
  },
  {
    key: "explorer",
    name: "Explorateur",
    description: "Tu as créé ou rejoint des plans dans 3 villes différentes.",
    icon: "globe",
  },
  {
    key: "food_hunter",
    name: "Food Hunter",
    description: "Tu as créé ou rejoint 3 plans dans la catégorie FOOD.",
    icon: "utensils",
  },
  {
    key: "night_life",
    name: "Night Life",
    description: "Tu as créé ou rejoint 3 plans dans la catégorie PARTY.",
    icon: "party-popper",
  },
  {
    key: "traveler",
    name: "Voyageur",
    description: "Tu as rejoint un plan en mode voyageur.",
    icon: "plane",
  },
  {
    key: "reliable_organizer",
    name: "Organisateur fiable",
    description: "Tu as créé 5 plans et ils se sont tous bien passés.",
    icon: "shield-check",
  },
  {
    key: "sportif",
    name: "Sportif",
    description: "Tu as créé ou rejoint 3 plans dans la catégorie SPORT.",
    icon: "dumbbell",
  },
  {
    key: "always_outside",
    name: "Toujours dehors",
    description: "Tu as rejoint 10 plans au total.",
    icon: "sun",
  },
  {
    key: "new_outside",
    name: "Nouveau dehors",
    description: "Bienvenue sur OUTSIDE !",
    icon: "sparkles",
  },
];

async function main() {
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { key: badge.key },
      update: {},
      create: badge,
    });
  }
  console.log(`Seeded ${BADGES.length} badges.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
