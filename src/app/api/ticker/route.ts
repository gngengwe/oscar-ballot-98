import { NextResponse } from "next/server";
import {
  getCachedTickerItems,
  getTriviaItems,
  getSpotlightItem,
} from "@/lib/ticker-fetcher";
import { prisma } from "@/lib/prisma";

async function getNominationCounts() {
  const rows = await prisma.nominee.groupBy({
    by: ["filmTitle"],
    _count: { filmTitle: true },
    where: { filmTitle: { not: null } },
    orderBy: { _count: { filmTitle: "desc" } },
    take: 8,
  });
  return rows
    .filter((r) => r.filmTitle)
    .map((r) => ({ film: r.filmTitle as string, count: r._count.filmTitle }));
}

export async function GET() {
  try {
    const [news, trivia, spotlight, numbers] = await Promise.all([
      getCachedTickerItems(10),
      getTriviaItems(8),
      getSpotlightItem(),
      getNominationCounts(),
    ]);

    return NextResponse.json(
      { news, trivia, spotlight, numbers },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Ticker API error:", error);
    return NextResponse.json(
      { news: [], trivia: [], spotlight: null, numbers: [] },
      { status: 200 }
    );
  }
}
