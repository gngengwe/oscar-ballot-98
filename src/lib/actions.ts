"use server";

import { prisma } from "./prisma";
import { auth } from "./auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { computeScore, ClusterDef, CategoryDef } from "./scoring";

// ─── Helpers ─────────────────────────────────────────────────────

function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

// ─── Auth Actions ────────────────────────────────────────────────

export async function registerUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;

  if (!email || !password || !displayName) {
    return { error: "All fields are required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Invalid email address" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email already registered" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, passwordHash, displayName },
  });

  return { success: true };
}

// ─── Ballot Actions ──────────────────────────────────────────────

async function isBallotOpen(): Promise<boolean> {
  const settings = await prisma.globalSettings.findUnique({
    where: { id: "singleton" },
  });
  if (!settings) return false;
  const now = new Date();
  return now >= settings.ballotOpensAt && now <= settings.ballotClosesAt;
}

async function isUserBallotLocked(userId: string): Promise<boolean> {
  const lockedPick = await prisma.pick.findFirst({
    where: { userId, lockedAt: { not: null } },
  });
  if (lockedPick) return true;
  // Also check FinalTenPick in case picks were cleared
  const lockedFinal = await prisma.finalTenPick.findFirst({
    where: { userId, lockedAt: { not: null } },
  });
  return !!lockedFinal;
}

export async function savePick(categoryId: string, nomineeId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const open = await isBallotOpen();
  if (!open) return { error: "Ballot is closed" };

  const locked = await isUserBallotLocked(session.user.id);
  if (locked) return { error: "Ballot is committed" };

  // Verify nominee belongs to this category
  const nominee = await prisma.nominee.findFirst({
    where: { id: nomineeId, categoryId },
  });
  if (!nominee) return { error: "Invalid selection" };

  await prisma.pick.upsert({
    where: {
      userId_categoryId: {
        userId: session.user.id,
        categoryId,
      },
    },
    update: { nomineeId },
    create: {
      userId: session.user.id,
      categoryId,
      nomineeId,
    },
  });

  revalidatePath("/ballot");
  return { success: true };
}

export async function saveFinalTenPick(
  categoryId: string,
  nomineeId: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const open = await isBallotOpen();
  if (!open) return { error: "Ballot is closed" };

  const locked = await isUserBallotLocked(session.user.id);
  if (locked) return { error: "Ballot is committed" };

  // Verify category is eligible
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category?.eligibleForFinalTen) {
    return { error: "Category not eligible for Final 10" };
  }

  // Verify nominee belongs to this category
  const nominee = await prisma.nominee.findFirst({
    where: { id: nomineeId, categoryId },
  });
  if (!nominee) return { error: "Invalid nominee for this category" };

  await prisma.finalTenPick.upsert({
    where: { userId: session.user.id },
    update: { categoryId, nomineeId },
    create: {
      userId: session.user.id,
      categoryId,
      nomineeId,
    },
  });

  revalidatePath("/ballot");
  return { success: true };
}

export async function commitBallot() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const open = await isBallotOpen();
  if (!open) return { error: "Ballot is closed" };

  const locked = await isUserBallotLocked(session.user.id);
  if (locked) return { error: "Already committed" };

  // Require at least one pick before committing
  const pickCount = await prisma.pick.count({
    where: { userId: session.user.id },
  });
  if (pickCount === 0) return { error: "Make at least one pick before committing" };

  const now = new Date();

  await prisma.pick.updateMany({
    where: { userId: session.user.id },
    data: { lockedAt: now },
  });

  await prisma.finalTenPick.updateMany({
    where: { userId: session.user.id },
    data: { lockedAt: now },
  });

  revalidatePath("/ballot");
  return { success: true };
}

// ─── Admin Actions ───────────────────────────────────────────────

async function requireAdmin() {
  const user = await prisma.user.findFirst({ where: { role: "admin" } });
  if (!user) throw new Error("No admin user found");
  return user;
}

async function requireEditorOrAdmin() {
  return requireAdmin();
}

