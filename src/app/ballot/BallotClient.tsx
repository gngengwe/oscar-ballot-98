"use client";

import { useState, useTransition } from "react";
import { savePick, saveFinalTenPick, commitBallot } from "@/lib/actions";
import CountdownTimer from "@/components/CountdownTimer";
import TickerSidebar from "@/components/TickerSidebar";

interface Nominee {
  id: string;
  displayName: string;
  filmTitle?: string | null;
  imageUrl?: string | null;
}

interface InsightMetric {
  id: string;
  label: string;
  value: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
}

interface Category {
  id: string;
  name: string;
  basePoints: number;
  eligibleForFinalTen: boolean;
  nominees: Nominee[];
  insightMetrics: InsightMetric[];
}

interface Cluster {
  id: string;
  name: string;
  icon: string;
  description: string;
  maxPoints: number;
  sortOrder: number;
  sweepType: string;
  sweepBonus: number;
  partialThreshold?: number | null;
  partialBonus?: number | null;
  categories: Category[];
}

interface Pick {
  categoryId: string;
  nomineeId: string;
}

interface WinnerPublished {
  categoryId: string;
  nomineeId: string;
}

const CLUSTER_STYLES: Record<number, { gradient: string; accent: string; icon: string }> = {
  1: { gradient: "from-amber-500/15 to-amber-900/5",  accent: "text-amber-400",  icon: "👑"  },
  2: { gradient: "from-rose-500/15 to-rose-900/5",    accent: "text-rose-400",   icon: "🎭"  },
  3: { gradient: "from-blue-500/15 to-blue-900/5",    accent: "text-blue-400",   icon: "✍️"  },
  4: { gradient: "from-violet-500/15 to-violet-900/5",accent: "text-violet-400", icon: "👁️" },
  5: { gradient: "from-cyan-500/15 to-cyan-900/5",    accent: "text-cyan-400",   icon: "✂️"  },
  6: { gradient: "from-emerald-500/15 to-emerald-900/5", accent: "text-emerald-400", icon: "🌍" },
  7: { gradient: "from-indigo-500/15 to-indigo-900/5",accent: "text-indigo-400", icon: "🎞️" },
};

const CLUSTER_BORDERS: Record<number, string> = {
  1: "border-amber-500/30",
  2: "border-rose-500/30",
  3: "border-blue-500/30",
  4: "border-violet-500/30",
  5: "border-cyan-500/30",
  6: "border-emerald-500/30",
  7: "border-indigo-500/30",
};

