/**
 * Guild restructure migration — 17 → 24 categories, 6 → 7 guilds
 * Safe to run: moves existing data, doesn't delete user picks.
 *
 * Run with: npx tsx prisma/migrate-guilds.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── New guild definitions ────────────────────────────────────────────────────
const NEW_CLUSTERS = [
  { name: "The Crown",      icon: "crown",      description: "The most prestigious categories",          maxPoints: 60, sortOrder: 1, sweepType: "full",    sweepBonus: 20, partialThreshold: null, partialBonus: null },
  { name: "The Performers", icon: "performers", description: "The art of performance on screen",         maxPoints: 30, sortOrder: 2, sweepType: "full",    sweepBonus:  9, partialThreshold: null, partialBonus: null },
  { name: "The Authors",    icon: "authors",    description: "Honoring the written word in cinema",      maxPoints: 24, sortOrder: 3, sweepType: "full",    sweepBonus:  8, partialThreshold: null, partialBonus: null },
  { name: "The Eye",        icon: "eye",        description: "Visual artistry behind every frame",       maxPoints: 30, sortOrder: 4, sweepType: "partial", sweepBonus: 10, partialThreshold: 3,    partialBonus: 5    },
  { name: "The Cut",        icon: "cut",        description: "Post-production, sound and music",         maxPoints: 24, sortOrder: 5, sweepType: "partial", sweepBonus:  9, partialThreshold: 3,    partialBonus: 4    },
  { name: "The Globe",      icon: "globe",      description: "World cinema and documentary storytelling",maxPoints: 22, sortOrder: 6, sweepType: "full",    sweepBonus:  7, partialThreshold: null, partialBonus: null },
  { name: "The Shorts",     icon: "shorts",     description: "The art of short-form filmmaking",         maxPoints: 10, sortOrder: 7, sweepType: "full",    sweepBonus:  4, partialThreshold: null, partialBonus: null },
];

// ─── Category → new guild mapping ────────────────────────────────────────────
// [categoryName, newClusterName, basePoints, sortOrder, eligibleForFinalTen]
const CATEGORY_MOVES: [string, string, number, number, boolean][] = [
  // The Crown (unchanged)
  ["Best Picture",                "The Crown",      10, 1, true ],
  ["Best Director",               "The Crown",      10, 2, true ],
  ["Best Actor",                  "The Crown",      10, 3, true ],
  ["Best Actress",                "The Crown",      10, 4, true ],
  // The Performers (Casting moves here from Crafts, pts adjusted)
  ["Best Supporting Actor",       "The Performers",  7, 1, false],
  ["Best Supporting Actress",     "The Performers",  7, 2, false],
  ["Best Casting",                "The Performers",  7, 3, false],
  // The Authors (unchanged)
  ["Best Original Screenplay",    "The Authors",     8, 1, false],
  ["Best Adapted Screenplay",     "The Authors",     8, 2, false],
  // The Eye (Cinematography, Prod Design, Costume move here; Makeup is new)
  ["Best Cinematography",         "The Eye",         5, 1, false],
  ["Best Production Design",      "The Eye",         5, 2, false],
  ["Best Costume Design",         "The Eye",         5, 3, false],
  // The Cut (Film Editing moves here from Crafts; Score & Song move from Soundtrack)
  ["Best Film Editing",           "The Cut",         3, 1, false],
  ["Best Original Score",         "The Cut",         3, 2, false],
  ["Best Original Song",          "The Cut",         3, 3, false],
  // The Globe (International & Animated move here from Global & Animated)
  ["Best International Feature Film", "The Globe",   5, 1, false],
  ["Best Animated Feature Film",      "The Globe",   5, 2, false],
];

// ─── Brand new categories ─────────────────────────────────────────────────────
const NEW_CATEGORIES: [string, string, number, number][] = [
  // [name, clusterName, basePoints, sortOrder]
  ["Best Makeup and Hairstyling",  "The Eye",    5, 4],
  ["Best Sound",                   "The Cut",    3, 4],
  ["Best Visual Effects",          "The Cut",    3, 5],
  ["Best Documentary Feature Film","The Globe",  5, 3],
  ["Best Animated Short Film",     "The Shorts", 2, 1],
  ["Best Documentary Short Film",  "The Shorts", 2, 2],
  ["Best Live Action Short Film",  "The Shorts", 2, 3],
];

// ─── Nominees for new categories ─────────────────────────────────────────────
const NEW_NOMINEES: Record<string, { displayName: string; filmTitle?: string }[]> = {
  "Best Makeup and Hairstyling": [
    { displayName: "Mike Hill, Jordan Samuel & Cliona Furey",          filmTitle: "Frankenstein" },
    { displayName: "Kyoko Toyokawa, Naomi Hibino & Tadashi Nishimatsu",filmTitle: "Kokuho" },
    { displayName: "Ken Diaz, Mike Fontaine & Shunika Terry",          filmTitle: "Sinners" },
    { displayName: "Kazu Hiro, Glen Griffin & Bjoern Rehbein",         filmTitle: "The Smashing Machine" },
    { displayName: "Thomas Foldberg & Anne Cathrine Sauerberg",        filmTitle: "The Ugly Stepsister" },
  ],
  "Best Sound": [
    { displayName: "Gareth John, Al Nelson, Gwendolyn Yates Whittle et al.", filmTitle: "F1" },
    { displayName: "Greg Chapman, Nathan Robitaille, Nelson Ferreira et al.", filmTitle: "Frankenstein" },
    { displayName: "José Antonio García, Christopher Scarabosio & Tony Villaflor", filmTitle: "One Battle After Another" },
    { displayName: "Chris Welcker, Benjamin A. Burtt, Felipe Pacheco et al.", filmTitle: "Sinners" },
    { displayName: "Amanda Villavieja, Laia Casanovas & Yasmina Praderas", filmTitle: "Sirāt" },
  ],
  "Best Visual Effects": [
    { displayName: "Joe Letteri, Richard Baneham, Eric Saindon & Daniel Barrett", filmTitle: "Avatar: Fire and Ash" },
    { displayName: "Ryan Tudhope, Nicolas Chevallier, Robert Harrington & Keith Dawson", filmTitle: "F1" },
    { displayName: "David Vickery, Stephen Aplin, Charmaine Chan & Neil Corbould", filmTitle: "Jurassic World Rebirth" },
    { displayName: "Charlie Noble, David Zaretti, Russell Bowen & Brandon K. McLaughlin", filmTitle: "The Lost Bus" },
    { displayName: "Michael Ralla, Espen Nordahl, Guido Wolter & Donnie Dean", filmTitle: "Sinners" },
  ],
  "Best Documentary Feature Film": [
    { displayName: "The Alabama Solution",       filmTitle: "The Alabama Solution" },
    { displayName: "Come See Me in the Good Light", filmTitle: "Come See Me in the Good Light" },
    { displayName: "Cutting through Rocks",      filmTitle: "Cutting through Rocks" },
    { displayName: "Mr. Nobody against Putin",   filmTitle: "Mr. Nobody against Putin" },
    { displayName: "The Perfect Neighbor",       filmTitle: "The Perfect Neighbor" },
  ],
  "Best Animated Short Film": [
    { displayName: "Butterfly",               filmTitle: "Butterfly" },
    { displayName: "Forevergreen",            filmTitle: "Forevergreen" },
    { displayName: "The Girl Who Cried Pearls", filmTitle: "The Girl Who Cried Pearls" },
    { displayName: "Retirement Plan",         filmTitle: "Retirement Plan" },
    { displayName: "The Three Sisters",       filmTitle: "The Three Sisters" },
  ],
  "Best Documentary Short Film": [
    { displayName: "All the Empty Rooms",     filmTitle: "All the Empty Rooms" },
    { displayName: "Armed Only with a Camera",filmTitle: "Armed Only with a Camera: The Life and Death of Brent Renaud" },
    { displayName: 'Children No More: "Were and Are Gone"', filmTitle: 'Children No More: "Were and Are Gone"' },
    { displayName: "The Devil Is Busy",       filmTitle: "The Devil Is Busy" },
    { displayName: "Perfectly a Strangeness", filmTitle: "Perfectly a Strangeness" },
  ],
  "Best Live Action Short Film": [
    { displayName: "Butcher's Stain",         filmTitle: "Butcher's Stain" },
    { displayName: "A Friend of Dorothy",     filmTitle: "A Friend of Dorothy" },
    { displayName: "Jane Austen's Period Drama", filmTitle: "Jane Austen's Period Drama" },
    { displayName: "The Singers",             filmTitle: "The Singers" },
    { displayName: "Two People Exchanging Saliva", filmTitle: "Two People Exchanging Saliva" },
  ],
};

async function main() {
  console.log("🎬 Guild restructure migration — 17 → 24 categories\n");

  // ─── 1. Create new clusters ───────────────────────────────────────────────
  console.log("Creating new clusters...");
  const clusterMap: Record<string, string> = {}; // name → id

  for (const c of NEW_CLUSTERS) {
    // Check if already exists (idempotent)
    const existing = await prisma.cluster.findFirst({ where: { name: c.name } });
    if (existing) {
      clusterMap[c.name] = existing.id;
      // Update in case points changed
      await prisma.cluster.update({
        where: { id: existing.id },
        data: {
          maxPoints: c.maxPoints,
          sortOrder: c.sortOrder,
          sweepType: c.sweepType,
          sweepBonus: c.sweepBonus,
          partialThreshold: c.partialThreshold,
          partialBonus: c.partialBonus,
          icon: c.icon,
          description: c.description,
        },
      });
      console.log(`  ↷ Updated existing: ${c.name}`);
    } else {
      const cluster = await prisma.cluster.create({ data: c });
      clusterMap[c.name] = cluster.id;
      console.log(`  ✓ Created: ${c.name}`);
    }
  }

  // ─── 2. Move existing categories to new clusters ──────────────────────────
  console.log("\nMoving existing categories...");
  for (const [catName, clusterName, basePoints, sortOrder, eligibleForFinalTen] of CATEGORY_MOVES) {
    const cat = await prisma.category.findFirst({ where: { name: catName } });
    if (!cat) {
      console.warn(`  ⚠ Category not found: ${catName}`);
      continue;
    }
    const newClusterId = clusterMap[clusterName];
    await prisma.category.update({
      where: { id: cat.id },
      data: { clusterId: newClusterId, basePoints, sortOrder, eligibleForFinalTen },
    });
    console.log(`  ✓ ${catName} → ${clusterName} (${basePoints} pts)`);
  }

  // ─── 3. Create new categories ─────────────────────────────────────────────
  console.log("\nCreating new categories...");
  for (const [name, clusterName, basePoints, sortOrder] of NEW_CATEGORIES) {
    const existing = await prisma.category.findFirst({ where: { name } });
    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { clusterId: clusterMap[clusterName], basePoints, sortOrder },
      });
      console.log(`  ↷ Updated existing: ${name}`);
    } else {
      await prisma.category.create({
        data: {
          name,
          clusterId: clusterMap[clusterName],
          basePoints,
          sortOrder,
          eligibleForFinalTen: false,
        },
      });
      console.log(`  ✓ Created: ${name}`);
    }
  }

  // ─── 4. Delete old clusters (now empty) ───────────────────────────────────
  console.log("\nRemoving old clusters...");
  const oldClusterNames = ["Global & Animated", "Soundtrack", "The Crafts"];
  for (const name of oldClusterNames) {
    const cluster = await prisma.cluster.findFirst({ where: { name } });
    if (cluster) {
      const catCount = await prisma.category.count({ where: { clusterId: cluster.id } });
      if (catCount === 0) {
        await prisma.cluster.delete({ where: { id: cluster.id } });
        console.log(`  ✓ Deleted empty cluster: ${name}`);
      } else {
        console.warn(`  ⚠ Cluster "${name}" still has ${catCount} categories — skipping delete`);
      }
    }
  }

  // ─── 5. Seed nominees for new categories ──────────────────────────────────
  console.log("\nSeeding nominees for new categories...");
  for (const [catName, nominees] of Object.entries(NEW_NOMINEES)) {
    const cat = await prisma.category.findFirst({ where: { name: catName } });
    if (!cat) {
      console.warn(`  ⚠ Category not found: ${catName}`);
      continue;
    }
    const existing = await prisma.nominee.count({ where: { categoryId: cat.id } });
    if (existing > 0) {
      console.log(`  ↷ ${catName}: already has nominees — skipping`);
      continue;
    }
    for (let i = 0; i < nominees.length; i++) {
      await prisma.nominee.create({
        data: { categoryId: cat.id, displayName: nominees[i].displayName, filmTitle: nominees[i].filmTitle ?? null, sortOrder: i + 1 },
      });
    }
    console.log(`  ✓ ${catName}: added ${nominees.length} nominees`);
  }

  // ─── 6. Summary ───────────────────────────────────────────────────────────
  const clusterCount = await prisma.cluster.count();
  const categoryCount = await prisma.category.count();
  const nomineeCount = await prisma.nominee.count();
  console.log(`\n✅ Migration complete!`);
  console.log(`   ${clusterCount} guilds, ${categoryCount} categories, ${nomineeCount} nominees`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