export async function setDraftWinner(categoryId: string, nomineeId: string) {
  const user = await requireAdmin();

  const existing = await prisma.winnerDraft.findUnique({
    where: { categoryId },
  });

  await prisma.winnerDraft.upsert({
    where: { categoryId },
    update: { nomineeId, updatedBy: user.id },
    create: { categoryId, nomineeId, updatedBy: user.id },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "set_draft_winner",
      entityType: "WinnerDraft",
      entityId: categoryId,
      beforeJson: existing ? JSON.stringify(existing) : null,
      afterJson: JSON.stringify({ categoryId, nomineeId }),
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function publishWinners() {
  const user = await requireAdmin();

  const drafts = await prisma.winnerDraft.findMany();
  if (drafts.length === 0) return { error: "No draft winners to publish" };

  // Atomically replace all published winners
  await prisma.$transaction(async (tx) => {
    await tx.winnerPublished.deleteMany();
    for (const draft of drafts) {
      await tx.winnerPublished.create({
        data: {
          categoryId: draft.categoryId,
          nomineeId: draft.nomineeId,
          publishedBy: user.id,
        },
      });
    }
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "publish_winners",
      entityType: "WinnerPublished",
      entityId: "bulk",
      afterJson: JSON.stringify(drafts),
    },
  });

  // Recompute all scores after winners are committed
  await _recomputeAllScores();

  revalidatePath("/leaderboard");
  revalidatePath("/admin");
  return { success: true };
}

// Internal score recompute — no auth check (called from publishWinners which already requires admin)
async function _recomputeAllScores() {
  const clustersDb = await prisma.cluster.findMany({
    include: { categories: true },
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
    categories: c.categories.map(
      (cat): CategoryDef => ({
        id: cat.id,
        name: cat.name,
        basePoints: cat.basePoints,
        clusterId: cat.clusterId,
        eligibleForFinalTen: cat.eligibleForFinalTen,
      })
    ),
  }));

  const winnersDb = await prisma.winnerPublished.findMany();
  const winners = winnersDb.map((w) => ({
    categoryId: w.categoryId,
    nomineeId: w.nomineeId,
  }));

  const users = await prisma.user.findMany({
    include: { picks: true, finalTenPick: true },
  });

  // Compute all breakdowns first, then batch-write in a single transaction
  const upsertOps = users.map((user) => {
    const picks = user.picks.map((p) => ({
      categoryId: p.categoryId,
      nomineeId: p.nomineeId,
    }));
    const finalTen = user.finalTenPick
      ? { categoryId: user.finalTenPick.categoryId, nomineeId: user.finalTenPick.nomineeId }
      : null;
    const breakdown = computeScore(clusterDefs, picks, finalTen, winners);

    return prisma.computedScore.upsert({
      where: { userId: user.id },
      update: {
        totalScore: breakdown.totalScore,
        crownPoints: breakdown.crownPoints,
        correctCount: breakdown.correctCount,
        breakdownJson: JSON.stringify(breakdown),
      },
      create: {
        userId: user.id,
        totalScore: breakdown.totalScore,
        crownPoints: breakdown.crownPoints,
        correctCount: breakdown.correctCount,
        breakdownJson: JSON.stringify(breakdown),
      },
    });
  });

  await prisma.$transaction(upsertOps);
}

// Exported version — requires admin auth
export async function recomputeAllScores() {
  await requireAdmin();
  await _recomputeAllScores();
}

export async function updateBallotWindow(
  opensAt: string,
  closesAt: string,
  timezone: string
) {
  const user = await requireAdmin();

  await prisma.globalSettings.upsert({
    where: { id: "singleton" },
    update: {
      ballotOpensAt: new Date(opensAt),
      ballotClosesAt: new Date(closesAt),
      timezone,
    },
    create: {
      ballotOpensAt: new Date(opensAt),
      ballotClosesAt: new Date(closesAt),
      timezone,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "update_ballot_window",
      entityType: "GlobalSettings",
      entityId: "singleton",
      afterJson: JSON.stringify({ opensAt, closesAt, timezone }),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/ballot");
  return { success: true };
}

// ─── Nominee Management ──────────────────────────────────────────

export async function createNominee(
  categoryId: string,
  displayName: string,
  filmTitle?: string,
  imageUrl?: string
) {
  const user = await requireEditorOrAdmin();

  if (imageUrl && !isValidHttpUrl(imageUrl)) {
    return { error: "Invalid image URL" };
  }

  const count = await prisma.nominee.count({ where: { categoryId } });

  const nominee = await prisma.nominee.create({
    data: {
      categoryId,
      displayName: displayName.slice(0, 200),
      filmTitle: filmTitle ? filmTitle.slice(0, 200) : null,
      imageUrl: imageUrl || null,
      sortOrder: count + 1,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "create_nominee",
      entityType: "Nominee",
      entityId: nominee.id,
      afterJson: JSON.stringify(nominee),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/ballot");
  return { success: true, nominee };
}

export async function updateNominee(
  nomineeId: string,
  data: { displayName?: string; filmTitle?: string; imageUrl?: string }
) {
  const user = await requireEditorOrAdmin();

  if (data.imageUrl && !isValidHttpUrl(data.imageUrl)) {
    return { error: "Invalid image URL" };
  }

  const before = await prisma.nominee.findUnique({ where: { id: nomineeId } });

  const nominee = await prisma.nominee.update({
    where: { id: nomineeId },
    data: {
      ...(data.displayName && { displayName: data.displayName.slice(0, 200) }),
      ...(data.filmTitle !== undefined && { filmTitle: data.filmTitle?.slice(0, 200) ?? null }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "update_nominee",
      entityType: "Nominee",
      entityId: nomineeId,
      beforeJson: JSON.stringify(before),
      afterJson: JSON.stringify(nominee),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/ballot");
  return { success: true };
}

export async function deleteNominee(nomineeId: string) {
  const user = await requireAdmin();

  // Block delete if any user has picked this nominee
  const pickCount = await prisma.pick.count({ where: { nomineeId } });
  if (pickCount > 0) {
    return { error: `Cannot delete: ${pickCount} user pick(s) reference this nominee. Remove those picks first.` };
  }

  const before = await prisma.nominee.findUnique({ where: { id: nomineeId } });

  await prisma.nominee.delete({ where: { id: nomineeId } });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "delete_nominee",
      entityType: "Nominee",
      entityId: nomineeId,
      beforeJson: JSON.stringify(before),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/ballot");
  return { success: true };
}

// ─── Ticker Actions ──────────────────────────────────────────────

export async function createTickerItem(data: {
  title: string;
  snippet: string;
  sourceName?: string;
  sourceUrl?: string;
  isTrivia?: boolean;
  isSpotlight?: boolean;
}) {
  const user = await requireEditorOrAdmin();

  if (data.sourceUrl && !isValidHttpUrl(data.sourceUrl)) {
    return { error: "Invalid source URL" };
  }

  const item = await prisma.tickerItem.create({
    data: {
      title: data.title.slice(0, 300),
      snippet: data.snippet.slice(0, 1000),
      sourceName: data.sourceName?.slice(0, 100) || null,
      sourceUrl: data.sourceUrl || null,
      isTrivia: data.isTrivia || false,
      isSpotlight: data.isSpotlight || false,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "create_ticker_item",
      entityType: "TickerItem",
      entityId: item.id,
      afterJson: JSON.stringify(item),
    },
  });

  revalidatePath("/");
  return { success: true, item };
}

// ─── User Profile Actions ────────────────────────────────────────

export async function updateUserProfile(displayName: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const trimmed = displayName.trim().slice(0, 50);
  if (!trimmed) return { error: "Display name cannot be empty" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { displayName: trimmed },
  });

  revalidatePath("/profile");
  revalidatePath("/leaderboard");
  return { success: true };
}

// ─── Ticker Delete ────────────────────────────────────────────────

export async function deleteTickerItem(id: string) {
  await requireEditorOrAdmin();
  await prisma.tickerItem.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function toggleTickerItem(id: string, isActive: boolean) {
  await requireEditorOrAdmin();
  await prisma.tickerItem.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

// ─── Insight Actions ─────────────────────────────────────────────

export async function upsertInsightMetric(data: {
  id?: string;
  scope: string;
  categoryId?: string;
  nomineeId?: string;
  key: string;
  label: string;
  value: string;
  sourceName?: string;
  sourceUrl?: string;
}) {
  const user = await requireEditorOrAdmin();

  if (data.sourceUrl && !isValidHttpUrl(data.sourceUrl)) {
    return { error: "Invalid source URL" };
  }

  if (data.id) {
    const metric = await prisma.insightMetric.update({
      where: { id: data.id },
      data: {
        scope: data.scope,
        categoryId: data.categoryId || null,
        nomineeId: data.nomineeId || null,
        key: data.key,
        label: data.label,
        value: data.value,
        sourceName: data.sourceName || null,
        sourceUrl: data.sourceUrl || null,
      },
    });
    return { success: true, metric };
  }

  const metric = await prisma.insightMetric.create({
    data: {
      scope: data.scope,
      categoryId: data.categoryId || null,
      nomineeId: data.nomineeId || null,
      key: data.key,
      label: data.label,
      value: data.value,
      sourceName: data.sourceName || null,
      sourceUrl: data.sourceUrl || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "create_insight",
      entityType: "InsightMetric",
      entityId: metric.id,
      afterJson: JSON.stringify(metric),
    },
  });

  return { success: true, metric };
}
