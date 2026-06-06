import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Creating official OUTSIDE accounts...");

  const officialAccounts = [
    {
      email: "guide@outside.com",
      username: "outside_guide",
      name: "OUTSIDE Guide",
      accountKind: "OFFICIAL_GUIDE" as const,
      bio: "Compte officiel OUTSIDE - Guide et conseils pour profiter de l'app",
      isVerified: true,
    },
    {
      email: "cotonou@outside.com",
      username: "outside_cotonou",
      name: "OUTSIDE Cotonou",
      accountKind: "OFFICIAL_CITY" as const,
      bio: "Compte officiel OUTSIDE Cotonou - Découvre les meilleurs plans à Cotonou",
      isVerified: true,
    },
    {
      email: "abidjan@outside.com",
      username: "outside_abidjan",
      name: "OUTSIDE Abidjan",
      accountKind: "OFFICIAL_CITY" as const,
      bio: "Compte officiel OUTSIDE Abidjan - Découvre les meilleurs plans à Abidjan",
      isVerified: true,
    },
    {
      email: "paris@outside.com",
      username: "outside_paris",
      name: "OUTSIDE Paris",
      accountKind: "OFFICIAL_CITY" as const,
      bio: "Compte officiel OUTSIDE Paris - Découvre les meilleurs plans à Paris",
      isVerified: true,
    },
    {
      email: "food@outside.com",
      username: "outside_food",
      name: "OUTSIDE Food",
      accountKind: "OFFICIAL_GUIDE" as const,
      bio: "Compte officiel OUTSIDE Food - Les meilleurs plans food et restaurants",
      isVerified: true,
    },
    {
      email: "night@outside.com",
      username: "outside_night",
      name: "OUTSIDE Night",
      accountKind: "OFFICIAL_GUIDE" as const,
      bio: "Compte officiel OUTSIDE Night - Les meilleurs plans nocturnes et sorties",
      isVerified: true,
    },
    {
      email: "sport@outside.com",
      username: "outside_sport",
      name: "OUTSIDE Sport",
      accountKind: "OFFICIAL_GUIDE" as const,
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
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

    const user = await prisma.user.create({
      data: {
        email: account.email,
        username: account.username,
        name: account.name,
        accountKind: account.accountKind,
        bio: account.bio,
        isVerified: account.isVerified,
        password: password,
        emailVerified: new Date(),
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
        language: "fr",
        role: "USER",
        isDemoAccount: false,
      },
    });

    console.log(`Created official account: ${account.username} (${account.accountKind})`);
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
