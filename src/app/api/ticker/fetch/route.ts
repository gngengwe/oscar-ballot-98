import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchTickerItems } from "@/lib/ticker-fetcher";

export async function POST() {
  const session = await auth();
  if (
    !session?.user?.id ||
    !["admin", "editor"].includes((session.user as { role?: string }).role || "")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const count = await fetchTickerItems();
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Ticker fetch error:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
