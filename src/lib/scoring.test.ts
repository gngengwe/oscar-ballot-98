import { describe, it, expect } from "vitest";
import {
  computeScore,
  tiebreakerCompare,
  ClusterDef,
  PickData,
  WinnerData,
  FinalTenPickData,
} from "./scoring";

// ─── Test Cluster Definitions ────────────────────────────────────

const clusters: ClusterDef[] = [
  {
    id: "c1",
    name: "The Crown",
    sortOrder: 1,
    sweepType: "full",
    sweepBonus: 20,
    categories: [
      { id: "cat1", name: "Best Picture", basePoints: 10, clusterId: "c1", eligibleForFinalTen: true },
      { id: "cat2", name: "Best Director", basePoints: 10, clusterId: "c1", eligibleForFinalTen: true },
      { id: "cat3", name: "Best Actor", basePoints: 10, clusterId: "c1", eligibleForFinalTen: true },
      { id: "cat4", name: "Best Actress", basePoints: 10, clusterId: "c1", eligibleForFinalTen: true },
    ],
  },
  {
    id: "c2",
    name: "The Performers",
    sortOrder: 2,
    sweepType: "full",
    sweepBonus: 10,
    categories: [
      { id: "cat5", name: "Supporting Actor", basePoints: 8, clusterId: "c2", eligibleForFinalTen: false },
      { id: "cat6", name: "Supporting Actress", basePoints: 8, clusterId: "c2", eligibleForFinalTen: false },
    ],
  },
  {
    id: "c3",
    name: "The Authors",
    sortOrder: 3,
    sweepType: "full",
    sweepBonus: 12,
    categories: [
      { id: "cat7", name: "Original Screenplay", basePoints: 8, clusterId: "c3", eligibleForFinalTen: false },
      { id: "cat8", name: "Adapted Screenplay", basePoints: 8, clusterId: "c3", eligibleForFinalTen: false },
    ],
  },
  {
    id: "c4",
    name: "Global & Animated",
    sortOrder: 4,
    sweepType: "full",
    sweepBonus: 10,
    categories: [
      { id: "cat9", name: "International Feature", basePoints: 7, clusterId: "c4", eligibleForFinalTen: false },
      { id: "cat10", name: "Animated Feature", basePoints: 7, clusterId: "c4", eligibleForFinalTen: false },
    ],
  },
  {
    id: "c5",
    name: "Soundtrack",
    sortOrder: 5,
    sweepType: "full",
    sweepBonus: 8,
    categories: [
      { id: "cat11", name: "Original Score", basePoints: 6, clusterId: "c5", eligibleForFinalTen: false },
      { id: "cat12", name: "Original Song", basePoints: 6, clusterId: "c5", eligibleForFinalTen: false },
    ],
  },
  {
    id: "c6",
    name: "The Crafts",
    sortOrder: 6,
    sweepType: "partial",
    sweepBonus: 12,
    partialThreshold: 3,
    partialBonus: 5,
    categories: [
      { id: "cat13", name: "Cinematography", basePoints: 5, clusterId: "c6", eligibleForFinalTen: false },
      { id: "cat14", name: "Production Design", basePoints: 5, clusterId: "c6", eligibleForFinalTen: false },
      { id: "cat15", name: "Costume Design", basePoints: 5, clusterId: "c6", eligibleForFinalTen: false },
      { id: "cat16", name: "Film Editing", basePoints: 5, clusterId: "c6", eligibleForFinalTen: false },
    ],
  },
];

// Helper: create picks where user picks the correct nominee for all categories
function allCorrectPicks(): PickData[] {
  const picks: PickData[] = [];
  for (const cluster of clusters) {
    for (const cat of cluster.categories) {
      picks.push({ categoryId: cat.id, nomineeId: `winner-${cat.id}` });
    }
  }
  return picks;
}

function allWinners(): WinnerData[] {
  const winners: WinnerData[] = [];
  for (const cluster of clusters) {
    for (const cat of cluster.categories) {
      winners.push({ categoryId: cat.id, nomineeId: `winner-${cat.id}` });
    }
  }
  return winners;
}

// ─── Tests ───────────────────────────────────────────────────────

