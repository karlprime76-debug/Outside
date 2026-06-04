import { PrismaClient, MomentType, MomentVisibility, BudgetLevel, Mood, PlaceCategory, PlanCategory, PlanStatus, PlanVisibility, LiveStatus, LiveVisibility } from "@prisma/client";

const prisma = new PrismaClient();

// Cities catalogue: minimal required fields for City model
const CITIES = [
  { name: "Paris", country: "France", countryCode: "FR", currency: "EUR", timezone: "Europe/Paris", latitude: 48.8566, longitude: 2.3522 },
  { name: "Lyon", country: "France", countryCode: "FR", currency: "EUR", timezone: "Europe/Paris", latitude: 45.7640, longitude: 4.8357 },
  { name: "Marseille", country: "France", countryCode: "FR", currency: "EUR", timezone: "Europe/Paris", latitude: 43.2965, longitude: 5.3698 },
  { name: "Dakar", country: "Sénégal", countryCode: "SN", currency: "XOF", timezone: "Africa/Dakar", latitude: 14.7167, longitude: -17.4677 },
  { name: "Abidjan", country: "Côte d'Ivoire", countryCode: "CI", currency: "XOF", timezone: "Africa/Abidjan", latitude: 5.3599, longitude: -4.0083 },
  { name: "Cotonou", country: "Bénin", countryCode: "BJ", currency: "XOF", timezone: "Africa/Porto-Novo", latitude: 6.3703, longitude: 2.3912 },
  { name: "Montréal", country: "Canada", countryCode: "CA", currency: "CAD", timezone: "America/Toronto", latitude: 45.5017, longitude: -73.5673 },
  { name: "New York", country: "États-Unis", countryCode: "US", currency: "USD", timezone: "America/New_York", latitude: 40.7128, longitude: -74.0060 },
  { name: "Londres", country: "Royaume-Uni", countryCode: "GB", currency: "GBP", timezone: "Europe/London", latitude: 51.5074, longitude: -0.1278 },
  { name: "Madrid", country: "Espagne", countryCode: "ES", currency: "EUR", timezone: "Europe/Madrid", latitude: 40.4168, longitude: -3.7038 },
  { name: "Berlin", country: "Allemagne", countryCode: "DE", currency: "EUR", timezone: "Europe/Berlin", latitude: 52.5200, longitude: 13.4050 },
];

const FIRST_NAMES = [
  "Amine","Sarah","Léa","Yanis","Mariam","Lucas","Nina","Sofiane","Aïcha","Noah",
  "Inès","Omar","Chloé","Yara","Kofi","Moussa","Imane","Hugo","Camille","Sasha",
  "Ibrahim","Assa","Aya","Liam","Zara","Ethan","Naïm","Maya","Khadija","Youssef",
];
const LAST_NAMES = [
  "Diop","Traoré","Tremblay","Martins","Nguyen","Benali","Dubois","Moreau","Cissé","Kouassi",
  "Diallo","Bernard","Lam","Garcia","Legrand","Guerin","Lopez","Laurent","Carvalho","Roy",
  "Smith","Johnson","Brown","Martin","Leroy","Petit","Rossi","Müller","Schmidt","Keller",
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random()*arr.length)]; }
function rand(min: number, max: number) { return Math.floor(Math.random()*(max-min+1))+min; }
function daysAgo(n: number) { const d=new Date(); d.setDate(d.getDate()-n); return d; }

