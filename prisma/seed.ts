/**
 * Seed: creates a default studio and owner account.
 * Run: npm run db:seed
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const adapter = new PrismaNeon({
  connectionString: process.env["DATABASE_URL"]!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_OWNER_EMAIL ?? "owner@studio.local";
  const password = process.env.SEED_OWNER_PASSWORD ?? "changeme123";
  const studioName = process.env.SEED_STUDIO_NAME ?? "Atnachta Studio";
  const studioSlug = process.env.SEED_STUDIO_SLUG ?? "atnachta";

  // Upsert studio
  const studio = await prisma.studio.upsert({
    where: { slug: studioSlug },
    create: {
      name: studioName,
      publicName: studioName,
      slug: studioSlug,
      planType: "FREE",
    },
    update: {},
  });

  // Upsert owner user
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Studio Owner",
      passwordHash,
    },
    update: {},
  });

  // Upsert membership
  await prisma.studioMember.upsert({
    where: { studioId_userId: { studioId: studio.id, userId: user.id } },
    create: {
      studioId: studio.id,
      userId: user.id,
      role: "OWNER",
      isActive: true,
      joinedAt: new Date(),
    },
    update: { role: "OWNER" },
  });

  console.log(`✓ Studio: ${studio.name} (${studio.slug})`);
  console.log(`✓ Owner:  ${user.email}`);
  console.log(`  Password: ${password}`);
  console.log("");
  console.log("Done. Change your password after first login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
