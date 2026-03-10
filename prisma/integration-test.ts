/**
 * Integration test: 3 test users × curated picks × published winners → score validation
 * Run: npx tsx prisma/integration-test.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { computeScore, ClusterDef, CategoryDef } from "../src/lib/scoring";

const prisma = new PrismaClient();

// ─── ANSI colours ────────────────────────────────────────────────
const G = "\x1b[32m✓\x1b[0m";
const R = "\x1b[31m✗\x1b[0m";
const Y = "\x1b[33m";
const W = "\x1b[0m";
const B = "\x1b[36m";

let passed = 0;
let failed = 0;

function assert(label: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    console.log(`  ${G} ${label}`);
    passed++;
  } else {
    console.log(`  ${R} ${label} — expected ${Y}${expected}${W}, got ${Y}${actual}${W}`);
    failed++;
  }
}

async function main() {
  console.log(`\n${B}═══ Oscar Ballot 2026 – Integration Test ═══${W}\n`);

  // ── 1. Load schema ────────────────────────────────────────────
  const clustersDb = await prisma.cluster.findMany({
    include: { categories: { include: { nominees: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

  const clusterDefs: ClusterDef[] = clustersDb.map((c) => ({
    id: c.id,
    name: c.name,
    sortOrder: c.sortOrder,
    sweepType: c.sweepType as "full" | "partial" | "none",
    sweepBonus: c.sweepBonus,
    partialThreshold: c.partialThreshold ?? undefined,
    partialBonus: c.partialBonus ?? undefined,
    categories: c.categories.map((cat): CategoryDef => ({
      id: cat.id,
      name: cat.name,
      basePoints: cat.basePoints,
      clusterId: cat.clusterId,
      eligibleForFinalTen: cat.eligibleForFinalTen,
    })),
  }));

  // Map category name → first nominee id (winner), second nominee id (loser)
  const catMap: Record<string, { id: string; winner: string; loser: string; name: string }> = {};
  for (const cl of clustersDb) {
    for (const cat of cl.categories) {
      catMap[cat.name] = {
        id: cat.id,
        winner: cat.nominees[0]?.id ?? "",
        loser: cat.nominees[1]?.id ?? cat.nominees[0]?.id ?? "",
        name: cat.name,
      };
    }
  }

  const allCats = Object.values(catMap);
  const crownCat = clustersDb.find((c) => c.sortOrder === 1)?.categories[0];
  if (!crownCat) throw new Error("Crown cluster not found");
  const crownFinalTenWinner = crownCat.nominees[0]?.id ?? "";
  const crownFinalTenLoser = crownCat.nominees[1]?.id ?? crownCat.nominees[0]?.id ?? "";

  console.log(`${B}1. Schema loaded:${W} ${clustersDb.length} guilds, ${allCats.length} categories\n`);

  // ── 2. Clean up any previous test run ────────────────────────
  await prisma.winnerPublished.deleteMany();
  await prisma.winnerDraft.deleteMany();
  const testEmails = ["tester-ace@test.com", "tester-mid@test.com", "tester-zero@test.com"];
  for (const email of testEmails) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.pick.deleteMany({ where: { userId: u.id } });
      await prisma.finalTenPick.deleteMany({ where: { userId: u.id } });
      await prisma.computedScore.deleteMany({ where: { userId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
  }

  // ── 3. Create 3 test users ────────────────────────────────────
  console.log(`${B}2. Creating test users...${W}`);
  const pw = await bcrypt.hash("test1234", 10);

  const ace  = await prisma.user.create({ data: { email: testEmails[0], passwordHash: pw, displayName: "Ace (all correct)" } });
  const mid  = await prisma.user.create({ data: { email: testEmails[1], passwordHash: pw, displayName: "Mid (Crown only)" } });
  const zero = await prisma.user.create({ data: { email: testEmails[2], passwordHash: pw, displayName: "Zero (all wrong)" } });

  console.log(`  ${G} Created: ${ace.displayName}`);
  console.log(`  ${G} Created: ${mid.displayName}`);
  console.log(`  ${G} Created: ${zero.displayName}\n`);

  const now = new Date();

  // ── 4. Assign picks ──────────────────────────────────────────
  console.log(`${B}3. Assigning picks...${W}`);

  // ACE: picks winner for every category + correct Final 10
  for (const cat of allCats) {
    await prisma.pick.create({ data: { userId: ace.id, categoryId: cat.id, nomineeId: cat.winner, lockedAt: now } });
  }
  await prisma.finalTenPick.create({ data: { userId: ace.id, categoryId: crownCat.id, nomineeId: crownFinalTenWinner, lockedAt: now } });
  console.log(`  ${G} Ace: all ${allCats.length} correct picks + Final 10 correct`);

  // MID: picks winner for Crown guild only (4 cats), loser for everything else, wrong Final 10
  for (const cl of clustersDb) {
    for (const cat of cl.categories) {
      const nomineeId = cl.sortOrder === 1 ? catMap[cat.name].winner : catMap[cat.name].loser;
      await prisma.pick.create({ data: { userId: mid.id, categoryId: cat.id, nomineeId, lockedAt: now } });
    }
  }
  await prisma.finalTenPick.create({ data: { userId: mid.id, categoryId: crownCat.id, nomineeId: crownFinalTenLoser, lockedAt: now } });
  console.log(`  ${G} Mid: Crown guild all correct, others wrong, Final 10 wrong`);

  // ZERO: picks loser for every category + wrong Final 10
  for (const cat of allCats) {
    await prisma.pick.create({ data: { userId: zero.id, categoryId: cat.id, nomineeId: cat.loser, lockedAt: now } });
  }
  await prisma.finalTenPick.create({ data: { userId: zero.id, categoryId: crownCat.id, nomineeId: crownFinalTenLoser, lockedAt: now } });
  console.log(`  ${G} Zero: all wrong picks + Final 10 wrong\n`);

  // ── 5. Set draft winners (nominee[0] in every category) ──────
  console.log(`${B}4. Setting draft winners (nominee[0] for each category)...${W}`);
  const adminUser = await prisma.user.findFirst({ where: { role: "admin" } });
  if (!adminUser) throw new Error("No admin user found — run seed first");

  for (const cat of allCats) {
    await prisma.winnerDraft.upsert({
      where: { categoryId: cat.id },
      update: { nomineeId: cat.winner, updatedBy: adminUser.id },
      create: { categoryId: cat.id, nomineeId: cat.winner, updatedBy: adminUser.id },
    });
  }
  console.log(`  ${G} ${allCats.length} draft winners set\n`);

  // ── 6. Publish winners (atomic) ──────────────────────────────
  console.log(`${B}5. Publishing winners...${W}`);
  const drafts = await prisma.winnerDraft.findMany();
  await prisma.$transaction(async (tx) => {
    await tx.winnerPublished.deleteMany();
    for (const draft of drafts) {
      await tx.winnerPublished.create({ data: { categoryId: draft.categoryId, nomineeId: draft.nomineeId, publishedBy: adminUser.id } });
    }
  });
  const publishedCount = await prisma.winnerPublished.count();
  console.log(`  ${G} ${publishedCount} winners published\n`);

  // ── 7. Compute scores ─────────────────────────────────────────
  console.log(`${B}6. Computing scores...${W}`);
  const winners = (await prisma.winnerPublished.findMany()).map((w) => ({ categoryId: w.categoryId, nomineeId: w.nomineeId }));

  const testUsers = [ace, mid, zero];
  const scores: Record<string, { breakdown: ReturnType<typeof computeScore>; userId: string }> = {};

  for (const user of testUsers) {
    const picks = (await prisma.pick.findMany({ where: { userId: user.id } })).map((p) => ({ categoryId: p.categoryId, nomineeId: p.nomineeId }));
    const ft = await prisma.finalTenPick.findUnique({ where: { userId: user.id } });
    const finalTen = ft ? { categoryId: ft.categoryId, nomineeId: ft.nomineeId } : null;
    const bd = computeScore(clusterDefs, picks, finalTen, winners);
    scores[user.id] = { breakdown: bd, userId: user.id };

    await prisma.computedScore.upsert({
      where: { userId: user.id },
      update: { totalScore: bd.totalScore, crownPoints: bd.crownPoints, correctCount: bd.correctCount, breakdownJson: JSON.stringify(bd) },
      create: { userId: user.id, totalScore: bd.totalScore, crownPoints: bd.crownPoints, correctCount: bd.correctCount, breakdownJson: JSON.stringify(bd) },
    });
  }

  // ── 8. Assert expected scores ─────────────────────────────────
  console.log(`\n${B}7. Score assertions:${W}`);

  const aceScore  = scores[ace.id].breakdown;
  const midScore  = scores[mid.id].breakdown;
  const zeroScore = scores[zero.id].breakdown;

  // Expected: Ace scores 200 (all correct + Final 10)
  assert("Ace total score = 200", aceScore.totalScore, 200);
  assert("Ace correct count = 17", aceScore.correctCount, 17);
  assert("Ace Crown guild = 60", aceScore.crownPoints, 60);
  assert("Ace Final 10 = 10 pts", aceScore.finalTen.points, 10);
  assert("Ace Final 10 correct", aceScore.finalTen.correct, true);

  // Ace sweep bonuses
  let aceTotalBonus = 0;
  for (const cl of aceScore.clusters) aceTotalBonus += cl.sweepBonusEarned;
  assert("Ace total sweep bonuses = 72", aceTotalBonus, 72);

  // Expected: Mid scores Crown only = 60 (all 4 correct + sweep), others 0, Final 10 wrong
  assert("Mid total score = 60", midScore.totalScore, 60);
  assert("Mid Crown guild = 60", midScore.crownPoints, 60);
  assert("Mid correct count = 4", midScore.correctCount, 4);
  assert("Mid Final 10 = 0 pts", midScore.finalTen.points, 0);
  assert("Mid Final 10 wrong", midScore.finalTen.correct, false);

  // Expected: Zero scores 0
  assert("Zero total score = 0", zeroScore.totalScore, 0);
  assert("Zero correct count = 0", zeroScore.correctCount, 0);
  assert("Zero Final 10 = 0 pts", zeroScore.finalTen.points, 0);

  // ── 9. Leaderboard order ──────────────────────────────────────
  console.log(`\n${B}8. Leaderboard order:${W}`);
  const allScores = await prisma.computedScore.findMany({
    where: { userId: { in: [ace.id, mid.id, zero.id] } },
    include: { user: { select: { displayName: true } } },
    orderBy: { totalScore: "desc" },
  });

  allScores.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.user.displayName} — ${Y}${s.totalScore} pts${W}`);
  });

  assert("Rank 1 = Ace",  allScores[0]?.user.displayName, "Ace (all correct)");
  assert("Rank 2 = Mid",  allScores[1]?.user.displayName, "Mid (Crown only)");
  assert("Rank 3 = Zero", allScores[2]?.user.displayName, "Zero (all wrong)");

  // ── 10. Cleanup ───────────────────────────────────────────────
  console.log(`\n${B}9. Cleaning up test data...${W}`);
  for (const user of testUsers) {
    await prisma.pick.deleteMany({ where: { userId: user.id } });
    await prisma.finalTenPick.deleteMany({ where: { userId: user.id } });
    await prisma.computedScore.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
  await prisma.winnerPublished.deleteMany();
  await prisma.winnerDraft.deleteMany();
  console.log(`  ${G} Test data removed\n`);

  // ── Summary ───────────────────────────────────────────────────
  console.log(`${B}═══ Results: ${passed} passed, ${failed} failed ═══${W}\n`);
  if (failed > 0) process.exit(1);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
