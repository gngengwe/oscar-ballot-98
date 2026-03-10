/**
 * End-to-end style test for the full "publish winners → leaderboard updates" flow.
 * Uses in-memory scoring logic (no DB) to simulate the complete pipeline.
 */
import { describe, it, expect } from "vitest";
import { computeScore, ClusterDef, tiebreakerCompare } from "./scoring";

const clusters: ClusterDef[] = [
  {
    id: "c1",
    name: "The Crown",
    sortOrder: 1,
    sweepType: "full",
    sweepBonus: 20,
    categories: [
      { id: "bp", name: "Best Picture", basePoints: 10, clusterId: "c1", eligibleForFinalTen: true },
      { id: "bd", name: "Best Director", basePoints: 10, clusterId: "c1", eligibleForFinalTen: true },
      { id: "ba", name: "Best Actor", basePoints: 10, clusterId: "c1", eligibleForFinalTen: true },
      { id: "bac", name: "Best Actress", basePoints: 10, clusterId: "c1", eligibleForFinalTen: true },
    ],
  },
  {
    id: "c2",
    name: "The Performers",
    sortOrder: 2,
    sweepType: "full",
    sweepBonus: 10,
    categories: [
      { id: "sa", name: "Supporting Actor", basePoints: 8, clusterId: "c2", eligibleForFinalTen: false },
      { id: "sac", name: "Supporting Actress", basePoints: 8, clusterId: "c2", eligibleForFinalTen: false },
    ],
  },
  {
    id: "c3",
    name: "The Authors",
    sortOrder: 3,
    sweepType: "full",
    sweepBonus: 12,
    categories: [
      { id: "os", name: "Original Screenplay", basePoints: 8, clusterId: "c3", eligibleForFinalTen: false },
      { id: "as", name: "Adapted Screenplay", basePoints: 8, clusterId: "c3", eligibleForFinalTen: false },
    ],
  },
  {
    id: "c4",
    name: "Global & Animated",
    sortOrder: 4,
    sweepType: "full",
    sweepBonus: 10,
    categories: [
      { id: "if", name: "International Feature", basePoints: 7, clusterId: "c4", eligibleForFinalTen: false },
      { id: "af", name: "Animated Feature", basePoints: 7, clusterId: "c4", eligibleForFinalTen: false },
    ],
  },
  {
    id: "c5",
    name: "Soundtrack",
    sortOrder: 5,
    sweepType: "full",
    sweepBonus: 8,
    categories: [
      { id: "osc", name: "Original Score", basePoints: 6, clusterId: "c5", eligibleForFinalTen: false },
      { id: "oso", name: "Original Song", basePoints: 6, clusterId: "c5", eligibleForFinalTen: false },
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
      { id: "cin", name: "Cinematography", basePoints: 5, clusterId: "c6", eligibleForFinalTen: false },
      { id: "pd", name: "Production Design", basePoints: 5, clusterId: "c6", eligibleForFinalTen: false },
      { id: "cd", name: "Costume Design", basePoints: 5, clusterId: "c6", eligibleForFinalTen: false },
      { id: "fe", name: "Film Editing", basePoints: 5, clusterId: "c6", eligibleForFinalTen: false },
    ],
  },
];

