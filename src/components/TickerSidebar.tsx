"use client";

import { useEffect, useState } from "react";

interface TickerItemData {
  id: string;
  title: string;
  snippet: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
  isTrivia: boolean;
  isSpotlight: boolean;
}

interface NominationCount {
  film: string;
  count: number;
}

export default function TickerSidebar() {
  const [news, setNews] = useState<TickerItemData[]>([]);
  const [trivia, setTrivia] = useState<TickerItemData[]>([]);
  const [spotlight, setSpotlight] = useState<TickerItemData | null>(null);
  const [numbers, setNumbers] = useState<NominationCount[]>([]);
  const [currentTriviaIdx, setCurrentTriviaIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/ticker");
        if (res.ok) {
          const data = await res.json();
          setNews(data.news || []);
          setTrivia(data.trivia || []);
          setSpotlight(data.spotlight || null);
          setNumbers(data.numbers || []);
        }
      } catch {
        // Graceful fallback
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Rotate trivia
  useEffect(() => {
    if (trivia.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentTriviaIdx((i) => (i + 1) % trivia.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [trivia.length]);

  if (loading) {
    return (
      <aside className="w-72 shrink-0 space-y-4 p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-cinema-800 rounded-lg" />
          ))}
        </div>
      </aside>
    );
  }

  const hasContent = news.length > 0 || trivia.length > 0 || spotlight || numbers.length > 0;

  return (
    <aside className="w-72 shrink-0 space-y-4 hidden lg:block">
      {/* Spotlight Card */}
      {spotlight && (
        <div className="bg-gradient-to-br from-gold-600/20 to-cinema-800 border border-gold-600/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gold-400 text-lg">✨</span>
            <h3 className="text-gold-400 font-semibold text-sm uppercase tracking-wide">
              Category Spotlight
            </h3>
          </div>
          <p className="text-sm font-medium text-cinema-100">{spotlight.title}</p>
          <p className="text-xs text-cinema-300 mt-1">{spotlight.snippet}</p>
        </div>
      )}

      {/* By the Numbers */}
      {numbers.length > 0 && (
        <div className="bg-cinema-800/80 border border-cinema-600/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-gold-400 text-lg">📊</span>
            <h3 className="text-gold-400 font-semibold text-sm uppercase tracking-wide">
              By the Numbers
            </h3>
          </div>
          <p className="text-[10px] text-cinema-500 uppercase tracking-wide mb-2">
            Ballot nominations per film
          </p>
          <div className="space-y-2">
            {numbers.map((item, i) => {
              const maxCount = numbers[0]?.count || 1;
              const pct = Math.round((item.count / maxCount) * 100);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-cinema-200 truncate max-w-[180px]">{item.film}</span>
                    <span className="text-xs font-bold text-gold-400 ml-1">{item.count}</span>
                  </div>
                  <div className="h-1 bg-cinema-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Oscar Trivia */}
      {trivia.length > 0 && (
        <div className="bg-cinema-800/80 border border-cinema-600/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-purple-400 text-lg">🎬</span>
            <h3 className="text-purple-400 font-semibold text-sm uppercase tracking-wide">
              Oscar Trivia
            </h3>
          </div>
          <div className="min-h-[60px]">
            <p className="text-sm font-medium text-cinema-100">
              {trivia[currentTriviaIdx]?.title}
            </p>
            <p className="text-xs text-cinema-300 mt-1">
              {trivia[currentTriviaIdx]?.snippet}
            </p>
          </div>
          <div className="flex gap-1 mt-3">
            {trivia.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i === currentTriviaIdx ? "bg-purple-400" : "bg-cinema-600"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Oscar News */}
      {news.length > 0 && (
        <div className="bg-cinema-800/80 border border-cinema-600/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-blue-400 text-lg">📰</span>
            <h3 className="text-blue-400 font-semibold text-sm uppercase tracking-wide">
              Oscar News
            </h3>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {news.slice(0, 6).map((item) => (
              <div key={item.id} className="border-b border-cinema-700/50 pb-2 last:border-0">
                <p className="text-xs font-medium text-cinema-100 line-clamp-2">{item.title}</p>
                {item.sourceName && (
                  <p className="text-[10px] text-cinema-400 mt-0.5">
                    {item.sourceUrl ? (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-gold-400 transition-colors"
                      >
                        {item.sourceName} ↗
                      </a>
                    ) : (
                      item.sourceName
                    )}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasContent && (
        <div className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl p-4 text-center">
          <p className="text-cinema-400 text-sm">🎬 Oscar news and trivia coming soon!</p>
        </div>
      )}
    </aside>
  );
}
