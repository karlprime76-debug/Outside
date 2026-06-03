import { db } from "@/lib/db";

async function main() {
  const users = await db.user.findMany({ select: { id: true, username: true } });
  const map = new Map<string, string[]>();
  for (const u of users) {
    const key = (u.username || "").toLowerCase();
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(u.id);
  }

  const duplicates = Array.from(map.entries()).filter(([, ids]) => ids.length > 1);
  if (duplicates.length === 0) {
    console.log("No duplicate usernames found.");
    return;
  }

  console.log("Duplicate usernames:");
  for (const [username, ids] of duplicates) {
    console.log(`- ${username}: count=${ids.length} ids=[${ids.join(", ")}]`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