// Simulated users with their picks (before winners are announced)
const users = [
  {
    id: "user-alice",
    displayName: "Alice",
    committedAt: new Date("2026-03-01T10:00:00Z"),
    picks: [
      // Crown – all correct
      { categoryId: "bp", nomineeId: "anora" },
      { categoryId: "bd", nomineeId: "sean-baker" },
      { categoryId: "ba", nomineeId: "adrien-brody" },
      { categoryId: "bac", nomineeId: "demi-moore" },
      // Performers – both correct
      { categoryId: "sa", nomineeId: "kieran-culkin" },
      { categoryId: "sac", nomineeId: "zoe-saldana" },
      // Authors – both correct
      { categoryId: "os", nomineeId: "sean-baker-sp" },
      { categoryId: "as", nomineeId: "peter-straughan" },
      // Global – 1/2
      { categoryId: "if", nomineeId: "im-still-here" },
      { categoryId: "af", nomineeId: "wrong-animated" },
      // Soundtrack – 0/2
      { categoryId: "osc", nomineeId: "wrong-score" },
      { categoryId: "oso", nomineeId: "wrong-song" },
      // Crafts – 3/4
      { categoryId: "cin", nomineeId: "lol-crawley" },
      { categoryId: "pd", nomineeId: "patrice-vermette" },
      { categoryId: "cd", nomineeId: "wrong-costume" },
      { categoryId: "fe", nomineeId: "sean-baker-ed" },
    ],
    finalTen: { categoryId: "bp", nomineeId: "anora" },
  },
  {
    id: "user-bob",
    displayName: "Bob",
    committedAt: new Date("2026-03-01T11:00:00Z"),
    picks: [
      // Crown – 2/4 correct
      { categoryId: "bp", nomineeId: "anora" },
      { categoryId: "bd", nomineeId: "wrong-director" },
      { categoryId: "ba", nomineeId: "adrien-brody" },
      { categoryId: "bac", nomineeId: "wrong-actress" },
      // Performers – 0/2
      { categoryId: "sa", nomineeId: "wrong-sa" },
      { categoryId: "sac", nomineeId: "wrong-sac" },
      // Authors – 1/2
      { categoryId: "os", nomineeId: "wrong-os" },
      { categoryId: "as", nomineeId: "peter-straughan" },
      // Global – 2/2
      { categoryId: "if", nomineeId: "im-still-here" },
      { categoryId: "af", nomineeId: "flow" },
      // Soundtrack – 1/2
      { categoryId: "osc", nomineeId: "volker-bertelmann" },
      { categoryId: "oso", nomineeId: "wrong-song" },
      // Crafts – 2/4
      { categoryId: "cin", nomineeId: "lol-crawley" },
      { categoryId: "pd", nomineeId: "wrong-pd" },
      { categoryId: "cd", nomineeId: "wrong-costume" },
      { categoryId: "fe", nomineeId: "sean-baker-ed" },
    ],
    finalTen: { categoryId: "bp", nomineeId: "brutalist" },
  },
];

// Published winners
const winners = [
  { categoryId: "bp", nomineeId: "anora" },
  { categoryId: "bd", nomineeId: "sean-baker" },
  { categoryId: "ba", nomineeId: "adrien-brody" },
  { categoryId: "bac", nomineeId: "demi-moore" },
  { categoryId: "sa", nomineeId: "kieran-culkin" },
  { categoryId: "sac", nomineeId: "zoe-saldana" },
  { categoryId: "os", nomineeId: "sean-baker-sp" },
  { categoryId: "as", nomineeId: "peter-straughan" },
  { categoryId: "if", nomineeId: "im-still-here" },
  { categoryId: "af", nomineeId: "flow" },
  { categoryId: "osc", nomineeId: "volker-bertelmann" },
  { categoryId: "oso", nomineeId: "el-mal" },
  { categoryId: "cin", nomineeId: "lol-crawley" },
  { categoryId: "pd", nomineeId: "patrice-vermette" },
  { categoryId: "cd", nomineeId: "paul-tazewell" },
  { categoryId: "fe", nomineeId: "sean-baker-ed" },
];

