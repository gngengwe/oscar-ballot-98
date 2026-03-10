"use client";

import { useState, useTransition } from "react";
import { updateUserProfile } from "@/lib/actions";
import { ScoreBreakdown } from "@/lib/scoring";

interface Pick {
  categoryName: string;
  clusterName: string;
  nomineeName: string;
  filmTitle?: string | null;
  correct: boolean | null; // null if no winners published yet
}

interface ProfileClientProps {
  displayName: string;
  email: string;
  memberSince: string;
  score: {
    totalScore: number;
    crownPoints: number;
    correctCount: number;
    breakdown: ScoreBreakdown;
  } | null;
  picks: Pick[];
  winnersPublished: number;
  rank: number | null;
  totalPlayers: number;
}

export default function ProfileClient({
  displayName: initialName,
  email,
  memberSince,
  score,
  picks,
  winnersPublished,
  rank,
  totalPlayers,
}: ProfileClientProps) {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(initialName);
  const [currentName, setCurrentName] = useState(initialName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaved, setNameSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"overview" | "picks">("overview");

  function handleSaveName() {
    setNameError(null);
    startTransition(async () => {
      const result = await updateUserProfile(nameInput);
      if (result.error) {
        setNameError(result.error);
      } else {
        setCurrentName(nameInput);
        setEditing(false);
        setNameSaved(true);
        setTimeout(() => setNameSaved(false), 3000);
      }
    });
  }

  const correctPicks = picks.filter((p) => p.correct === true).length;
  const wrongPicks = picks.filter((p) => p.correct === false).length;
  const unknownPicks = picks.filter((p) => p.correct === null).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile Header */}
      <div className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {/* Avatar placeholder */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-500/40 to-gold-700/20 border border-gold-500/30 flex items-center justify-center text-2xl">
              🏆
            </div>
            <div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                    maxLength={50}
                    className="px-3 py-1.5 rounded-lg bg-cinema-900 border border-cinema-600/50 text-cinema-100 text-lg font-bold focus:border-gold-400 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isPending || !nameInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-gold-600 text-white text-sm font-medium hover:bg-gold-500 disabled:opacity-50 transition-all"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditing(false); setNameInput(currentName); setNameError(null); }}
                    className="px-3 py-1.5 rounded-lg bg-cinema-700 text-cinema-300 text-sm hover:bg-cinema-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-cinema-100">{currentName}</h1>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-cinema-500 hover:text-gold-400 transition-colors"
                    title="Edit display name"
                  >
                    ✏️
                  </button>
                </div>
              )}
              {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
              {nameSaved && <p className="text-green-400 text-xs mt-1">Name updated!</p>}
              <p className="text-cinema-400 text-sm mt-0.5">{email}</p>
              <p className="text-cinema-500 text-xs mt-0.5">
                Member since {new Date(memberSince).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Score badge */}
          {score && (
            <div className="text-center bg-cinema-900/60 border border-gold-600/20 rounded-xl px-6 py-3">
              <div className="text-3xl font-bold text-gold-400">{score.totalScore}</div>
              <div className="text-cinema-400 text-xs">points</div>
              {rank && (
                <div className="text-cinema-300 text-sm mt-1">
                  Rank <span className="text-gold-400 font-bold">#{rank}</span>
                  <span className="text-cinema-500"> / {totalPlayers}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-2 mb-6 border-b border-cinema-700/30 pb-2">
        {(["overview", "picks"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all capitalize ${
              activeTab === t
                ? "bg-cinema-800 text-gold-400 border-b-2 border-gold-400"
                : "text-cinema-400 hover:text-cinema-200"
            }`}
          >
            {t === "overview" ? "📊 Overview" : "🗳️ My Picks"}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-cinema-100">{picks.length}</div>
              <div className="text-cinema-400 text-sm">Categories Picked</div>
            </div>
            <div className="bg-cinema-800/50 border border-green-700/20 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{correctPicks}</div>
              <div className="text-cinema-400 text-sm">Correct Picks</div>
            </div>
            <div className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-cinema-100">
                {score ? `${Math.round((score.correctCount / Math.max(winnersPublished, 1)) * 100)}%` : "—"}
              </div>
              <div className="text-cinema-400 text-sm">Accuracy (announced)</div>
            </div>
          </div>

          {/* Score breakdown by guild */}
          {score ? (
            <div className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-cinema-100 mb-4">Guild Breakdown</h3>
              <div className="space-y-3">
                {score.breakdown.clusters.map((cl) => (
                  <div key={cl.clusterId}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-cinema-200">{cl.clusterName}</span>
                      <span className="text-sm font-medium text-cinema-100">
                        {cl.clusterTotal} pts
                        {cl.sweepBonusEarned > 0 && (
                          <span className="text-gold-400 ml-1 text-xs">(+{cl.sweepBonusEarned} sweep)</span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 bg-cinema-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full transition-all"
                        style={{ width: `${cl.totalInCluster > 0 ? (cl.correctCount / cl.totalInCluster) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="text-xs text-cinema-500 mt-0.5">
                      {cl.correctCount}/{cl.totalInCluster} correct
                    </div>
                  </div>
                ))}
                {/* Final 10 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-cinema-200">🎯 Final 10 Bonus</span>
                    <span className="text-sm font-medium text-cinema-100">
                      {score.breakdown.finalTen.points} pts
                      {score.breakdown.finalTen.correct && <span className="text-green-400 ml-1">✓</span>}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl p-5 text-center text-cinema-400">
              {winnersPublished === 0
                ? "Score breakdown will appear once winners are announced."
                : "No score computed yet — check back after committing your ballot."}
            </div>
          )}
        </div>
      )}

      {/* ── Picks Tab ── */}
      {activeTab === "picks" && (
        <div className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl overflow-hidden">
          {picks.length === 0 ? (
            <div className="p-8 text-center text-cinema-500">
              No picks saved yet. Head to{" "}
              <a href="/ballot" className="text-gold-400 hover:underline">My Ballot</a> to make your picks.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cinema-700/50">
                  <th className="text-left p-3 text-cinema-300 font-medium">Guild / Category</th>
                  <th className="text-left p-3 text-cinema-300 font-medium">Your Pick</th>
                  <th className="text-center p-3 text-cinema-300 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {picks.map((pick, i) => (
                  <tr key={i} className="border-b border-cinema-700/20 hover:bg-cinema-700/20">
                    <td className="p-3">
                      <div className="text-cinema-200 font-medium">{pick.categoryName}</div>
                      <div className="text-cinema-500 text-xs">{pick.clusterName}</div>
                    </td>
                    <td className="p-3 text-cinema-100">
                      {pick.nomineeName}
                      {pick.filmTitle && (
                        <span className="text-cinema-400 text-xs ml-1">({pick.filmTitle})</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {pick.correct === true && <span className="text-green-400 font-bold">✓</span>}
                      {pick.correct === false && <span className="text-red-400/70">✗</span>}
                      {pick.correct === null && <span className="text-cinema-500">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
