/**
 * Oscar Ballot 2026 – Deterministic Scoring Engine
 *
 * Guilds + Scoring (200 guild pts max + 10 Final Ten bonus)
 *
 * Guild 1: "The Crown"      – 10 pts each (4 cats = 40) + 20 full sweep  = 60
 * Guild 2: "The Performers" –  7 pts each (3 cats = 21) +  9 full sweep  = 30
 * Guild 3: "The Authors"    –  8 pts each (2 cats = 16) +  8 full sweep  = 24
 * Guild 4: "The Eye"        –  5 pts each (4 cats = 20) + partial 5 (3/4) or 10 (4/4) = 30
 * Guild 5: "The Cut"        –  3 pts each (5 cats = 15) + partial 4 (3/5) or  9 (5/5) = 24
 * Guild 6: "The Globe"      –  5 pts each (3 cats = 15) +  7 full sweep  = 22
 * Guild 7: "The Shorts"     –  2 pts each (3 cats =  6) +  4 full sweep  = 10
 * Final 10: +10 if correct (bonus wager, not included in guild max)
 * Total max: 200 guild pts + 10 Final Ten = 210
 */

export interface PickData {
  categoryId: string;
  nomineeId: string;
}

export interface FinalTenPickData {
  categoryId: string;
  nomineeId: string;
}

export interface WinnerData {
  categoryId: string;
  nomineeId: string;
}

export interface ClusterDef {
  id: string;
  name: string;
  sortOrder: number;
  sweepType: "full" | "partial" | "none";
  sweepBonus: number;
  partialThreshold?: number;
  partialBonus?: number;
  categories: CategoryDef[];
}

export interface CategoryDef {
  id: string;
  name: string;
  basePoints: number;
  clusterId: string;
  eligibleForFinalTen: boolean;
}

export interface CategoryResult {
  categoryId: string;
  categoryName: string;
  correct: boolean;
  points: number;
}

export interface ClusterResult {
  clusterId: string;
  clusterName: string;
  categoryResults: CategoryResult[];
  basePoints: number;
  correctCount: number;
  totalInCluster: number;
  sweepBonusEarned: number;
  clusterTotal: number;
}

export interface ScoreBreakdown {
  clusters: ClusterResult[];
  finalTen: {
    picked: boolean;
    correct: boolean;
    points: number;
  };
  totalScore: number;
  crownPoints: number;
  correctCount: number;
}

export function computeScore(
  clusters: ClusterDef[],
  picks: PickData[],
  finalTenPick: FinalTenPickData | null,
  winners: WinnerData[]
): ScoreBreakdown {
  const winnerMap = new Map<string, string>();
  for (const w of winners) {
    winnerMap.set(w.categoryId, w.nomineeId);
  }

  const pickMap = new Map<string, string>();
  for (const p of picks) {
    pickMap.set(p.categoryId, p.nomineeId);
  }

  let totalScore = 0;
  let crownPoints = 0;
  let correctCount = 0;

  const clusterResults: ClusterResult[] = [];

  for (const cluster of clusters) {
    const categoryResults: CategoryResult[] = [];
    let clusterCorrect = 0;
    let clusterBase = 0;

    for (const cat of cluster.categories) {
      const winnerNomineeId = winnerMap.get(cat.id);
      const pickedNomineeId = pickMap.get(cat.id);

      const correct =
        winnerNomineeId !== undefined &&
        pickedNomineeId !== undefined &&
        winnerNomineeId === pickedNomineeId;

      const pts = correct ? cat.basePoints : 0;
      clusterBase += pts;
      if (correct) {
        clusterCorrect++;
        correctCount++;
      }

      categoryResults.push({
        categoryId: cat.id,
        categoryName: cat.name,
        correct,
        points: pts,
      });
    }

    // Sweep bonus calculation
    let sweepBonusEarned = 0;
    const totalCats = cluster.categories.length;

    if (cluster.sweepType === "full") {
      if (clusterCorrect === totalCats && totalCats > 0) {
        sweepBonusEarned = cluster.sweepBonus;
      }
    } else if (cluster.sweepType === "partial") {
      // Full sweep gets full bonus
      if (clusterCorrect === totalCats && totalCats > 0) {
        sweepBonusEarned = cluster.sweepBonus;
      }
      // Partial threshold gets partial bonus
      else if (
        cluster.partialThreshold &&
        cluster.partialBonus &&
        clusterCorrect >= cluster.partialThreshold
      ) {
        sweepBonusEarned = cluster.partialBonus;
      }
    }

    const clusterTotal = clusterBase + sweepBonusEarned;
    totalScore += clusterTotal;

    // Track Crown points (sortOrder === 1 for "The Crown")
    if (cluster.sortOrder === 1) {
      crownPoints = clusterTotal;
    }

    clusterResults.push({
      clusterId: cluster.id,
      clusterName: cluster.name,
      categoryResults,
      basePoints: clusterBase,
      correctCount: clusterCorrect,
      totalInCluster: totalCats,
      sweepBonusEarned,
      clusterTotal,
    });
  }

  // Final 10
  let finalTenResult = { picked: false, correct: false, points: 0 };
  if (finalTenPick) {
    const winnerNomineeId = winnerMap.get(finalTenPick.categoryId);
    const correct =
      winnerNomineeId !== undefined &&
      winnerNomineeId === finalTenPick.nomineeId;
    finalTenResult = { picked: true, correct, points: correct ? 10 : 0 };
    totalScore += finalTenResult.points;
  }

  return {
    clusters: clusterResults,
    finalTen: finalTenResult,
    totalScore,
    crownPoints,
    correctCount,
  };
}

/**
 * Tiebreaker comparator for leaderboard ranking.
 * Returns negative if a should rank higher than b.
 *
 * 1) Higher total score
 * 2) Higher Crown points
 * 3) More total correct picks
 * 4) Earlier commit timestamp
 * 5) Alphabetical by display name
 */
export function tiebreakerCompare(
  a: {
    totalScore: number;
    crownPoints: number;
    correctCount: number;
    committedAt?: Date | null;
    displayName: string;
  },
  b: {
    totalScore: number;
    crownPoints: number;
    correctCount: number;
    committedAt?: Date | null;
    displayName: string;
  }
): number {
  // 1) Higher total score first
  if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;

  // 2) Higher Crown points
  if (b.crownPoints !== a.crownPoints) return b.crownPoints - a.crownPoints;

  // 3) More correct picks
  if (b.correctCount !== a.correctCount)
    return b.correctCount - a.correctCount;

  // 4) Earlier commit timestamp
  const aTime = a.committedAt?.getTime() ?? Infinity;
  const bTime = b.committedAt?.getTime() ?? Infinity;
  if (aTime !== bTime) return aTime - bTime;

  // 5) Alphabetical by display name
  return a.displayName.localeCompare(b.displayName);
}
