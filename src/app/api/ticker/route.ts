import { NextResponse } from "next/server";
import {
  getCachedTickerItems,
  getTriviaItems,
  getSpotlightItem,
} from "@/lib/ticker-fetcher";

export async function GET() {
  try {
    const [news, trivia, spotlight] = await Promise.all([
      getCachedTickerItems(10),
      getTriviaItems(8),
      getSpotlightItem(),
    ]);

    return NextResponse.json(
      { news, trivia, spotlight },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Ticker API error:", error);
    return NextResponse.json(
      { news: [], trivia: [], spotlight: null },
      { status: 200 }
    );
  }
}
