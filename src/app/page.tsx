import Link from "next/link";
import TickerSidebar from "@/components/TickerSidebar";
import NomineeCarousel from "@/components/NomineeCarousel";
import TutorialTour from "@/components/TutorialTour";
import CountdownTimer from "@/components/CountdownTimer";
import { prisma } from "@/lib/prisma";

const clusters = [
  {
    name: "The Crown",
    icon: "👑",
    categories: "Best Picture, Director, Actor, Actress",
    base: "10 pts each",
    bonus: "+20 sweep bonus",
    max: 60,
    color: "from-amber-500/20 to-amber-900/10 border-amber-500/40",
    accent: "text-amber-400",
  },
  {
    name: "The Performers",
    icon: "🎭",
    categories: "Supporting Actor, Supporting Actress, Casting",
    base: "7 pts each",
    bonus: "+9 sweep bonus",
    max: 30,
    color: "from-rose-500/20 to-rose-900/10 border-rose-500/40",
    accent: "text-rose-400",
  },
  {
    name: "The Authors",
    icon: "✍️",
    categories: "Original Screenplay, Adapted Screenplay",
    base: "8 pts each",
    bonus: "+8 sweep bonus",
    max: 24,
    color: "from-blue-500/20 to-blue-900/10 border-blue-500/40",
    accent: "text-blue-400",
  },
  {
    name: "The Eye",
    icon: "👁️",
    categories: "Cinematography, Production Design, Costume Design, Makeup & Hairstyling",
    base: "5 pts each",
    bonus: "+5 (3/4) or +10 sweep",
    max: 30,
    color: "from-violet-500/20 to-violet-900/10 border-violet-500/40",
    accent: "text-violet-400",
  },
  {
    name: "The Cut",
    icon: "✂️",
    categories: "Film Editing, Original Score, Original Song, Sound, Visual Effects",
    base: "3 pts each",
    bonus: "+4 (3/5) or +9 sweep",
    max: 24,
    color: "from-cyan-500/20 to-cyan-900/10 border-cyan-500/40",
    accent: "text-cyan-400",
  },
  {
    name: "The Globe",
    icon: "🌍",
    categories: "International Feature, Animated Feature, Documentary Feature",
    base: "5 pts each",
    bonus: "+7 sweep bonus",
    max: 22,
    color: "from-emerald-500/20 to-emerald-900/10 border-emerald-500/40",
    accent: "text-emerald-400",
  },
  {
    name: "The Shorts",
    icon: "🎞️",
    categories: "Animated Short, Documentary Short, Live Action Short",
    base: "2 pts each",
    bonus: "+4 sweep bonus",
    max: 10,
    color: "from-indigo-500/20 to-indigo-900/10 border-indigo-500/40",
    accent: "text-indigo-400",
  },
];