async function main() {
  const DEMO_MODE = process.env.DEMO_MODE === "1" || process.env.DEMO_MODE === "true";
  if (!DEMO_MODE) {
    console.log("DEMO_MODE is off. Set DEMO_MODE=1 to enable seeding.");
    return;
  }

  // Upsert cities
  const cities = await Promise.all(CITIES.map(async (c) => {
    return prisma.city.upsert({
      where: { name_country: { name: c.name, country: c.country } },
      update: {},
      create: c,
    });
  }));

  // Create ~50 users with realistic names
  const users: { id: string; name: string | null; email: string }[] = [];
  for (let i=0; i<50; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const name = `${first} ${last}`;
    const username = `${first.toLowerCase()}_${last.toLowerCase()}_${rand(10,99)}`.replace(/[^a-z0-9_]/g, "");
    const email = `${username}@example.com`;
    const city = pick(cities);

    const u = await prisma.user.create({
      data: {
        name,
        username,
        email,
        isDemoAccount: true,
        // Passwordless demo accounts; real auth is not used for bots
        country: city.country,
        countryCode: city.countryCode,
        language: city.language,
        activeCityId: city.id,
        homeCityId: city.id,
        image: `https://i.pravatar.cc/300?img=${rand(1,70)}`,
        bio: pick([
          "Toujours partant pour sortir.",
          "Food, musique et nouvelles rencontres.",
          "Voyageur urbain.",
          "Sport et bons plans.",
          "Chill et découvertes locales.",
        ]),
        isVerified: Math.random() < 0.2,
        createdAt: daysAgo(rand(10,60)),
        trustScore: rand(0, 40),
      },
      select: { id: true, name: true, email: true },
    });
    users.push(u);
  }

  // Seed content per user
  for (const u of users) {
    const city = pick(cities);

    // Moments: 3-6 per user
    const momentsCount = rand(3,6);
    for (let i=0; i<momentsCount; i++) {
      const isVideo = Math.random() < 0.3;
      await prisma.moment.create({
        data: {
          authorId: u.id,
          type: isVideo ? MomentType.VIDEO : MomentType.PHOTO,
          mediaUrl: isVideo
            ? `https://samplelib.com/lib/preview/mp4/sample-5s${rand(1,3)}.mp4`
            : `https://picsum.photos/seed/${u.id}-${i}/800/1200` ,
          caption: pick([
            "Ambiance ce soir !",
            "Vue de la ville.",
            "Bon spot à découvrir.",
            "Moment simple et cool.",
            "Ça bouge par ici.",
          ]),
          city: city.name,
          countryCode: city.countryCode,
          visibility: MomentVisibility.PUBLIC,
          isDemo: true,
          createdAt: daysAgo(rand(1,20)),
        }
      });
    }

    // Plans: 1-2 per user, status COMPLETED in the past
    const plansCount = rand(1,2);
    for (let i=0; i<plansCount; i++) {
      const start = daysAgo(rand(2,15));
      const end = new Date(start.getTime()+ 2*60*60*1000);
      const plan = await prisma.plan.create({
        data: {
          title: pick(["Afterwork chill", "Concert local", "Sortie food", "Balade urbaine"]),
          description: pick(["Bonne humeur.", "Découverte.", "Entre amis.", "Impromptu."]),
          planCategory: pick([PlanCategory.CHILL, PlanCategory.FOOD, PlanCategory.CULTURE, PlanCategory.SPORT]),
          mood: pick([Mood.CHILL, Mood.FOOD, Mood.MUSIC, Mood.SPORT, Mood.FRIENDS]),
          budgetLevel: pick([BudgetLevel.FREE, BudgetLevel.LOW, BudgetLevel.MEDIUM]),
          cityId: city.id,
          neighborhood: undefined,
          startDate: start,
          endDate: end,
          maxParticipants: rand(4, 12),
          visibility: pick([PlanVisibility.PUBLIC, PlanVisibility.FRIENDS]),
          status: PlanStatus.COMPLETED,
          creatorId: u.id,
          isDemo: true,
          createdAt: daysAgo(rand(5,30)),
        }
      });
      // Participant record for creator as confirmed
      await prisma.planParticipant.create({
        data: {
          planId: plan.id,
          userId: u.id,
          status: "CONFIRMED",
          joinedAt: end,
        }
      });
    }

    // Lives: 0-1 per user, ENDED
    if (Math.random() < 0.3) {
      const started = daysAgo(rand(3,12));
      const ended = new Date(started.getTime() + 45*60*1000);
      await prisma.liveSession.create({
        data: {
          title: pick(["Live ambiance", "Live quartier", "Live musique"]),
          description: pick(["Ambiance cool.", "Découverte.", "Spot local."]),
          status: LiveStatus.ENDED,
          visibility: LiveVisibility.CITY,
          city: city.name,
          country: city.country,
          countryCode: city.countryCode,
          hostId: u.id,
          viewerCount: rand(10, 120),
          startedAt: started,
          endedAt: ended,
          isDemo: true,
          createdAt: daysAgo(rand(10,40)),
        }
      });
    }
  }

  console.log("Seed demo completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
