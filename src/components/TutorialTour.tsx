"use client";

import { useState, useEffect } from "react";

const STEPS = [
  {
    id: "welcome",
    icon: "🏆",
    title: "Welcome to Oscar Ballot 2026",
    body: "This is your guide to the 98th Academy Awards pick'em game. Pick the winners across 24 categories, earn bonus points, and climb the leaderboard. Let's walk through how it works.",
    position: "center",
    visual: null,
  },
  {
    id: "clusters",
    icon: "🗂️",
    title: "7 Prestige Guilds",
    body: "Categories are grouped into 7 themed guilds. You pick one winner per category. Score points for each correct pick — and earn a bonus if you sweep an entire guild.",
    position: "center",
    visual: [
      { icon: "👑", name: "The Crown", desc: "Best Picture, Director, Actor, Actress" },
      { icon: "🎭", name: "The Performers", desc: "Supporting Actor, Supporting Actress, Casting" },
      { icon: "✍️", name: "The Authors", desc: "Original & Adapted Screenplay" },
      { icon: "👁️", name: "The Eye", desc: "Cinematography, Design, Costume, Makeup" },
      { icon: "✂️", name: "The Cut", desc: "Editing, Score, Song, Sound, VFX" },
      { icon: "🌍", name: "The Globe", desc: "International, Animated & Documentary Feature" },
      { icon: "🎞️", name: "The Shorts", desc: "Animated, Documentary & Live Action Short" },
    ],
  },
  {
    id: "crown",
    icon: "👑",
    title: "The Crown — Most Valuable Guild",
    body: "The Crown contains the four biggest awards. Each correct pick earns 10 points. Nail all four and you earn a +20 sweep bonus on top — a possible 60 points from this guild alone.",
    position: "center",
    visual: "crown-table",
  },
  {
    id: "sweep",
    icon: "✨",
    title: "Sweep Bonuses",
    body: "Every guild has a sweep bonus. Get every pick in a guild correct and the bonus is added to your score. Miss even one and the bonus is forfeited. The bonus scales with guild difficulty.",
    position: "center",
    visual: "sweep-table",
  },
  {
    id: "crafts",
    icon: "👁️",
    title: "Partial Sweeps — The Eye & The Cut",
    body: "Two guilds have partial sweeps. The Eye (4 categories) and The Cut (5 categories) each reward you if you're nearly perfect: hit 3 or more correct in the guild to unlock a partial bonus, or sweep all of them for the full bonus.",
    position: "center",
    visual: "crafts-table",
  },
  {
    id: "final10",
    icon: "🎯",
    title: "The Final 10 Bonus",
    body: "After making your 24 picks, you get one extra wager. Choose any category from The Crown and double-down on your pick. Get it right: +10 bonus points. Get it wrong: nothing lost.",
    position: "center",
    visual: "final10",
  },
  {
    id: "leaderboard",
    icon: "📊",
    title: "Live Leaderboard & Tiebreakers",
    body: "Scores update live as winners are announced. Ties are broken by 5 rules in order: total score → Crown points → correct pick count → earliest ballot submission → alphabetical name.",
    position: "center",
    visual: "tiebreaker",
  },
  {
    id: "ready",
    icon: "🎬",
    title: "You're Ready!",
    body: "Create an account, submit your picks before the ballot closes, and track your score on the leaderboard as Oscars night unfolds. Good luck — may the best picks win!",
    position: "center",
    visual: "cta",
  },
];

