import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { tiebreakerCompare, ScoreBreakdown } from "@/lib/scoring";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      picks: {
        include: {
          nominee: { select: { displayName: true, filmTitle: true } },
          category: {
            include: {
              cluster: { select: { name: true } },
              winnerPublished: { select: { nomineeId: true } },
            },
          },
        },
        orderBy: { category: { sortOrder: "asc" } },
      },
      computedScore: true,
    },
  });

  if (!user) redirect("/auth/signin");

  const winnersPublished = await prisma.winnerPublished.count();

  // Build picks array
  const picks = user.picks.map((p) => {
    const winnerId = p.category.winnerPublished?.nomineeId ?? null;
    return {
      categoryName: p.category.name,
      clusterName: p.category.cluster.name,
      nomineeName: p.nominee.displayName,
      filmTitle: p.nominee.filmTitle,
      correct: winnerId === null ? null : winnerId === p.nomineeId,
    };
  });

  // Compute rank from leaderboard
  let rank: number | null = null;
  let totalPlayers = 0;
  if (user.computedScore) {
    const allScores = await prisma.computedScore.findMany({
      include: { user: { select: { displayName: true, picks: { select: { lockedAt: true }, take: 1 } } } },
    });
    totalPlayers = allScores.length;
    const ranked = allScores
      .map((s) => ({
        userId: s.userId,
        displayName: s.user.displayName,
        totalScore: s.totalScore,
        crownPoints: s.crownPoints,
        correctCount: s.correctCount,
        committedAt: s.user.picks[0]?.lockedAt || null,
      }))
      .sort((a, b) =>
        tiebreakerCompare(
          { ...a, committedAt: a.committedAt ? new Date(a.committedAt) : null },
          { ...b, committedAt: b.committedAt ? new Date(b.committedAt) : null }
        )
      );

    let currentRank = 1;
    for (let i = 0; i < ranked.length; i++) {
      if (i > 0) {
        const isTie =
          tiebreakerCompare(
            { ...ranked[i], committedAt: ranked[i].committedAt ? new Date(ranked[i].committedAt as Date) : null },
            { ...ranked[i - 1], committedAt: ranked[i - 1].committedAt ? new Date(ranked[i - 1].committedAt as Date) : null }
          ) === 0;
        if (!isTie) currentRank = i + 1;
      }
      if (ranked[i].userId === user.id) { rank = currentRank; break; }
    }
  }

  const scoreData = user.computedScore
    ? {
        totalScore: user.computedScore.totalScore,
        crownPoints: user.computedScore.crownPoints,
        correctCount: user.computedScore.correctCount,
        breakdown: JSON.parse(user.computedScore.breakdownJson) as ScoreBreakdown,
      }
    : null;

  return (
    <ProfileClient
      displayName={user.displayName}
      email={user.email}
      memberSince={user.createdAt.toISOString()}
      score={scoreData}
      picks={picks}
      winnersPublished={winnersPublished}
      rank={rank}
      totalPlayers={totalPlayers}
    />
  );
}