export default async function LandingPage() {
  const settings = await prisma.globalSettings.findUnique({ where: { id: "singleton" } });
  const now = new Date();
  const isOpen = settings
    ? now >= settings.ballotOpensAt && now <= settings.ballotClosesAt
    : false;
  const closesAt = settings?.ballotClosesAt?.toISOString() ?? null;

  return (
    <div className="flex">
      <div className="flex-1 min-w-0">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gold-600/10 via-cinema-950 to-cinema-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold-500/10 via-transparent to-transparent" />

          <div className="relative max-w-5xl mx-auto px-6 py-20 text-center">
            <div className="animate-fade-in-up">
              <span className="text-6xl mb-6 block">🏆</span>
              <h1 className="text-5xl md:text-7xl font-bold mb-4">
                <span className="bg-gradient-to-r from-gold-300 via-gold-400 to-gold-600 bg-clip-text text-transparent">
                  Oscar Ballot 2026
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-cinema-200 mb-2">
                98th Academy Awards Pick&apos;em
              </p>
              <p className="text-cinema-400 max-w-2xl mx-auto mb-8">
                Pick your winners across 24 categories grouped into 7 prestige
                guilds. Earn sweep bonuses, wager on a Final 10 pick, and
                compete for the top of the leaderboard.
              </p>

              <div className="flex items-center justify-center gap-4 mb-12">
                <Link
                  href="/auth/register"
                  className="px-8 py-3 rounded-lg bg-gold-600 text-white font-semibold hover:bg-gold-500 transition-all glow-gold"
                >
                  Join the Game
                </Link>
                <Link
                  href="/auth/signin"
                  className="px-8 py-3 rounded-lg bg-cinema-800 border border-cinema-600 text-cinema-200 font-semibold hover:bg-cinema-700 transition-all"
                >
                  Sign In
                </Link>
                <TutorialTour />
              </div>

              {/* Max Score Badge */}
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-cinema-800/80 border border-gold-600/30">
                <span className="text-gold-400 font-bold text-2xl">200</span>
                <span className="text-cinema-300 text-sm">
                  Maximum Points Available
                </span>
              </div>

              {/* Ballot countdown */}
              {isOpen && closesAt && (
                <div className="mt-6 flex justify-center">
                  <CountdownTimer targetDate={closesAt} label="Ballot closes in" />
                </div>
              )}
              {settings && !isOpen && now < settings.ballotOpensAt && (
                <div className="mt-6 flex justify-center">
                  <CountdownTimer targetDate={settings.ballotOpensAt.toISOString()} label="Ballot opens in" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Nominee Image Carousel */}
        <section className="max-w-5xl mx-auto px-6 pb-10">
          <NomineeCarousel />
        </section>

        {/* How It Works */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-center mb-4 text-cinema-100">
            How It Works
          </h2>
          <p className="text-cinema-400 text-center mb-12 max-w-2xl mx-auto">
            Categories are grouped into prestige guilds. Nail every pick in a
            guild and earn a sweep bonus on top of the base points.
          </p>

          {/* Cluster Grid */}
          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {clusters.map((cluster) => (
              <div
                key={cluster.name}
                className={`relative rounded-xl p-5 bg-gradient-to-br ${cluster.color} border backdrop-blur-sm`}
              >
                {"isNew" in cluster && cluster.isNew && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gold-600/30 text-gold-400 border border-gold-500/30">
                    New category
                  </span>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{cluster.icon}</span>
                    <h3 className={`font-bold text-lg ${cluster.accent}`}>
                      {cluster.name}
                    </h3>
                  </div>
                  <span className="text-gold-400 font-bold text-sm bg-cinema-900/60 px-2 py-1 rounded">
                    max {cluster.max}
                  </span>
                </div>
                <p className="text-cinema-200 text-sm mb-2">
                  {cluster.categories}
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-cinema-300">{cluster.base}</span>
                  <span className="text-gold-400 font-medium">
                    {cluster.bonus}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Final 10 Explanation */}
          <div className="bg-gradient-to-r from-gold-600/10 to-cinema-800 border border-gold-600/30 rounded-xl p-6 mb-12">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🎯</span>
              <div>
                <h3 className="text-gold-400 font-bold text-lg">
                  Final 10 Bonus
                </h3>
                <p className="text-cinema-300 text-sm">
                  High-risk, high-reward
                </p>
              </div>
            </div>
            <p className="text-cinema-200 text-sm mb-3">
              Choose <strong>one</strong> category from the Crown guild (Best
              Picture, Director, Actor, or Actress) and pick your winner. If
              you&apos;re right: <strong className="text-gold-400">+10 points</strong>.
              If wrong: +0. This bonus is separate from your guild picks.
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-cinema-400 bg-cinema-900/40 px-3 py-1 rounded-full">
              200 guild points + Final 10 bonus
            </div>
          </div>

          {/* Scoring Summary Table */}
          <div className="bg-cinema-800/50 border border-cinema-700/30 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cinema-700/50">
                  <th className="text-left p-3 text-cinema-300 font-medium">Guild</th>
                  <th className="text-center p-3 text-cinema-300 font-medium">Base Pts</th>
                  <th className="text-center p-3 text-cinema-300 font-medium">Sweep Bonus</th>
                  <th className="text-center p-3 text-cinema-300 font-medium">Max</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["👑 The Crown",      "40", "+20 (all 4)",            "60"],
                  ["🎭 The Performers", "21", "+9 (all 3)",             "30"],
                  ["✍️ The Authors",    "16", "+8 (both)",              "24"],
                  ["👁️ The Eye",        "20", "+5 (3/4) / +10 (all 4)", "30"],
                  ["✂️ The Cut",        "15", "+4 (3/5) / +9 (all 5)",  "24"],
                  ["🌍 The Globe",      "15", "+7 (all 3)",             "22"],
                  ["🎞️ The Shorts",     "6",  "+4 (all 3)",             "10"],
                  ["🎯 Final 10",       "—",  "—",                      "+10"],
                ].map(([cluster, base, sweep, max], i) => (
                  <tr
                    key={i}
                    className="border-b border-cinema-700/30 last:border-0 hover:bg-cinema-700/20 transition-colors"
                  >
                    <td className="p-3 text-cinema-100">{cluster}</td>
                    <td className="p-3 text-center text-cinema-200">{base}</td>
                    <td className="p-3 text-center text-gold-400">{sweep}</td>
                    <td className="p-3 text-center font-bold text-cinema-100">{max}</td>
                  </tr>
                ))}
                <tr className="bg-gold-600/10">
                  <td className="p-3 font-bold text-gold-400">Total</td>
                  <td className="p-3 text-center">133</td>
                  <td className="p-3 text-center text-gold-400">+67</td>
                  <td className="p-3 text-center font-bold text-gold-400 text-lg">
                    200
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tiebreakers */}
          <div className="mt-12 bg-cinema-800/30 border border-cinema-700/30 rounded-xl p-6">
            <h3 className="text-lg font-bold text-cinema-100 mb-3">
              Tiebreaker Rules
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-cinema-300">
              <li>Highest total score</li>
              <li>Highest Crown guild points</li>
              <li>Most total correct picks</li>
              <li>Earlier ballot commit timestamp</li>
              <li>Alphabetical by display name</li>
            </ol>
          </div>
        </section>
      </div>

      {/* Sidebar */}
      <div className="pt-4 pr-4">
        <TickerSidebar />
      </div>
    </div>
  );
}
