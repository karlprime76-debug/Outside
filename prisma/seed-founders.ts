import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding founder badges...");

  // Create founder badges
  const badges = [
    {
      key: "FOUNDER_MEMBER",
      name: "Membre Fondateur",
      description: "Tu fais partie des premiers à construire OUTSIDE.",
      icon: "🚀",
    },
    {
      key: "FOUNDER_CREATOR",
      name: "Premier Créateur",
      description: "Parmi les premiers à publier du contenu sur OUTSIDE.",
      icon: "✨",
    },
    {
      key: "FOUNDER_ORGANIZER",
      name: "Premier Organisateur",
      description: "Parmi les premiers à créer un plan sur OUTSIDE.",
      icon: "📅",
    },
    {
      key: "AMBASSADOR_CITY",
      name: "Ambassadeur de Ville",
      description: "Ambassadeur officiel OUTSIDE pour cette ville.",
      icon: "🏙️",
    },
    {
      key: "CIRCLE_LAUNCHED",
      name: "Cercle Lancé",
      description: "Tu as invité tes amis sur OUTSIDE.",
      icon: "👥",
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { key: badge.key },
      update: {},
      create: badge,
    });
    console.log(`✅ Created badge: ${badge.key}`);
  }

  console.log("✨ Founder badges seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
