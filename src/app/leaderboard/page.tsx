import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { tiebreakerCompare } from "@/lib/scoring";
import LeaderboardClient from "./LeaderboardClient";

export const revalidate = 30;

export default async function LeaderboardPage() {
  const session = await auth();

  const scores = await prisma.computedScore.findMany({
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          picks: { select: { lockedAt: true }, take: 1 },
        },
      },
    },
  });

  // Apply full 5-level tiebreaker sort using the canonical comparator
  const ranked = scores
    .map((s) => ({
      userId: s.userId,
      displayName: s.user.displayName,
      totalScore: s.totalScore,
      crownPoints: s.crownPoints,
      correctCount: s.correctCount,
      breakdownJson: s.breakdownJson,
      committedAt: s.user.picks[0]?.lockedAt || null,
    }))
    .sort((a, b) =>
      tiebreakerCompare(
        { ...a, committedAt: a.committedAt ? new Date(a.committedAt) : null },
        { ...b, committedAt: b.committedAt ? new Date(b.committedAt) : null }
      )
    );

  // Assign ranks — two entries share a rank only if ALL 5 tiebreakers are equal (i.e. they compare as 0)
  let currentRank = 1;
  const rankedWithPosition = ranked.map((entry, i) => {
    if (i > 0) {
      const prev = ranked[i - 1];
      const isTie =
        tiebreakerCompare(
          { ...entry, committedAt: entry.committedAt ? new Date(entry.committedAt) : null },
          { ...prev, committedAt: prev.committedAt ? new Date(prev.committedAt) : null }
        ) === 0;
      if (!isTie) currentRank = i + 1;
    }
    return { ...entry, rank: currentRank };
  });

  const winnersCount = await prisma.winnerPublished.count();

  return (
    <LeaderboardClient
      entries={JSON.parse(JSON.stringify(rankedWithPosition))}
      currentUserId={session?.user?.id || null}
      winnersPublished={winnersCount}
    />
  );
}
