"use client";

import { useState, useTransition } from "react";
import {
  setDraftWinner,
  publishWinners,
  recomputeAllScores,
  updateBallotWindow,
  createNominee,
  deleteNominee,
  createTickerItem,
  deleteTickerItem,
  toggleTickerItem,
} from "@/lib/actions";

interface Nominee {
  id: string;
  displayName: string;
  filmTitle?: string | null;
  imageUrl?: string | null;
}

interface WinnerDraft { nomineeId: string; }
interface WinnerPublished { nomineeId: string; }

interface Category {
  id: string;
  name: string;
  basePoints: number;
  eligibleForFinalTen: boolean;
  nominees: Nominee[];
  winnerDraft: WinnerDraft | null;
  winnerPublished: WinnerPublished | null;
}

interface Cluster {
  id: string;
  name: string;
  icon: string;
  maxPoints: number;
  sortOrder: number;
  categories: Category[];
}

interface Settings {
  ballotOpensAt: string;
  ballotClosesAt: string;
  timezone: string;
}

interface AuditLogEntry {
  id: string;
  userId: string;
  user: { displayName: string };
  action: string;
  entityType: string;
  entityId?: string | null;
  createdAt: string;
}

interface NomineeStat {
  id: string;
  name: string;
  film: string | null;
  count: number;
  pct: number;
}

interface CategoryPickStat {
  catId: string;
  categoryName: string;
  clusterName: string;
  totalPicks: number;
  winnerId: string | null;
  nominees: NomineeStat[];
}

interface ScoreDistribution {
  buckets: { label: string; min: number; max: number; count: number }[];
  avg: number;
  total: number;
}

interface TickerItemData {
  id: string;
  title: string;
  snippet: string;
  sourceName: string | null;
  sourceUrl: string | null;
  isTrivia: boolean;
  isSpotlight: boolean;
  isActive: boolean;
  retrievedAt: string;
}

type Tab = "overview" | "winners" | "nominees" | "ballot" | "ticker" | "analytics" | "audit" | "import";

