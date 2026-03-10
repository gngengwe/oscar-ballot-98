/**
 * Production seed — safe to run on a live database.
 * Only creates records that don't already exist. Never deletes.
 *
 * Run once after first deploy:
 *   npx tsx prisma/seed-prod.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🎬 Oscar Ballot 98 — Production Setup\n");

  // ─── Admin user ───────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || "gngengwe@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme123";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingAdmin) {
    console.log(`✓ Admin already exists: ${adminEmail}`);
  } else {
    const hash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: { email: adminEmail, passwordHash: hash, displayName: "Admin", role: "admin" },
    });
    console.log(`✓ Admin created: ${adminEmail}`);
  }

  // ─── Global settings ─────────────────────────────────────────
  const existingSettings = await prisma.globalSettings.findUnique({ where: { id: "singleton" } });
  if (existingSettings) {
    console.log("✓ Ballot window already configured");
  } else {
    const now = new Date();
    const closesAt = new Date(now);
    closesAt.setDate(closesAt.getDate() + 30);
    await prisma.globalSettings.create({
      data: { ballotOpensAt: now, ballotClosesAt: closesAt, timezone: "America/Los_Angeles" },
    });
    console.log("✓ Default ballot window set (open now → 30 days)");
  }

  // ─── Clusters + Categories ────────────────────────────────────
  const clusterCount = await prisma.cluster.count();
  if (clusterCount > 0) {
    console.log(`✓ Guilds already exist (${clusterCount} found) — skipping`);
  } else {
    const clusterData = [
      { name: "The Crown",        icon: "crown",      description: "The most prestigious categories",             maxPoints: 60, sortOrder: 1, sweepType: "full",    sweepBonus: 20, partialThreshold: null, partialBonus: null },
      { name: "The Performers",   icon: "performers", description: "Outstanding supporting performances",         maxPoints: 26, sortOrder: 2, sweepType: "full",    sweepBonus: 10, partialThreshold: null, partialBonus: null },
      { name: "The Authors",      icon: "authors",    description: "Honoring the written word in cinema",         maxPoints: 28, sortOrder: 3, sweepType: "full",    sweepBonus: 12, partialThreshold: null, partialBonus: null },
      { name: "Global & Animated",icon: "global",     description: "Stories that transcend borders",              maxPoints: 24, sortOrder: 4, sweepType: "full",    sweepBonus: 10, partialThreshold: null, partialBonus: null },
      { name: "Soundtrack",       icon: "soundtrack", description: "The music that moves us",                     maxPoints: 20, sortOrder: 5, sweepType: "full",    sweepBonus:  8, partialThreshold: null, partialBonus: null },
      { name: "The Crafts",       icon: "crafts",     description: "The artistry behind the camera",              maxPoints: 32, sortOrder: 6, sweepType: "partial", sweepBonus: 12, partialThreshold: 4,    partialBonus: 5    },
    ];

    const clusters: Record<string, string> = {};
    for (const c of clusterData) {
      const cluster = await prisma.cluster.create({ data: c });
      clusters[c.name] = cluster.id;
    }

    const categoryData = [
      // The Crown
      { clusterName: "The Crown",        name: "Best Picture",               basePoints: 10, eligibleForFinalTen: true,  sortOrder: 1 },
      { clusterName: "The Crown",        name: "Best Director",              basePoints: 10, eligibleForFinalTen: true,  sortOrder: 2 },
      { clusterName: "The Crown",        name: "Best Actor",                 basePoints: 10, eligibleForFinalTen: true,  sortOrder: 3 },
      { clusterName: "The Crown",        name: "Best Actress",               basePoints: 10, eligibleForFinalTen: true,  sortOrder: 4 },
      // The Performers
      { clusterName: "The Performers",   name: "Best Supporting Actor",      basePoints:  8, eligibleForFinalTen: false, sortOrder: 1 },
      { clusterName: "The Performers",   name: "Best Supporting Actress",    basePoints:  8, eligibleForFinalTen: false, sortOrder: 2 },
      // The Authors
      { clusterName: "The Authors",      name: "Best Original Screenplay",   basePoints:  8, eligibleForFinalTen: false, sortOrder: 1 },
      { clusterName: "The Authors",      name: "Best Adapted Screenplay",    basePoints:  8, eligibleForFinalTen: false, sortOrder: 2 },
      // Global & Animated
      { clusterName: "Global & Animated",name: "Best International Feature Film", basePoints: 7, eligibleForFinalTen: false, sortOrder: 1 },
      { clusterName: "Global & Animated",name: "Best Animated Feature Film", basePoints:  7, eligibleForFinalTen: false, sortOrder: 2 },
      // Soundtrack
      { clusterName: "Soundtrack",       name: "Best Original Score",        basePoints:  6, eligibleForFinalTen: false, sortOrder: 1 },
      { clusterName: "Soundtrack",       name: "Best Original Song",         basePoints:  6, eligibleForFinalTen: false, sortOrder: 2 },
      // The Crafts
      { clusterName: "The Crafts",       name: "Best Cinematography",        basePoints:  4, eligibleForFinalTen: false, sortOrder: 1 },
      { clusterName: "The Crafts",       name: "Best Production Design",     basePoints:  4, eligibleForFinalTen: false, sortOrder: 2 },
      { clusterName: "The Crafts",       name: "Best Costume Design",        basePoints:  4, eligibleForFinalTen: false, sortOrder: 3 },
      { clusterName: "The Crafts",       name: "Best Film Editing",          basePoints:  4, eligibleForFinalTen: false, sortOrder: 4 },
      { clusterName: "The Crafts",       name: "Best Casting",               basePoints:  4, eligibleForFinalTen: false, sortOrder: 5 },
    ];

    for (const cat of categoryData) {
      await prisma.category.create({
        data: {
          name: cat.name,
          clusterId: clusters[cat.clusterName],
          basePoints: cat.basePoints,
          eligibleForFinalTen: cat.eligibleForFinalTen,
          sortOrder: cat.sortOrder,
        },
      });
    }
    console.log(`✓ 6 guilds + ${categoryData.length} categories created`);
    console.log("  → Add nominees via the admin panel at /admin → Nominees");
  }

  // ─── Awards Year ──────────────────────────────────────────────
  const yearExists = await prisma.awardsYear.findFirst({ where: { year: 2026 } });
  if (!yearExists) {
    await prisma.awardsYear.create({ data: { label: "98th", year: 2026, isActive: true } });
    console.log("✓ Awards year record created (98th / 2026)");
  }

  console.log("\n✅ Production setup complete!");
  console.log("─────────────────────────────────────────────");
  console.log(`Admin login: ${adminEmail}`);
  console.log("Next steps:");
  console.log("  1. Sign in at /auth/signin");
  console.log("  2. Go to /admin → Nominees to add nominees");
  console.log("  3. Go to /admin → Ballot Window to set open/close dates");
  console.log("  4. Go to /admin → Ticker to add content");
  console.log("─────────────────────────────────────────────");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