describe("E2E: Publish Winners → Leaderboard Updates", () => {
  it("should compute correct scores for all users after winners published", () => {
    const computedScores = users.map((user) => {
      const breakdown = computeScore(clusters, user.picks, user.finalTen, winners);
      return {
        userId: user.id,
        displayName: user.displayName,
        committedAt: user.committedAt,
        totalScore: breakdown.totalScore,
        crownPoints: breakdown.crownPoints,
        correctCount: breakdown.correctCount,
        breakdown,
      };
    });

    const alice = computedScores.find((s) => s.userId === "user-alice")!;
    const bob = computedScores.find((s) => s.userId === "user-bob")!;

    // Alice: Crown all 4 correct = 40 + 20 sweep = 60
    expect(alice.breakdown.clusters[0].clusterTotal).toBe(60);
    expect(alice.breakdown.clusters[0].sweepBonusEarned).toBe(20);

    // Alice: Performers both correct = 16 + 10 = 26
    expect(alice.breakdown.clusters[1].clusterTotal).toBe(26);

    // Alice: Authors both correct = 16 + 12 = 28
    expect(alice.breakdown.clusters[2].clusterTotal).toBe(28);

    // Alice: Global 1/2 = 7 (no bonus)
    expect(alice.breakdown.clusters[3].clusterTotal).toBe(7);

    // Alice: Soundtrack 0/2 = 0
    expect(alice.breakdown.clusters[4].clusterTotal).toBe(0);

    // Alice: Crafts 3/4 = 15 + 5 partial = 20
    expect(alice.breakdown.clusters[5].correctCount).toBe(3);
    expect(alice.breakdown.clusters[5].sweepBonusEarned).toBe(5);
    expect(alice.breakdown.clusters[5].clusterTotal).toBe(20);

    // Alice: Final 10 correct (Best Picture = Anora) = +10
    expect(alice.breakdown.finalTen.correct).toBe(true);
    expect(alice.breakdown.finalTen.points).toBe(10);

    // Alice total: 60 + 26 + 28 + 7 + 0 + 20 + 10 = 151
    expect(alice.totalScore).toBe(151);

    // Bob: Crown 2/4 = 20 (no sweep)
    expect(bob.breakdown.clusters[0].clusterTotal).toBe(20);
    expect(bob.breakdown.clusters[0].sweepBonusEarned).toBe(0);

    // Bob: Performers 0/2 = 0
    expect(bob.breakdown.clusters[1].clusterTotal).toBe(0);

    // Bob: Authors 1/2 = 8 (no sweep)
    expect(bob.breakdown.clusters[2].clusterTotal).toBe(8);

    // Bob: Global both correct = 14 + 10 = 24
    expect(bob.breakdown.clusters[3].clusterTotal).toBe(24);

    // Bob: Soundtrack 1/2 = 6 (no sweep)
    expect(bob.breakdown.clusters[4].clusterTotal).toBe(6);

    // Bob: Crafts 2/4 = 10 (no bonus)
    expect(bob.breakdown.clusters[5].correctCount).toBe(2);
    expect(bob.breakdown.clusters[5].sweepBonusEarned).toBe(0);
    expect(bob.breakdown.clusters[5].clusterTotal).toBe(10);

    // Bob: Final 10 wrong (picked The Brutalist for Best Picture)
    expect(bob.breakdown.finalTen.correct).toBe(false);
    expect(bob.breakdown.finalTen.points).toBe(0);

    // Bob total: 20 + 0 + 8 + 24 + 6 + 10 + 0 = 68
    expect(bob.totalScore).toBe(68);
  });

  it("should rank Alice above Bob on the leaderboard", () => {
    const aliceEntry = {
      totalScore: 151,
      crownPoints: 60,
      correctCount: 11,
      committedAt: new Date("2026-03-01T10:00:00Z"),
      displayName: "Alice",
    };
    const bobEntry = {
      totalScore: 68,
      crownPoints: 20,
      correctCount: 6,
      committedAt: new Date("2026-03-01T11:00:00Z"),
      displayName: "Bob",
    };

    expect(tiebreakerCompare(aliceEntry, bobEntry)).toBeLessThan(0);
    expect(tiebreakerCompare(bobEntry, aliceEntry)).toBeGreaterThan(0);

    const sorted = [bobEntry, aliceEntry].sort(tiebreakerCompare);
    expect(sorted[0].displayName).toBe("Alice");
    expect(sorted[1].displayName).toBe("Bob");
  });

  it("should correctly apply tiebreakers for equal scores", () => {
    const playerA = {
      totalScore: 100,
      crownPoints: 60,
      correctCount: 10,
      committedAt: new Date("2026-03-01T09:00:00Z"),
      displayName: "Alpha",
    };
    const playerB = {
      totalScore: 100,
      crownPoints: 40,
      correctCount: 10,
      committedAt: new Date("2026-03-01T09:00:00Z"),
      displayName: "Beta",
    };
    const playerC = {
      totalScore: 100,
      crownPoints: 40,
      correctCount: 12,
      committedAt: new Date("2026-03-01T09:00:00Z"),
      displayName: "Gamma",
    };
    const playerD = {
      totalScore: 100,
      crownPoints: 40,
      correctCount: 10,
      committedAt: new Date("2026-03-01T08:00:00Z"),
      displayName: "Delta",
    };
    const playerE = {
      totalScore: 100,
      crownPoints: 40,
      correctCount: 10,
      committedAt: new Date("2026-03-01T09:00:00Z"),
      displayName: "Alpha",
    };
    const playerF = {
      totalScore: 100,
      crownPoints: 40,
      correctCount: 10,
      committedAt: new Date("2026-03-01T09:00:00Z"),
      displayName: "Zeta",
    };

    // A wins: higher Crown
    expect(tiebreakerCompare(playerA, playerB)).toBeLessThan(0);
    // C wins over B: more correct picks
    expect(tiebreakerCompare(playerC, playerB)).toBeLessThan(0);
    // D wins over B: earlier commit
    expect(tiebreakerCompare(playerD, playerB)).toBeLessThan(0);
    // E wins over F: alphabetical
    expect(tiebreakerCompare(playerE, playerF)).toBeLessThan(0);
  });
});