describe("Scoring Engine", () => {
  const winners = allWinners();

  describe("Perfect score (max 200)", () => {
    it("should compute max score of 200 with all correct picks and Final 10 correct", () => {
      const picks = allCorrectPicks();
      const finalTen: FinalTenPickData = {
        categoryId: "cat1",
        nomineeId: "winner-cat1",
      };

      const result = computeScore(clusters, picks, finalTen, winners);

      // Crown: 40 + 20 = 60
      expect(result.clusters[0].clusterTotal).toBe(60);
      // Performers: 16 + 10 = 26
      expect(result.clusters[1].clusterTotal).toBe(26);
      // Authors: 16 + 12 = 28
      expect(result.clusters[2].clusterTotal).toBe(28);
      // Global & Animated: 14 + 10 = 24
      expect(result.clusters[3].clusterTotal).toBe(24);
      // Soundtrack: 12 + 8 = 20
      expect(result.clusters[4].clusterTotal).toBe(20);
      // Crafts: 20 + 12 = 32
      expect(result.clusters[5].clusterTotal).toBe(32);
      // Final 10: 10
      expect(result.finalTen.points).toBe(10);

      expect(result.totalScore).toBe(200);
      expect(result.crownPoints).toBe(60);
      expect(result.correctCount).toBe(16);
    });
  });

  describe("Crown cluster sweep", () => {
    it("should award 20 sweep bonus when all 4 Crown picks are correct", () => {
      const picks: PickData[] = [
        { categoryId: "cat1", nomineeId: "winner-cat1" },
        { categoryId: "cat2", nomineeId: "winner-cat2" },
        { categoryId: "cat3", nomineeId: "winner-cat3" },
        { categoryId: "cat4", nomineeId: "winner-cat4" },
      ];
      const result = computeScore(clusters, picks, null, winners);
      expect(result.clusters[0].sweepBonusEarned).toBe(20);
      expect(result.clusters[0].clusterTotal).toBe(60);
    });

    it("should NOT award sweep bonus when only 3/4 Crown picks are correct", () => {
      const picks: PickData[] = [
        { categoryId: "cat1", nomineeId: "winner-cat1" },
        { categoryId: "cat2", nomineeId: "winner-cat2" },
        { categoryId: "cat3", nomineeId: "winner-cat3" },
        { categoryId: "cat4", nomineeId: "wrong" },
      ];
      const result = computeScore(clusters, picks, null, winners);
      expect(result.clusters[0].sweepBonusEarned).toBe(0);
      expect(result.clusters[0].clusterTotal).toBe(30);
    });
  });

  describe("Performers cluster sweep", () => {
    it("should award 10 sweep bonus when both correct", () => {
      const picks: PickData[] = [
        { categoryId: "cat5", nomineeId: "winner-cat5" },
        { categoryId: "cat6", nomineeId: "winner-cat6" },
      ];
      const result = computeScore(clusters, picks, null, winners);
      expect(result.clusters[1].sweepBonusEarned).toBe(10);
      expect(result.clusters[1].clusterTotal).toBe(26);
    });
  });

  describe("Authors cluster sweep", () => {
    it("should award 12 sweep bonus when both correct", () => {
      const picks: PickData[] = [
        { categoryId: "cat7", nomineeId: "winner-cat7" },
        { categoryId: "cat8", nomineeId: "winner-cat8" },
      ];
      const result = computeScore(clusters, picks, null, winners);
      expect(result.clusters[2].sweepBonusEarned).toBe(12);
      expect(result.clusters[2].clusterTotal).toBe(28);
    });
  });

  describe("Global & Animated cluster sweep", () => {
    it("should award 10 sweep bonus when both correct", () => {
      const picks: PickData[] = [
        { categoryId: "cat9", nomineeId: "winner-cat9" },
        { categoryId: "cat10", nomineeId: "winner-cat10" },
      ];
      const result = computeScore(clusters, picks, null, winners);
      expect(result.clusters[3].sweepBonusEarned).toBe(10);
      expect(result.clusters[3].clusterTotal).toBe(24);
    });
  });

  describe("Soundtrack cluster sweep", () => {
    it("should award 8 sweep bonus when both correct", () => {
      const picks: PickData[] = [
        { categoryId: "cat11", nomineeId: "winner-cat11" },
        { categoryId: "cat12", nomineeId: "winner-cat12" },
      ];
      const result = computeScore(clusters, picks, null, winners);
      expect(result.clusters[4].sweepBonusEarned).toBe(8);
      expect(result.clusters[4].clusterTotal).toBe(20);
    });
  });

  describe("Crafts cluster – partial vs full bonus", () => {
    it("should award +5 partial bonus when 3/4 correct", () => {
      const picks: PickData[] = [
        { categoryId: "cat13", nomineeId: "winner-cat13" },
        { categoryId: "cat14", nomineeId: "winner-cat14" },
        { categoryId: "cat15", nomineeId: "winner-cat15" },
        { categoryId: "cat16", nomineeId: "wrong" },
      ];
      const result = computeScore(clusters, picks, null, winners);
      expect(result.clusters[5].correctCount).toBe(3);
      expect(result.clusters[5].sweepBonusEarned).toBe(5);
      expect(result.clusters[5].clusterTotal).toBe(20); // 15 + 5
    });

    it("should award +12 full bonus when 4/4 correct", () => {
      const picks: PickData[] = [
        { categoryId: "cat13", nomineeId: "winner-cat13" },
        { categoryId: "cat14", nomineeId: "winner-cat14" },
        { categoryId: "cat15", nomineeId: "winner-cat15" },
        { categoryId: "cat16", nomineeId: "winner-cat16" },
      ];
      const result = computeScore(clusters, picks, null, winners);
      expect(result.clusters[5].correctCount).toBe(4);
      expect(result.clusters[5].sweepBonusEarned).toBe(12);
      expect(result.clusters[5].clusterTotal).toBe(32); // 20 + 12
    });

    it("should award NO bonus when 2/4 correct", () => {
      const picks: PickData[] = [
        { categoryId: "cat13", nomineeId: "winner-cat13" },
        { categoryId: "cat14", nomineeId: "winner-cat14" },
        { categoryId: "cat15", nomineeId: "wrong" },
        { categoryId: "cat16", nomineeId: "wrong" },
      ];
      const result = computeScore(clusters, picks, null, winners);
      expect(result.clusters[5].correctCount).toBe(2);
      expect(result.clusters[5].sweepBonusEarned).toBe(0);
      expect(result.clusters[5].clusterTotal).toBe(10); // just 2 * 5
    });
  });

  describe("Final 10", () => {
    it("should award +10 when Final 10 pick is correct", () => {
      const finalTen: FinalTenPickData = {
        categoryId: "cat1",
        nomineeId: "winner-cat1",
      };
      const result = computeScore(clusters, [], finalTen, winners);
      expect(result.finalTen.correct).toBe(true);
      expect(result.finalTen.points).toBe(10);
    });

    it("should award +0 when Final 10 pick is wrong", () => {
      const finalTen: FinalTenPickData = {
        categoryId: "cat1",
        nomineeId: "wrong-nominee",
      };
      const result = computeScore(clusters, [], finalTen, winners);
      expect(result.finalTen.correct).toBe(false);
      expect(result.finalTen.points).toBe(0);
    });

    it("should handle no Final 10 pick", () => {
      const result = computeScore(clusters, [], null, winners);
      expect(result.finalTen.picked).toBe(false);
      expect(result.finalTen.points).toBe(0);
    });
  });

  describe("No picks at all", () => {
    it("should return 0 for everything with no picks", () => {
      const result = computeScore(clusters, [], null, winners);
      expect(result.totalScore).toBe(0);
      expect(result.crownPoints).toBe(0);
      expect(result.correctCount).toBe(0);
    });
  });

  describe("No winners published yet", () => {
    it("should return 0 for everything when no winners set", () => {
      const picks = allCorrectPicks();
      const result = computeScore(clusters, picks, null, []);
      expect(result.totalScore).toBe(0);
      expect(result.correctCount).toBe(0);
    });
  });
});

