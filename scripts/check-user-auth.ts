import { db } from "@/lib/db";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run auth:check -- <email>");
    process.exit(1);
  }

  const emailNorm = email.trim().toLowerCase();
  const user = await db.user.findFirst({
    where: { email: { equals: emailNorm, mode: "insensitive" } },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isVerified: true,
      createdAt: true,
      password: true,
    },
  });

  if (!user) {
    console.log(JSON.stringify({ userFound: false }));
    process.exit(0);
  }

  console.log(JSON.stringify({
    userFound: true,
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    hasPassword: Boolean(user.password),
  }));
}

main().catch((e) => {
  console.error("Error:", e?.message || e);
  process.exit(1);
});
