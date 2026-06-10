import { db } from "@/lib/db";

const BADGES = [
  { key: "trust_active", name: "Profil actif", description: "Utilisateur actif sur OUTSIDE", icon: "shield" },
  { key: "trust_reliable", name: "Fiable", description: "Membre de confiance validé par la communauté", icon: "shield-check" },
  { key: "trust_organizer", name: "Organisateur sérieux", description: "Organise régulièrement des plans de qualité", icon: "star" },
  { key: "trust_ambassador", name: "Ambassadeur local", description: "Ambassadeur local OUTSIDE", icon: "crown" },
  { key: "presence_confirmed", name: "Présence confirmée", description: "A participé à des plans confirmés par la communauté", icon: "users" },
  { key: "organizer_confirmed", name: "Organisateur confirmé", description: "A créé des plans validés positivement", icon: "party-popper" },
];

async function seedBadges() {
  console.log("Seeding trust badges...");

  for (const badge of BADGES) {
    const existing = await db.badge.findUnique({ where: { key: badge.key } });
    if (!existing) {
      await db.badge.create({ data: badge });
      console.log(`  Created badge: ${badge.key} (${badge.name})`);
    } else {
      console.log(`  Already exists: ${badge.key} (${badge.name})`);
    }
  }

  console.log("Done seeding badges.");
  process.exit(0);
}

seedBadges().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