describe("Tiebreaker comparator", () => {
  it("should rank higher total score first", () => {
    const a = { totalScore: 150, crownPoints: 40, correctCount: 12, committedAt: new Date(), displayName: "Alice" };
    const b = { totalScore: 140, crownPoints: 40, correctCount: 12, committedAt: new Date(), displayName: "Bob" };
    expect(tiebreakerCompare(a, b)).toBeLessThan(0);
  });

  it("should break tie by Crown points", () => {
    const a = { totalScore: 150, crownPoints: 60, correctCount: 12, committedAt: new Date(), displayName: "Alice" };
    const b = { totalScore: 150, crownPoints: 40, correctCount: 12, committedAt: new Date(), displayName: "Bob" };
    expect(tiebreakerCompare(a, b)).toBeLessThan(0);
  });

  it("should break tie by correct count", () => {
    const now = new Date();
    const a = { totalScore: 150, crownPoints: 40, correctCount: 14, committedAt: now, displayName: "Alice" };
    const b = { totalScore: 150, crownPoints: 40, correctCount: 12, committedAt: now, displayName: "Bob" };
    expect(tiebreakerCompare(a, b)).toBeLessThan(0);
  });

  it("should break tie by earlier commit timestamp", () => {
    const early = new Date("2026-03-01T12:00:00Z");
    const late = new Date("2026-03-01T14:00:00Z");
    const a = { totalScore: 150, crownPoints: 40, correctCount: 12, committedAt: early, displayName: "Bob" };
    const b = { totalScore: 150, crownPoints: 40, correctCount: 12, committedAt: late, displayName: "Alice" };
    expect(tiebreakerCompare(a, b)).toBeLessThan(0);
  });

  it("should break tie alphabetically by displayName as last resort", () => {
    const now = new Date();
    const a = { totalScore: 150, crownPoints: 40, correctCount: 12, committedAt: now, displayName: "Alice" };
    const b = { totalScore: 150, crownPoints: 40, correctCount: 12, committedAt: now, displayName: "Bob" };
    expect(tiebreakerCompare(a, b)).toBeLessThan(0);
  });
});
