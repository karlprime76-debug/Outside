/*
  Repair demo media URLs in Moments where mediaUrl erroneously starts with "/public/".
  Usage: ts-node scripts/repair-demo-media.ts
*/

import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const candidates = await prisma.moment.findMany({
      where: {
        isDemo: true,
        mediaUrl: { contains: "/public/" },
      },
      select: { id: true, mediaUrl: true },
    });

    if (candidates.length === 0) {
      console.log("No demo moments with /public/ URLs found.");
      return;
    }

    console.log(`Found ${candidates.length} demo moments with /public/ prefix.`);

    for (const m of candidates) {
      let fixed = m.mediaUrl;
      // Case 1: relative path starting with /public/
      if (fixed.startsWith("/public/")) {
        fixed = fixed.replace(/^\/public\//, "/");
      } else {
        // Case 2: absolute URL with pathname starting with /public/
        try {
          const u = new URL(fixed);
          if ((u.protocol === "http:" || u.protocol === "https:") && u.pathname.startsWith("/public/")) {
            u.pathname = u.pathname.replace(/^\/public\//, "/");
            fixed = u.toString();
          }
        } catch {
          // not a valid absolute URL; skip
        }
      }

      if (fixed !== m.mediaUrl) {
        await prisma.moment.update({ where: { id: m.id }, data: { mediaUrl: fixed } });
        console.log(`Updated moment ${m.id}: ${m.mediaUrl} -> ${fixed}`);
      }
    }

    console.log("Repair completed.");
  } finally {
    await (global as any).prisma?.$disconnect?.().catch(() => {});
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
