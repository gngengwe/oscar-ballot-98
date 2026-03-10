export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Oscar Ballot 2026";
export const AWARDS_YEAR = process.env.NEXT_PUBLIC_AWARDS_YEAR || "98th";
export const AWARDS_YEAR_NUM = process.env.NEXT_PUBLIC_AWARDS_YEAR_NUM || "2026";

export const CLUSTER_ICONS: Record<string, string> = {
  crown: "👑",
  performers: "🎭",
  authors: "✍️",
  global: "🌍",
  soundtrack: "🎵",
  crafts: "🎬",
};

export const CLUSTER_COLORS: Record<number, string> = {
  1: "from-amber-500/20 to-yellow-600/10 border-amber-500/40",
  2: "from-rose-500/20 to-pink-600/10 border-rose-500/40",
  3: "from-blue-500/20 to-indigo-600/10 border-blue-500/40",
  4: "from-emerald-500/20 to-teal-600/10 border-emerald-500/40",
  5: "from-purple-500/20 to-violet-600/10 border-purple-500/40",
  6: "from-cyan-500/20 to-sky-600/10 border-cyan-500/40",
};

export const CLUSTER_ACCENT_COLORS: Record<number, string> = {
  1: "text-amber-400",
  2: "text-rose-400",
  3: "text-blue-400",
  4: "text-emerald-400",
  5: "text-purple-400",
  6: "text-cyan-400",
};

export const MAX_SCORE = 200;
export const FINAL_TEN_BONUS = 10;