function StepVisual({ id }: { id: string }) {
  if (id === "clusters") return null; // handled inline

  if (id === "crown-table") {
    return (
      <div className="mt-4 rounded-lg overflow-hidden border border-amber-500/30 text-xs">
        <div className="bg-amber-500/10 px-3 py-2 flex justify-between font-medium text-amber-300">
          <span>Category</span><span>Points</span>
        </div>
        {["Best Picture", "Best Director", "Best Actor", "Best Actress"].map((c) => (
          <div key={c} className="px-3 py-1.5 flex justify-between border-t border-amber-500/10 text-cinema-200">
            <span>{c}</span><span className="text-amber-400">10 pts</span>
          </div>
        ))}
        <div className="px-3 py-2 flex justify-between border-t border-amber-500/30 bg-amber-500/10 font-semibold text-amber-300">
          <span>Sweep all 4</span><span>+20 bonus = 60 max</span>
        </div>
      </div>
    );
  }

  if (id === "sweep-table") {
    return (
      <div className="mt-4 rounded-lg overflow-hidden border border-gold-600/30 text-xs">
        <div className="bg-gold-600/10 px-3 py-2 grid grid-cols-3 font-medium text-gold-300">
          <span>Guild</span><span className="text-center">Sweep Bonus</span><span className="text-right">Max</span>
        </div>
        {[
          ["👑 Crown", "+20 (all 4)", "60"],
          ["🎭 Performers", "+9 (all 3)", "30"],
          ["✍️ Authors", "+8 (both)", "24"],
          ["👁️ Eye", "+5 (3/4) / +10 (all 4)", "30"],
          ["✂️ Cut", "+4 (3/5) / +9 (all 5)", "24"],
          ["🌍 Globe", "+7 (all 3)", "22"],
          ["🎞️ Shorts", "+4 (all 3)", "10"],
        ].map(([name, bonus, max]) => (
          <div key={name} className="px-3 py-1.5 grid grid-cols-3 border-t border-gold-600/10 text-cinema-200">
            <span>{name}</span>
            <span className="text-center text-gold-400">{bonus}</span>
            <span className="text-right font-semibold">{max}</span>
          </div>
        ))}
      </div>
    );
  }

  if (id === "crafts-table") {
    return (
      <div className="mt-4 space-y-3 text-xs">
        <div className="rounded-lg border border-violet-500/30 overflow-hidden">
          <div className="bg-violet-500/10 px-3 py-2 font-medium text-violet-300">👁️ The Eye — 4 cats × 5 pts = 20 base</div>
          {["Cinematography", "Production Design", "Costume Design", "Makeup & Hairstyling"].map((c) => (
            <div key={c} className="px-3 py-1.5 flex justify-between border-t border-violet-500/10 text-cinema-200">
              <span>{c}</span><span className="text-violet-400">5 pts</span>
            </div>
          ))}
          <div className="px-3 py-1.5 flex justify-between border-t border-violet-500/20 bg-violet-500/5 text-cinema-300">
            <span>3 of 4 correct</span><span className="text-gold-400 font-semibold">+5 partial</span>
          </div>
          <div className="px-3 py-1.5 flex justify-between border-t border-violet-500/20 bg-violet-500/5 text-cinema-300">
            <span>All 4 correct</span><span className="text-gold-400 font-semibold">+10 sweep</span>
          </div>
        </div>
        <div className="rounded-lg border border-cyan-500/30 overflow-hidden">
          <div className="bg-cyan-500/10 px-3 py-2 font-medium text-cyan-300">✂️ The Cut — 5 cats × 3 pts = 15 base</div>
          {["Film Editing", "Original Score", "Original Song", "Sound", "Visual Effects"].map((c) => (
            <div key={c} className="px-3 py-1.5 flex justify-between border-t border-cyan-500/10 text-cinema-200">
              <span>{c}</span><span className="text-cyan-400">3 pts</span>
            </div>
          ))}
          <div className="px-3 py-1.5 flex justify-between border-t border-cyan-500/20 bg-cyan-500/5 text-cinema-300">
            <span>3 of 5 correct</span><span className="text-gold-400 font-semibold">+4 partial</span>
          </div>
          <div className="px-3 py-1.5 flex justify-between border-t border-cyan-500/20 bg-cyan-500/5 text-cinema-300">
            <span>All 5 correct</span><span className="text-gold-400 font-semibold">+9 sweep</span>
          </div>
        </div>
      </div>
    );
  }

  if (id === "final10") {
    return (
      <div className="mt-4 rounded-lg border border-gold-600/30 bg-gold-600/5 p-4 text-xs space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎯</span>
          <div>
            <div className="text-gold-300 font-semibold text-sm">Pick one Crown category</div>
            <div className="text-cinema-300">Best Picture, Director, Actor, or Actress</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-2">
            <div className="text-emerald-400 font-bold text-lg">+10</div>
            <div className="text-cinema-300">Correct pick</div>
          </div>
          <div className="rounded bg-cinema-800 border border-cinema-700 px-2 py-2">
            <div className="text-cinema-400 font-bold text-lg">+0</div>
            <div className="text-cinema-300">Wrong pick</div>
          </div>
        </div>
        <div className="text-center text-cinema-400">200 guild points + Final 10 bonus = <span className="text-gold-400 font-bold">210 max possible</span></div>
      </div>
    );
  }

  if (id === "tiebreaker") {
    return (
      <div className="mt-4 space-y-1.5 text-xs">
        {[
          ["1st", "Highest total score", "🏆"],
          ["2nd", "Highest Crown guild points", "👑"],
          ["3rd", "Most correct picks (count)", "✅"],
          ["4th", "Earliest ballot submission", "⏱️"],
          ["5th", "Alphabetical display name", "🔤"],
        ].map(([rank, rule, icon]) => (
          <div key={rank} className="flex items-center gap-3 rounded-lg bg-cinema-800/60 border border-cinema-700/30 px-3 py-2">
            <span className="text-cinema-500 font-mono w-6 shrink-0">{rank}</span>
            <span className="text-lg">{icon}</span>
            <span className="text-cinema-200">{rule}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export default function TutorialTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem("oscar-tutorial-seen");
      if (!seen) {
        setOpen(true);
        localStorage.setItem("oscar-tutorial-seen", "1");
      }
    }
  }, []);

  // Listen for navbar "?" button event
  useEffect(() => {
    function handleOpen() {
      setStep(0);
      setOpen(true);
    }
    window.addEventListener("oscar-open-tutorial", handleOpen);
    return () => window.removeEventListener("oscar-open-tutorial", handleOpen);
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => { setStep(0); setOpen(true); }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cinema-800 border border-cinema-700/50 text-cinema-200 text-sm hover:bg-cinema-700 hover:text-gold-400 transition-all"
      >
        <span>❓</span> How to Play
      </button>
    );
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-cinema-950/85 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Tour bubble */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-sm rounded-2xl bg-cinema-900 border border-cinema-700/60 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div className="h-1 shrink-0 bg-cinema-800">
            <div
              className="h-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          {/* Scrollable content */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* Step counter + close */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-cinema-500 font-mono">{step + 1} / {STEPS.length}</span>
              <button
                onClick={() => setOpen(false)}
                className="text-cinema-500 hover:text-cinema-200 transition-colors text-lg leading-none"
                aria-label="Close tutorial"
              >×</button>
            </div>

            {/* Icon + title */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{current.icon}</span>
              <h3 className="text-lg font-bold text-cinema-100 leading-tight">{current.title}</h3>
            </div>

            {/* Body */}
            <p className="text-cinema-300 text-sm leading-relaxed">{current.body}</p>

            {/* Cluster grid */}
            {current.id === "clusters" && current.visual && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(current.visual as { icon: string; name: string; desc: string }[]).map((c) => (
                  <div key={c.name} className="rounded-lg bg-cinema-800/60 border border-cinema-700/30 px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span>{c.icon}</span>
                      <span className="text-xs font-semibold text-cinema-100">{c.name}</span>
                    </div>
                    <p className="text-[10px] text-cinema-400 leading-snug">{c.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Other visuals */}
            {current.id !== "clusters" && current.visual && (
              <StepVisual id={current.visual as string} />
            )}

            {/* CTA step */}
            {current.id === "ready" && (
              <div className="mt-4">
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSdAA318NaCsFTgBhYWi4cZFB8QgGGuL3uILMwVywvcrSGDzdg/viewform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full text-center justify-center py-2.5 rounded-lg bg-gold-600 text-white font-semibold text-sm hover:bg-gold-500 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  📋 Open the Ballot Form
                </a>
              </div>
            )}
          </div>

          {/* Navigation — pinned to bottom, always visible */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-t border-cinema-700/40 bg-cinema-900">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-cinema-800 border border-cinema-700 text-cinema-200 hover:bg-cinema-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Back
            </button>

            {/* Dots */}
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    backgroundColor: i === step
                      ? "rgb(234 179 8 / 0.9)"
                      : i < step
                      ? "rgb(234 179 8 / 0.35)"
                      : "rgb(255 255 255 / 0.2)",
                    transform: i === step ? "scale(1.3)" : "scale(1)",
                  }}
                />
              ))}
            </div>

            {isLast ? (
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gold-600 text-white hover:bg-gold-500 transition-colors"
              >
                Done ✓
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gold-600 text-white hover:bg-gold-500 transition-colors"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
