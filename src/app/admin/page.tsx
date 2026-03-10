import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  const clusters = await prisma.cluster.findMany({
    include: {
      categories: {
        include: {
          nominees: { orderBy: { sortOrder: "asc" } },
          winnerDraft: true,
          winnerPublished: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const settings = await prisma.globalSettings.findUnique({
    where: { id: "singleton" },
  });

  const auditLogs = await prisma.auditLog.findMany({
    include: { user: { select: { displayName: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const userCount = await prisma.user.count();
  const picksCount = await prisma.pick.count({ where: { lockedAt: { not: null } } });
  const winnersPublishedCount = await prisma.winnerPublished.count();
  const totalCategories = await prisma.category.count();
  const tickerCount = await prisma.tickerItem.count({ where: { isActive: true } });

  // ── Analytics data ──────────────────────────────────────────────
  // Pick distribution: for each category, how many picked each nominee
  const allPicks = await prisma.pick.findMany({
    include: {
      nominee: { select: { displayName: true, filmTitle: true } },
      category: {
        select: {
          name: true,
          sortOrder: true,
          cluster: { select: { name: true, sortOrder: true } },
          winnerPublished: { select: { nomineeId: true } },
        },
      },
    },
  });

  // Group by category → nominee
  const catPickMap: Record<string, {
    categoryName: string;
    clusterName: string;
    clusterOrder: number;
    catOrder: number;
    nominees: Record<string, { name: string; film: string | null; count: number }>;
    winnerId: string | null;
  }> = {};

  for (const pick of allPicks) {
    const catId = pick.categoryId;
    if (!catPickMap[catId]) {
      catPickMap[catId] = {
        categoryName: pick.category.name,
        clusterName: pick.category.cluster.name,
        clusterOrder: pick.category.cluster.sortOrder,
        catOrder: pick.category.sortOrder,
        nominees: {},
        winnerId: pick.category.winnerPublished?.nomineeId ?? null,
      };
    }
    const nomId = pick.nomineeId;
    if (!catPickMap[catId].nominees[nomId]) {
      catPickMap[catId].nominees[nomId] = {
        name: pick.nominee.displayName,
        film: pick.nominee.filmTitle,
        count: 0,
      };
    }
    catPickMap[catId].nominees[nomId].count++;
  }

  const pickStats = Object.entries(catPickMap)
    .sort((a, b) =>
      a[1].clusterOrder !== b[1].clusterOrder
        ? a[1].clusterOrder - b[1].clusterOrder
        : a[1].catOrder - b[1].catOrder
    )
    .map(([catId, data]) => {
      const total = Object.values(data.nominees).reduce((s, n) => s + n.count, 0);
      return {
        catId,
        categoryName: data.categoryName,
        clusterName: data.clusterName,
        totalPicks: total,
        winnerId: data.winnerId,
        nominees: Object.entries(data.nominees)
          .sort((a, b) => b[1].count - a[1].count)
          .map(([id, n]) => ({
            id,
            name: n.name,
            film: n.film,
            count: n.count,
            pct: total > 0 ? Math.round((n.count / total) * 100) : 0,
          })),
      };
    });

  // Score distribution
  const allScores = await prisma.computedScore.findMany({
    select: { totalScore: true },
  });
  const buckets = [
    { label: "0–49", min: 0, max: 49, count: 0 },
    { label: "50–99", min: 50, max: 99, count: 0 },
    { label: "100–149", min: 100, max: 149, count: 0 },
    { label: "150–199", min: 150, max: 199, count: 0 },
    { label: "200", min: 200, max: 200, count: 0 },
  ];
  for (const s of allScores) {
    const bucket = buckets.find((b) => s.totalScore >= b.min && s.totalScore <= b.max);
    if (bucket) bucket.count++;
  }
  const avgScore =
    allScores.length > 0
      ? Math.round(allScores.reduce((s, x) => s + x.totalScore, 0) / allScores.length)
      : 0;

  // Ticker items (active and inactive)
  const tickerItems = await prisma.tickerItem.findMany({
    orderBy: { retrievedAt: "desc" },
    take: 100,
  });

  return (
    <AdminClient
      clusters={JSON.parse(JSON.stringify(clusters))}
      settings={settings ? JSON.parse(JSON.stringify(settings)) : null}
      auditLogs={JSON.parse(JSON.stringify(auditLogs))}
      stats={{
        userCount,
        committedBallots: picksCount,
        winnersPublished: winnersPublishedCount,
        totalCategories,
        tickerItems: tickerCount,
      }}
      pickStats={JSON.parse(JSON.stringify(pickStats))}
      scoreDistribution={{ buckets, avg: avgScore, total: allScores.length }}
      tickerItems={JSON.parse(JSON.stringify(tickerItems))}
    />
  );
}
