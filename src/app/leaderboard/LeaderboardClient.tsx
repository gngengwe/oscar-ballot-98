"use client";

import { useState } from "react";
import { ScoreBreakdown } from "@/lib/scoring";

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  totalScore: number;
  crownPoints: number;
  correctCount: number;
  breakdownJson: string;
  rank: number;
  committedAt: string | null;
}

const RANK_STYLES: Record<number, string> = {
  1: "text-gold-400 bg-gold-600/20 border-gold-500/40",
  2: "text-cinema-200 bg-cinema-600/20 border-cinema-400/40",
  3: "text-amber-600 bg-amber-900/20 border-amber-700/40",
};

export default function LeaderboardClient({
  entries,
  currentUserId,
  winnersPublished,
}: {
  entries: LeaderboardEntry[];
  currentUserId: string | null;
  winnersPublished: number;
}) {
  const [filter, setFilter] = useState<"all" | "top10">("all");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const filtered = filter === "top10" ? entries.slice(0, 10) : entries;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-cinema-100">Leaderboard</h1>
          <p className="text-cinema-400 text-sm mt-1">
            {winnersPublished > 0
              ? `${winnersPublished} winner${winnersPublished > 1 ? "s" : ""} announced`
              : "Waiting for winners to be announced"}
          </p>
        </div>

        <div className="flex gap-2">
          {(["all", "top10"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? "bg-gold-600/20 text-gold-400 border border-gold-500/30"
                  : "bg-cinema-800 text-cinema-300 border border-cinema-700/30 hover:text-cinema-100"
              }`}
            >
              {f === "all" ? "All Players" : "Top 10"}
            </button>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 bg-cinema-800/30 border border-cinema-700/30 rounded-xl">
          <span className="text-4xl block mb-3">🏆</span>
          <p className="text-cinema-400">
            No scores yet. Winners need to be published to see the leaderboard.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header row */}
          <div className="hidden sm:grid grid-cols-[4rem_1fr_5rem_5rem_5rem_5rem] gap-2 px-4 py-2 text-xs text-cinema-400 font-medium uppercase tracking-wide">
            <span>Rank</span>
            <span>Player</span>
            <span className="text-right">Score</span>
            <span className="text-right">Crown</span>
            <span className="text-right">Correct</span>
            <span className="text-right">Max 200</span>
          </div>

          {filtered.map((entry) => {
            const isMe = entry.userId === currentUserId;
            const isExpanded = expandedUser === entry.userId;
            const rankStyle = RANK_STYLES[entry.rank] || "text-cinema-300 bg-cinema-800/50 border-cinema-700/30";

            let breakdown: ScoreBreakdown | null = null;
            try {
              breakdown = JSON.parse(entry.breakdownJson);
            } catch {
              // ignore
            }

            return (
              <div key={entry.userId}>
                <button
                  onClick={() =>
                    setExpandedUser(isExpanded ? null : entry.userId)
                  }
                  className={`w-full grid grid-cols-[4rem_1fr_5rem] sm:grid-cols-[4rem_1fr_5rem_5rem_5rem_5rem] gap-2 items-center px-4 py-3 rounded-lg border transition-all ${
                    isMe
                      ? "bg-gold-600/10 border-gold-500/20"
                      : "bg-cinema-800/40 border-cinema-700/20 hover:bg-cinema-800/70"
                  }`}
                >
                  {/* Rank */}
                  <div className="flex justify-center">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border ${rankStyle}`}
                    >
                      {entry.rank}
                    </span>
                  </div>

                  {/* Name */}
                  <div className="text-left">
                    <span
                      className={`font-medium ${
                        isMe ? "text-gold-300" : "text-cinema-100"
                      }`}
                    >
                      {entry.displayName}
                      {isMe && (
                        <span className="ml-2 text-xs text-gold-500">
                          (you)
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Score */}
                  <span className="text-right font-bold text-lg text-cinema-100">
                    {entry.totalScore}
                  </span>

                  {/* Crown (desktop) */}
                  <span className="text-right text-cinema-300 hidden sm:block">
                    {entry.crownPoints}
                  </span>

                  {/* Correct (desktop) */}
                  <span className="text-right text-cinema-300 hidden sm:block">
                    {entry.correctCount}
                  </span>

                  {/* Score bar (desktop) */}
                  <div className="hidden sm:block">
                    <div className="h-2 bg-cinema-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full"
                        style={{
                          width: `${(entry.totalScore / 200) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && breakdown && (
                  <div className="mt-1 ml-16 mr-4 p-4 bg-cinema-800/60 border border-cinema-700/30 rounded-lg space-y-3 animate-fade-in-up">
                    <h4 className="text-sm font-semibold text-cinema-200">
                      Score Breakdown
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {breakdown.clusters.map((cl) => (
                        <div
                          key={cl.clusterId}
                          className="bg-cinema-900/50 rounded-lg p-3"
                        >
                          <div className="text-xs text-cinema-400 mb-1">
                            {cl.clusterName}
                          </div>
                          <div className="text-lg font-bold text-cinema-100">
                            {cl.clusterTotal}
                          </div>
                          <div className="text-xs text-cinema-500">
                            {cl.correctCount}/{cl.totalInCluster} correct
                            {cl.sweepBonusEarned > 0 && (
                              <span className="text-gold-400 ml-1">
                                +{cl.sweepBonusEarned} bonus
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="bg-cinema-900/50 rounded-lg p-3">
                        <div className="text-xs text-cinema-400 mb-1">
                          Final 10
                        </div>
                        <div className="text-lg font-bold text-cinema-100">
                          {breakdown.finalTen.points}
                        </div>
                        <div className="text-xs text-cinema-500">
                          {breakdown.finalTen.picked
                            ? breakdown.finalTen.correct
                              ? "Correct!"
                              : "Incorrect"
                            : "Not picked"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
