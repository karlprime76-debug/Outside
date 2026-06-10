import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Creating official OUTSIDE accounts...");

  const officialAccounts = [
    {
      email: "guide@outside.com",
      username: "outside_guide",
      name: "OUTSIDE Guide",
      bio: "Compte officiel OUTSIDE - Guide et conseils pour profiter de l'app",
      isVerified: true,
    },
    {
      email: "cotonou@outside.com",
      username: "outside_cotonou",
      name: "OUTSIDE Cotonou",
      bio: "Compte officiel OUTSIDE Cotonou - Découvre les meilleurs plans à Cotonou",
      isVerified: true,
    },
    {
      email: "abidjan@outside.com",
      username: "outside_abidjan",
      name: "OUTSIDE Abidjan",
      bio: "Compte officiel OUTSIDE Abidjan - Découvre les meilleurs plans à Abidjan",
      isVerified: true,
    },
    {
      email: "paris@outside.com",
      username: "outside_paris",
      name: "OUTSIDE Paris",
      bio: "Compte officiel OUTSIDE Paris - Découvre les meilleurs plans à Paris",
      isVerified: true,
    },
    {
      email: "food@outside.com",
      username: "outside_food",
      name: "OUTSIDE Food",
      bio: "Compte officiel OUTSIDE Food - Les meilleurs plans food et restaurants",
      isVerified: true,
    },
    {
      email: "night@outside.com",
      username: "outside_night",
      name: "OUTSIDE Night",
      bio: "Compte officiel OUTSIDE Night - Les meilleurs plans nocturnes et sorties",
      isVerified: true,
    },
    {
      email: "sport@outside.com",
      username: "outside_sport",
      name: "OUTSIDE Sport",
      bio: "Compte officiel OUTSIDE Sport - Les meilleurs plans sportifs et activités",
      isVerified: true,
    },
  ];

  for (const account of officialAccounts) {
    const existing = await prisma.user.findUnique({
      where: { username: account.username },
    });

    if (existing) {
      console.log(`Account ${account.username} already exists, skipping...`);
      continue;
    }

    // Create a random password
    const rawPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const password = await bcrypt.hash(rawPassword, 12);

    const user = await prisma.user.create({
      data: {
        email: account.email,
        username: account.username,
        name: account.name,
        bio: account.bio,
        isVerified: account.isVerified,
        password,
        emailVerified: new Date(),
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
        language: "fr",
        role: "USER",
        isDemoAccount: false,
      },
    });

    console.log(`Created official account: ${account.username}`);
  }

  console.log("Official OUTSIDE accounts created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
