import { db } from "../src/lib/db";
import { searchPixabayTracks } from "../src/lib/audio/pixabay";

const SEED_QUERIES = [
  "happy",
  "chill",
  "upbeat",
  "ambient",
  "electronic",
  "acoustic",
  "hip hop",
  "jazz",
  "lofi",
  "pop",
  "indie",
  "dance",
  "rnb",
  "soul",
  "rock",
  "folk",
  "classical",
  "latin",
  "reggae",
  "cinematic",
];

async function main() {
  const existing = await db.audioTrack.count({
    where: { sourceType: "OUTSIDE_LIBRARY" },
  });

  if (existing >= 20) {
    console.log(`Already seeded with ${existing} tracks, skipping.`);
    return;
  }

  console.log("Seeding audio tracks from Pixabay...");

  for (const query of SEED_QUERIES) {
    try {
      const tracks = await searchPixabayTracks(query, 5);
      for (const track of tracks) {
        const exists = await db.audioTrack.findFirst({
          where: { title: track.title, artistName: track.artistName },
        });
        if (exists) continue;

        await db.audioTrack.create({
          data: {
            title: track.title,
            artistName: track.artistName,
            sourceType: "OUTSIDE_LIBRARY",
            status: "ACTIVE",
            audioUrl: track.audioUrl,
            duration: Math.round(track.duration),
            isOfficial: true,
            rightsConfirmed: true,
          },
        });
        console.log(`  Seeded: ${track.title} by ${track.artistName}`);
      }
    } catch (err) {
      console.error(`  Failed to seed "${query}":`, err);
    }
  }

  const total = await db.audioTrack.count({
    where: { sourceType: "OUTSIDE_LIBRARY" },
  });
  console.log(`Done. Total library tracks: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