export default function BallotClient({
  clusters,
  userPicks: initialPicks,
  userFinalTen: initialFinalTen,
  winnersPublished,
  isOpen,
  isCommitted: initialCommitted,
  ballotClosesAt,
  totalCategories,
  picksMade: initialPicksMade,
}: {
  clusters: Cluster[];
  userPicks: Pick[];
  userFinalTen: { categoryId: string; nomineeId: string } | null;
  winnersPublished: WinnerPublished[];
  isOpen: boolean;
  isCommitted: boolean;
  ballotClosesAt: string | null;
  totalCategories: number;
  picksMade: number;
}) {
  const [picks, setPicks] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const p of initialPicks) map[p.categoryId] = p.nomineeId;
    return map;
  });

  const [finalTen, setFinalTen] = useState<{
    categoryId: string;
    nomineeId: string;
  } | null>(initialFinalTen);

  const [isCommitted, setIsCommitted] = useState(initialCommitted);
  const [isPending, startTransition] = useTransition();
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const winnersMap = new Map<string, string>();
  for (const w of winnersPublished) winnersMap.set(w.categoryId, w.nomineeId);

  const totalPicked = Object.keys(picks).length;
  const completionPct = Math.round((totalPicked / totalCategories) * 100);

  const canEdit = isOpen && !isCommitted;

  function handlePick(categoryId: string, nomineeId: string) {
    if (!canEdit) return;
    setPicks((prev) => ({ ...prev, [categoryId]: nomineeId }));
    setSaveError(null);

    startTransition(async () => {
      const result = await savePick(categoryId, nomineeId);
      if (result.error) {
        setSaveError(result.error);
      } else {
        setLastSaved(new Date().toLocaleTimeString());
      }
    });
  }

  function handleFinalTen(categoryId: string, nomineeId: string) {
    if (!canEdit) return;
    setFinalTen({ categoryId, nomineeId });
    setSaveError(null);

    startTransition(async () => {
      const result = await saveFinalTenPick(categoryId, nomineeId);
      if (result.error) {
        setSaveError(result.error);
      } else {
        setLastSaved(new Date().toLocaleTimeString());
      }
    });
  }

  function handleCommit() {
    if (!canEdit || totalPicked < totalCategories) return;

    if (
      !window.confirm(
        "Are you sure? Once committed, you cannot change your picks."
      )
    )
      return;

    startTransition(async () => {
      const result = await commitBallot();
      if (result.success) setIsCommitted(true);
    });
  }

  function handleShareBallot() {
    const lines: string[] = ["🏆 My Oscar Ballot 2026 picks:\n"];
    for (const cluster of clusters) {
      lines.push(`${cluster.name}`);
      for (const cat of cluster.categories) {
        const nomId = picks[cat.id];
        const nominee = cat.nominees.find((n) => n.id === nomId);
        lines.push(`  ${cat.name}: ${nominee ? nominee.displayName : "(no pick)"}`);
      }
    }
    if (finalTen) {
      const ftCat = clusters.flatMap((c) => c.categories).find((c) => c.id === finalTen.categoryId);
      const ftNom = ftCat?.nominees.find((n) => n.id === finalTen.nomineeId);
      lines.push(`\n🎯 Final 10: ${ftCat?.name} → ${ftNom?.displayName || "(no pick)"}`);
    }
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    });
  }

  // Final 10 eligible categories
  const finalTenCategories = clusters
    .flatMap((c) => c.categories)
    .filter((cat) => cat.eligibleForFinalTen);

  return (
    <div className="flex">
      <div className="flex-1 min-w-0 max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-cinema-100">My Ballot</h1>
            <p className="text-cinema-400 text-sm mt-1">
              Pick your winners for the 98th Academy Awards
            </p>
          </div>

          <div className="flex items-center gap-4">
            {ballotClosesAt && isOpen && (
              <CountdownTimer targetDate={ballotClosesAt} />
            )}
            {!isOpen && !isCommitted && (
              <span className="px-3 py-1.5 rounded-lg bg-cinema-800 border border-cinema-600/30 text-cinema-400 text-sm">
                Ballot not yet open
              </span>
            )}
            {isCommitted && (
              <span className="px-3 py-1.5 rounded-lg bg-green-900/30 border border-green-700/50 text-green-400 text-sm font-medium">
                🔒 Ballot Committed
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 bg-cinema-800/50 border border-cinema-700/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-cinema-300">
              Picks: {totalPicked} / {totalCategories}
              {finalTen ? " + Final 10" : ""}
            </span>
            <span className="text-sm text-cinema-300">
              {completionPct}% complete
            </span>
          </div>
          <div className="h-2 bg-cinema-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div>
              {saveError && (
                <span className="text-xs text-red-400">⚠ {saveError}</span>
              )}
              {!saveError && lastSaved && (
                <span className="text-xs text-cinema-500">
                  Last saved: {lastSaved}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isPending && (
                <span className="text-xs text-gold-400">Saving...</span>
              )}
              {totalPicked > 0 && (
                <button
                  onClick={handleShareBallot}
                  className="text-xs px-2 py-1 rounded bg-cinema-700 text-cinema-300 hover:text-cinema-100 hover:bg-cinema-600 transition-all"
                  title="Copy picks to clipboard"
                >
                  {shareCopied ? "✓ Copied!" : "📋 Share"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cluster Quick Nav (Mobile) */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 lg:hidden">
          {clusters.map((cluster) => {
            const style = CLUSTER_STYLES[cluster.sortOrder] || CLUSTER_STYLES[1];
            return (
              <button
                key={cluster.id}
                onClick={() => {
                  setActiveCluster(cluster.id);
                  document.getElementById(`cluster-${cluster.id}`)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  activeCluster === cluster.id
                    ? `bg-cinema-700 ${CLUSTER_BORDERS[cluster.sortOrder]}`
                    : "bg-cinema-800/50 border-cinema-700/30"
                }`}
              >
                <span className="mr-1">{style.icon}</span>
                {cluster.name}
              </button>
            );
          })}
        </div>

        {/* Clusters */}
        <div className="space-y-8">
          {clusters.map((cluster) => {
            const style = CLUSTER_STYLES[cluster.sortOrder] || CLUSTER_STYLES[1];
            const bonusDesc =
              cluster.sweepType === "partial"
                ? `+${cluster.partialBonus} (${cluster.partialThreshold}/${cluster.categories.length}) or +${cluster.sweepBonus} (all ${cluster.categories.length})`
                : `+${cluster.sweepBonus} sweep (all ${cluster.categories.length})`;

            return (
              <section
                key={cluster.id}
                id={`cluster-${cluster.id}`}
                className={`cluster-section rounded-xl bg-gradient-to-br ${style.gradient} border ${CLUSTER_BORDERS[cluster.sortOrder]} p-5 sm:p-6`}
              >
                {/* Cluster Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{style.icon}</span>
                    <div>
                      <h2 className={`text-xl font-bold ${style.accent}`}>
                        {cluster.name}
                      </h2>
                      <p className="text-cinema-400 text-xs">{bonusDesc}</p>
                    </div>
                  </div>
                  <span className="text-gold-400 font-bold text-sm bg-cinema-900/60 px-3 py-1 rounded-lg">
                    max {cluster.maxPoints}
                  </span>
                </div>

                {/* Categories */}
                <div className="space-y-6">
                  {cluster.categories.map((category) => {
                    const selectedId = picks[category.id];
                    const winnerId = winnersMap.get(category.id);

                    return (
                      <div key={category.id}>
                        {/* Category Name */}
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-cinema-100 uppercase tracking-wide">
                            {category.name}
                            <span className="ml-2 text-cinema-500 font-normal lowercase">
                              {category.basePoints} pts
                            </span>
                          </h3>
                          {winnerId && (
                            <span className="text-xs px-2 py-0.5 rounded bg-gold-600/20 text-gold-400">
                              Winner announced
                            </span>
                          )}
                        </div>

                        {/* Insight Chips */}
                        {category.insightMetrics.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {category.insightMetrics.map((metric) => (
                              <span
                                key={metric.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cinema-700/50 text-[11px] text-cinema-300"
                                title={metric.sourceName || undefined}
                              >
                                {metric.label}: <span className="text-cinema-100 font-medium">{metric.value}</span>
                                {metric.sourceUrl && (
                                  <a href={metric.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-cinema-500 hover:text-gold-400">↗</a>
                                )}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Nominee Cards */}
                        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                          {category.nominees.map((nominee) => {
                            const isSelected = selectedId === nominee.id;
                            const isWinner = winnerId === nominee.id;
                            const isCorrect = isSelected && isWinner;
                            const isWrong = isSelected && winnerId && !isWinner;

                            return (
                              <button
                                key={nominee.id}
                                onClick={() => handlePick(category.id, nominee.id)}
                                disabled={!canEdit}
                                className={`nominee-card relative rounded-lg p-3 text-left border transition-all ${
                                  isSelected
                                    ? "selected border-gold-400 bg-gold-600/10"
                                    : "border-cinema-600/30 bg-cinema-800/60 hover:border-cinema-500"
                                } ${isCorrect ? "!border-green-400 !bg-green-900/20" : ""} ${
                                  isWrong ? "!border-red-400/50 !bg-red-900/10" : ""
                                } ${isWinner && !isSelected ? "!border-green-500/30 !bg-green-900/10" : ""} disabled:cursor-default`}
                              >
                                <p className="text-xs font-medium text-cinema-100 line-clamp-2">
                                  {nominee.displayName}
                                </p>
                                {nominee.filmTitle && (
                                  <p className="text-[10px] text-cinema-400 mt-0.5 line-clamp-1">
                                    {nominee.filmTitle}
                                  </p>
                                )}

                                {/* Status badges */}
                                {isSelected && (
                                  <div className="absolute top-1.5 right-1.5">
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                                      isCorrect ? "bg-green-500 text-white" : isWrong ? "bg-red-500/80 text-white" : "bg-gold-500 text-cinema-900"
                                    }`}>
                                      {isCorrect ? "✓" : isWrong ? "✗" : "★"}
                                    </div>
                                  </div>
                                )}
                                {isWinner && !isSelected && (
                                  <div className="absolute top-1.5 right-1.5">
                                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white">
                                      ✓
                                    </div>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* Final 10 Section */}
          <section className="rounded-xl bg-gradient-to-br from-gold-600/15 to-cinema-900/50 border border-gold-500/30 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-3xl">🎯</span>
              <div>
                <h2 className="text-xl font-bold text-gold-400">
                  Final 10 Bonus
                </h2>
                <p className="text-cinema-400 text-xs">
                  Choose one Crown category + nominee for +10 points if correct
                </p>
              </div>
              <span className="ml-auto text-gold-400 font-bold text-sm bg-cinema-900/60 px-3 py-1 rounded-lg">
                +10
              </span>
            </div>

            {/* Category selector */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-cinema-300 mb-2">
                  Select Category
                </label>
                <div className="space-y-2">
                  {finalTenCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        if (!canEdit) return;
                        setFinalTen(
                          finalTen?.categoryId === cat.id
                            ? finalTen
                            : { categoryId: cat.id, nomineeId: "" }
                        );
                      }}
                      disabled={!canEdit}
                      className={`w-full text-left px-4 py-2 rounded-lg border text-sm transition-all ${
                        finalTen?.categoryId === cat.id
                          ? "border-gold-400 bg-gold-600/10 text-gold-300"
                          : "border-cinema-600/30 bg-cinema-800/60 text-cinema-200 hover:border-cinema-500"
                      } disabled:cursor-default`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-cinema-300 mb-2">
                  Select Nominee
                </label>
                {finalTen?.categoryId ? (
                  <div className="space-y-2">
                    {finalTenCategories
                      .find((c) => c.id === finalTen.categoryId)
                      ?.nominees.map((nominee) => (
                        <button
                          key={nominee.id}
                          onClick={() =>
                            handleFinalTen(
                              finalTen.categoryId,
                              nominee.id
                            )
                          }
                          disabled={!canEdit}
                          className={`w-full text-left px-4 py-2 rounded-lg border text-sm transition-all ${
                            finalTen.nomineeId === nominee.id
                              ? "border-gold-400 bg-gold-600/10 text-gold-300"
                              : "border-cinema-600/30 bg-cinema-800/60 text-cinema-200 hover:border-cinema-500"
                          } disabled:cursor-default`}
                        >
                          {nominee.displayName}
                          {nominee.filmTitle && (
                            <span className="text-cinema-400 ml-1 text-xs">
                              ({nominee.filmTitle})
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                ) : (
                  <p className="text-cinema-500 text-sm py-4">
                    Select a category first
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Commit Button */}
        {canEdit && (
          <div className="sticky bottom-0 mt-8 py-4 bg-gradient-to-t from-cinema-950 via-cinema-950/95 to-transparent">
            <div className="flex items-center justify-between">
              <div className="text-sm text-cinema-400">
                {totalPicked < totalCategories
                  ? `${totalCategories - totalPicked} picks remaining`
                  : "All picks made!"}
              </div>
              <button
                onClick={handleCommit}
                disabled={totalPicked < totalCategories || isPending}
                className="px-8 py-3 rounded-lg bg-gold-600 text-white font-semibold hover:bg-gold-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all glow-gold"
              >
                🔒 Commit Ballot
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="pt-6 pr-4 hidden lg:block">
        <TickerSidebar />
      </div>
    </div>
  );
}