export default function AdminClient({
  clusters,
  settings,
  auditLogs,
  stats,
  pickStats,
  scoreDistribution,
  tickerItems: initialTickerItems,
}: {
  clusters: Cluster[];
  settings: Settings | null;
  auditLogs: AuditLogEntry[];
  stats: {
    userCount: number;
    committedBallots: number;
    winnersPublished: number;
    totalCategories: number;
    tickerItems: number;
  };
  pickStats: CategoryPickStat[];
  scoreDistribution: ScoreDistribution;
  tickerItems: TickerItemData[];
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [tickerItems, setTickerItems] = useState(initialTickerItems);

  // Ballot window state
  const [opensAt, setOpensAt] = useState(
    settings?.ballotOpensAt ? new Date(settings.ballotOpensAt).toISOString().slice(0, 16) : ""
  );
  const [closesAt, setClosesAt] = useState(
    settings?.ballotClosesAt ? new Date(settings.ballotClosesAt).toISOString().slice(0, 16) : ""
  );
  const [tz, setTz] = useState(settings?.timezone || "America/Los_Angeles");

  // New nominee form
  const [newNominee, setNewNominee] = useState({ categoryId: "", displayName: "", filmTitle: "" });

  // Ticker form
  const [tickerForm, setTickerForm] = useState({ title: "", snippet: "", sourceName: "", sourceUrl: "", isTrivia: false });

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "overview",   label: "Overview",       icon: "📊" },
    { id: "winners",    label: "Winners",         icon: "🏆" },
    { id: "nominees",   label: "Nominees",        icon: "🎭" },
    { id: "ballot",     label: "Ballot Window",   icon: "⏰" },
    { id: "ticker",     label: "Ticker",          icon: "📰" },
    { id: "analytics",  label: "Analytics",       icon: "📈" },
    { id: "audit",      label: "Audit Log",       icon: "📋" },
    { id: "import",     label: "Import/Export",   icon: "📁" },
  ];

  const maxBucket = Math.max(...scoreDistribution.buckets.map((b) => b.count), 1);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-cinema-100 mb-6">Admin Dashboard</h1>

      {/* Message Banner */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === "success"
            ? "bg-green-900/30 border border-green-700/50 text-green-300"
            : "bg-red-900/30 border border-red-700/50 text-red-300"
        }`}>
          {message.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b border-cinema-700/30">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.id
                ? "bg-cinema-800 text-gold-400 border-b-2 border-gold-400"
                : "text-cinema-400 hover:text-cinema-200"
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Overview Tab ─── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Users",              value: stats.userCount,                                          icon: "👥" },
              { label: "Committed Ballots",  value: stats.committedBallots,                                   icon: "🗳️" },
              { label: "Winners Published",  value: `${stats.winnersPublished}/${stats.totalCategories}`,     icon: "🏆" },
              { label: "Ticker Items",       value: stats.tickerItems,                                        icon: "📰" },
            ].map((stat) => (
              <div key={stat.label} className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span>{stat.icon}</span>
                  <span className="text-cinema-400 text-sm">{stat.label}</span>
                </div>
                <span className="text-2xl font-bold text-cinema-100">{stat.value}</span>
              </div>
            ))}
          </div>

          <div className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-cinema-100 mb-4">Setup Checklist</h3>
            <div className="space-y-2">
              {[
                { done: !!settings, label: "Set ballot window (open/close dates)" },
                { done: clusters.some((c) => c.categories.some((cat) => cat.nominees.length > 0)), label: "Add nominees to categories" },
                { done: stats.tickerItems > 0, label: "Add ticker/trivia content" },
                { done: stats.winnersPublished > 0, label: "Publish winners" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className={item.done ? "text-green-400" : "text-cinema-500"}>{item.done ? "✓" : "○"}</span>
                  <span className={item.done ? "text-cinema-200" : "text-cinema-400"}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => startTransition(async () => {
                await recomputeAllScores();
                showMessage("success", "Scores recomputed for all users");
              })}
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-cinema-800 border border-cinema-600/30 text-cinema-200 text-sm hover:bg-cinema-700 disabled:opacity-50 transition-all"
            >
              🔄 Recompute All Scores
            </button>
          </div>
        </div>
      )}

      {/* ─── Winners Tab ─── */}
      {tab === "winners" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-cinema-400 text-sm">
              Set draft winners per category, then publish to update the leaderboard.
            </p>
            <button
              onClick={() => startTransition(async () => {
                if (!window.confirm("Publish all draft winners and update scores?")) return;
                const result = await publishWinners();
                if (result.error) showMessage("error", result.error);
                else showMessage("success", "Winners published! Scores recomputed.");
              })}
              disabled={isPending}
              className="px-6 py-2 rounded-lg bg-gold-600 text-white font-semibold hover:bg-gold-500 disabled:opacity-50 transition-all glow-gold"
            >
              🏆 Publish Winners
            </button>
          </div>

          {clusters.map((cluster) => (
            <div key={cluster.id} className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-cinema-100 mb-4">
                {cluster.icon || "🎬"} {cluster.name}
              </h3>
              <div className="space-y-4">
                {cluster.categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-4 flex-wrap">
                    <span className="text-sm font-medium text-cinema-200 w-48">{category.name}</span>
                    <select
                      value={category.winnerDraft?.nomineeId || ""}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        startTransition(async () => {
                          await setDraftWinner(category.id, e.target.value);
                          showMessage("success", `Draft winner set for ${category.name}`);
                        });
                      }}
                      className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-cinema-900 border border-cinema-600/50 text-cinema-100 text-sm"
                    >
                      <option value="">Select winner...</option>
                      {category.nominees.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.displayName}{n.filmTitle ? ` (${n.filmTitle})` : ""}
                        </option>
                      ))}
                    </select>
                    {category.winnerPublished && (
                      <span className="text-xs px-2 py-1 rounded bg-green-900/30 text-green-400">Published</span>
                    )}
                    {category.winnerDraft && !category.winnerPublished && (
                      <span className="text-xs px-2 py-1 rounded bg-yellow-900/30 text-yellow-400">Draft</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Nominees Tab ─── */}
      {tab === "nominees" && (
        <div className="space-y-6">
          <div className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-cinema-100 mb-4">Add Nominee</h3>
            <div className="grid sm:grid-cols-4 gap-3">
              <select
                value={newNominee.categoryId}
                onChange={(e) => setNewNominee({ ...newNominee, categoryId: e.target.value })}
                className="px-3 py-2 rounded-lg bg-cinema-900 border border-cinema-600/50 text-cinema-100 text-sm"
              >
                <option value="">Category...</option>
                {clusters.flatMap((c) =>
                  c.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{c.name} → {cat.name}</option>
                  ))
                )}
              </select>
              <input
                placeholder="Display name"
                value={newNominee.displayName}
                onChange={(e) => setNewNominee({ ...newNominee, displayName: e.target.value })}
                className="px-3 py-2 rounded-lg bg-cinema-900 border border-cinema-600/50 text-cinema-100 text-sm"
              />
              <input
                placeholder="Film title (optional)"
                value={newNominee.filmTitle}
                onChange={(e) => setNewNominee({ ...newNominee, filmTitle: e.target.value })}
                className="px-3 py-2 rounded-lg bg-cinema-900 border border-cinema-600/50 text-cinema-100 text-sm"
              />
              <button
                onClick={() => {
                  if (!newNominee.categoryId || !newNominee.displayName) return;
                  startTransition(async () => {
                    await createNominee(newNominee.categoryId, newNominee.displayName, newNominee.filmTitle || undefined);
                    setNewNominee({ categoryId: "", displayName: "", filmTitle: "" });
                    showMessage("success", "Nominee added");
                  });
                }}
                disabled={isPending || !newNominee.categoryId || !newNominee.displayName}
                className="px-4 py-2 rounded-lg bg-gold-600 text-white text-sm font-medium hover:bg-gold-500 disabled:opacity-50 transition-all"
              >
                Add
              </button>
            </div>
          </div>

          {clusters.map((cluster) => (
            <div key={cluster.id} className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-cinema-100 mb-4">{cluster.name}</h3>
              {cluster.categories.map((category) => (
                <div key={category.id} className="mb-4 last:mb-0">
                  <h4 className="text-sm font-medium text-cinema-300 mb-2">
                    {category.name} ({category.nominees.length} nominees)
                  </h4>
                  <div className="space-y-1">
                    {category.nominees.map((nominee) => (
                      <div key={nominee.id} className="flex items-center gap-3 text-sm text-cinema-200 py-1 px-2 rounded hover:bg-cinema-700/30">
                        <span className="flex-1">
                          {nominee.displayName}
                          {nominee.filmTitle && <span className="text-cinema-400 ml-1">({nominee.filmTitle})</span>}
                        </span>
                        <button
                          onClick={() => {
                            if (!window.confirm(`Delete ${nominee.displayName}?`)) return;
                            startTransition(async () => {
                              await deleteNominee(nominee.id);
                              showMessage("success", "Nominee deleted");
                            });
                          }}
                          className="text-red-400/60 hover:text-red-400 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                    {category.nominees.length === 0 && (
                      <p className="text-cinema-500 text-xs italic">No nominees yet</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ─── Ballot Window Tab ─── */}
      {tab === "ballot" && (
        <div className="max-w-md space-y-4">
          <div className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-cinema-100 mb-4">Ballot Window</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-cinema-300 mb-1">Opens At</label>
                <input
                  type="datetime-local"
                  value={opensAt}
                  onChange={(e) => setOpensAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cinema-900 border border-cinema-600/50 text-cinema-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-cinema-300 mb-1">Closes At</label>
                <input
                  type="datetime-local"
                  value={closesAt}
                  onChange={(e) => setClosesAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cinema-900 border border-cinema-600/50 text-cinema-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-cinema-300 mb-1">Timezone</label>
                <select
                  value={tz}
                  onChange={(e) => setTz(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-cinema-900 border border-cinema-600/50 text-cinema-100 text-sm"
                >
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <button
                onClick={() => startTransition(async () => {
                  const result = await updateBallotWindow(opensAt, closesAt, tz);
                  if (result.success) showMessage("success", "Ballot window updated");
                })}
                disabled={isPending || !opensAt || !closesAt}
                className="w-full py-2 rounded-lg bg-gold-600 text-white font-medium hover:bg-gold-500 disabled:opacity-50 transition-all"
              >
                Save Ballot Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Ticker Tab ─── */}
      {tab === "ticker" && (
        <div className="space-y-6">
          {/* Add form */}
          <div className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-cinema-100 mb-4">Add Ticker Item</h3>
            <div className="space-y-3">
              <input
                placeholder="Title"
                value={tickerForm.title}
                onChange={(e) => setTickerForm({ ...tickerForm, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-cinema-900 border border-cinema-600/50 text-cinema-100 text-sm"
              />
              <textarea
                placeholder="Snippet (1-2 sentences)"
                value={tickerForm.snippet}
                onChange={(e) => setTickerForm({ ...tickerForm, snippet: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-cinema-900 border border-cinema-600/50 text-cinema-100 text-sm"
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  placeholder="Source name (optional)"
                  value={tickerForm.sourceName}
                  onChange={(e) => setTickerForm({ ...tickerForm, sourceName: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-cinema-900 border border-cinema-600/50 text-cinema-100 text-sm"
                />
                <input
                  placeholder="Source URL (optional)"
                  value={tickerForm.sourceUrl}
                  onChange={(e) => setTickerForm({ ...tickerForm, sourceUrl: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-cinema-900 border border-cinema-600/50 text-cinema-100 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-cinema-300">
                <input
                  type="checkbox"
                  checked={tickerForm.isTrivia}
                  onChange={(e) => setTickerForm({ ...tickerForm, isTrivia: e.target.checked })}
                  className="rounded"
                />
                This is trivia / fun fact
              </label>
              <button
                onClick={() => {
                  if (!tickerForm.title || !tickerForm.snippet) return;
                  startTransition(async () => {
                    await createTickerItem(tickerForm);
                    setTickerForm({ title: "", snippet: "", sourceName: "", sourceUrl: "", isTrivia: false });
                    showMessage("success", "Ticker item added");
                  });
                }}
                disabled={isPending || !tickerForm.title || !tickerForm.snippet}
                className="px-4 py-2 rounded-lg bg-gold-600 text-white text-sm font-medium hover:bg-gold-500 disabled:opacity-50 transition-all"
              >
                Add Item
              </button>
            </div>
          </div>

          {/* RSS Fetch */}
          <div className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-cinema-100 mb-2">RSS Feed Fetcher</h3>
            <p className="text-cinema-400 text-sm mb-4">Fetch Oscar-related news from configured RSS feeds.</p>
            <button
              onClick={() => startTransition(async () => {
                const res = await fetch("/api/ticker/fetch", { method: "POST" });
                const data = await res.json();
                showMessage("success", `Fetched ${data.count || 0} new items`);
              })}
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-cinema-700 text-cinema-200 text-sm hover:bg-cinema-600 disabled:opacity-50 transition-all"
            >
              🔄 Fetch Now
            </button>
          </div>

          {/* Existing ticker items */}
          <div className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-cinema-700/30">
              <h3 className="text-lg font-semibold text-cinema-100">
                Existing Items ({tickerItems.length})
              </h3>
            </div>
            <div className="divide-y divide-cinema-700/20 max-h-[600px] overflow-y-auto">
              {tickerItems.length === 0 && (
                <p className="p-6 text-cinema-500 text-sm text-center">No ticker items yet.</p>
              )}
              {tickerItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 flex items-start gap-3 hover:bg-cinema-700/20 transition-colors ${
                    !item.isActive ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-cinema-100 text-sm font-medium line-clamp-1">{item.title}</span>
                      {item.isTrivia && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-400">trivia</span>
                      )}
                      {item.isSpotlight && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-900/40 text-gold-400">spotlight</span>
                      )}
                      {!item.isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cinema-700 text-cinema-400">inactive</span>
                      )}
                    </div>
                    <p className="text-cinema-400 text-xs line-clamp-2">{item.snippet}</p>
                    {item.sourceName && (
                      <p className="text-cinema-500 text-xs mt-0.5">Source: {item.sourceName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => startTransition(async () => {
                        await toggleTickerItem(item.id, !item.isActive);
                        setTickerItems((prev) =>
                          prev.map((t) => t.id === item.id ? { ...t, isActive: !item.isActive } : t)
                        );
                      })}
                      className="text-xs text-cinema-400 hover:text-cinema-200 transition-colors"
                      title={item.isActive ? "Deactivate" : "Activate"}
                    >
                      {item.isActive ? "⏸" : "▶"}
                    </button>
                    <button
                      onClick={() => {
                        if (!window.confirm("Delete this ticker item?")) return;
                        startTransition(async () => {
                          await deleteTickerItem(item.id);
                          setTickerItems((prev) => prev.filter((t) => t.id !== item.id));
                          showMessage("success", "Ticker item deleted");
                        });
                      }}
                      className="text-red-400/60 hover:text-red-400 text-xs transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Analytics Tab ─── */}
      {tab === "analytics" && (
        <div className="space-y-8">
          {/* Score distribution */}
          <div className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-cinema-100 mb-1">Score Distribution</h3>
            <p className="text-cinema-400 text-sm mb-5">
              {scoreDistribution.total} players · Average score:{" "}
              <span className="text-gold-400 font-medium">{scoreDistribution.avg} pts</span>
            </p>
            {scoreDistribution.total === 0 ? (
              <p className="text-cinema-500 text-sm">No scores computed yet.</p>
            ) : (
              <div className="flex items-end gap-3 h-40">
                {scoreDistribution.buckets.map((bucket) => (
                  <div key={bucket.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-cinema-400">{bucket.count}</span>
                    <div
                      className="w-full bg-gradient-to-t from-gold-600 to-gold-400 rounded-t transition-all"
                      style={{ height: `${maxBucket > 0 ? (bucket.count / maxBucket) * 120 : 0}px`, minHeight: bucket.count > 0 ? 4 : 0 }}
                    />
                    <span className="text-[10px] text-cinema-500">{bucket.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pick distribution per category */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cinema-100">Pick Distribution by Category</h3>
            {pickStats.length === 0 ? (
              <p className="text-cinema-500 text-sm">No picks submitted yet.</p>
            ) : (
              pickStats.map((cat) => (
                <div key={cat.catId} className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-cinema-100 font-medium text-sm">{cat.categoryName}</span>
                      <span className="text-cinema-500 text-xs ml-2">{cat.clusterName}</span>
                    </div>
                    <span className="text-cinema-400 text-xs">{cat.totalPicks} picks total</span>
                  </div>
                  <div className="space-y-2">
                    {cat.nominees.map((nom) => (
                      <div key={nom.id}>
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5">
                            {cat.winnerId === nom.id && <span className="text-green-400 text-xs">🏆</span>}
                            <span className="text-cinema-200 text-xs">
                              {nom.name}
                              {nom.film && <span className="text-cinema-500 ml-1">({nom.film})</span>}
                            </span>
                          </div>
                          <span className="text-cinema-400 text-xs">{nom.count} ({nom.pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-cinema-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              cat.winnerId === nom.id ? "bg-green-500" : "bg-gold-600"
                            }`}
                            style={{ width: `${nom.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── Audit Log Tab ─── */}
      {tab === "audit" && (
        <div className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cinema-700/50">
                <th className="text-left p-3 text-cinema-300 font-medium">Time</th>
                <th className="text-left p-3 text-cinema-300 font-medium">User</th>
                <th className="text-left p-3 text-cinema-300 font-medium">Action</th>
                <th className="text-left p-3 text-cinema-300 font-medium">Entity</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className="border-b border-cinema-700/20 hover:bg-cinema-700/20">
                  <td className="p-3 text-cinema-400 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="p-3 text-cinema-200">{log.user.displayName}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-cinema-700 text-cinema-200">{log.action}</span>
                  </td>
                  <td className="p-3 text-cinema-400 text-xs">
                    {log.entityType}{log.entityId && ` #${log.entityId.slice(0, 8)}`}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-cinema-500">No audit log entries yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Import/Export Tab ─── */}
      {tab === "import" && (
        <div className="space-y-6">
          <div className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-cinema-100 mb-4">Export Data</h3>
            <div className="flex flex-wrap gap-3">
              {["nominees", "winners", "insights", "ticker"].map((type) => (
                <a
                  key={type}
                  href={`/api/admin/export?type=${type}`}
                  download
                  className="px-4 py-2 rounded-lg bg-cinema-700 text-cinema-200 text-sm hover:bg-cinema-600 transition-all"
                >
                  📥 Export {type} (JSON)
                </a>
              ))}
            </div>
          </div>

          <div className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-cinema-100 mb-4">Import Data</h3>
            <p className="text-cinema-400 text-sm mb-4">
              Upload a JSON file to bulk import nominees, insights, or ticker items.
            </p>
            <div className="flex items-center gap-3">
              <select
                id="importType"
                className="px-3 py-2 rounded-lg bg-cinema-900 border border-cinema-600/50 text-cinema-100 text-sm"
              >
                <option value="nominees">Nominees</option>
                <option value="insights">Insights</option>
                <option value="ticker">Ticker Items</option>
              </select>
              <input type="file" accept=".json,.csv" id="importFile" className="text-sm text-cinema-300" />
              <button
                onClick={async () => {
                  const fileInput = document.getElementById("importFile") as HTMLInputElement;
                  const typeSelect = document.getElementById("importType") as HTMLSelectElement;
                  const file = fileInput?.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append("file", file);
                  formData.append("type", typeSelect.value);
                  const res = await fetch("/api/admin/import", { method: "POST", body: formData });
                  const data = await res.json();
                  if (data.success) showMessage("success", `Imported ${data.count} items`);
                  else showMessage("error", data.error || "Import failed");
                }}
                className="px-4 py-2 rounded-lg bg-gold-600 text-white text-sm font-medium hover:bg-gold-500 transition-all"
              >
                Upload
              </button>
            </div>
          </div>

          <div className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-cinema-100 mb-2">Sample Templates</h3>
            <p className="text-cinema-400 text-sm mb-4">Download sample JSON templates for bulk import.</p>
            <div className="flex flex-wrap gap-3">
              {["nominees", "insights", "ticker"].map((type) => (
                <a
                  key={type}
                  href={`/api/admin/template?type=${type}`}
                  download
                  className="px-4 py-2 rounded-lg bg-cinema-700 text-cinema-200 text-sm hover:bg-cinema-600 transition-all"
                >
                  📄 {type} template
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
