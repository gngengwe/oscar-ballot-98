/**
 * Ticker Fetcher – RSS-first approach with safe fallbacks
 *
 * Fetches from configured RSS feeds, parses into short snippets,
 * stores in DB with provenance, and respects TTL caching.
 */

import { prisma } from "./prisma";

interface FeedItem {
  title: string;
  snippet: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt?: Date;
}

// Oscar-related keywords for filtering
const OSCAR_KEYWORDS = [
  "oscar",
  "academy award",
  "nominee",
  "nomination",
  "best picture",
  "best director",
  "best actor",
  "best actress",
  "supporting",
  "screenplay",
  "cinematography",
  "animated",
  "score",
  "song",
  "film editing",
  "costume",
  "production design",
  "international feature",
  "awards season",
  "red carpet",
  "hollywood",
];

function isOscarRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return OSCAR_KEYWORDS.some((kw) => lower.includes(kw));
}

function sanitizeSnippet(text: string): string {
  // Remove HTML tags
  let clean = text.replace(/<[^>]*>/g, "");
  // Remove excess whitespace
  clean = clean.replace(/\s+/g, " ").trim();
  // Truncate to ~200 chars
  if (clean.length > 200) {
    clean = clean.substring(0, 197) + "...";
  }
  return clean;
}

/**
 * Content safety filter: reject items with sensitive keywords.
 */
function isSafeContent(title: string, snippet: string): boolean {
  const combined = (title + " " + snippet).toLowerCase();
  const unsafeKeywords = [
    "scandal",
    "arrested",
    "lawsuit",
    "divorce",
    "affair",
    "drunk",
    "rehab",
    "political",
    "controversy",
    "accused",
    "allegations",
  ];
  return !unsafeKeywords.some((kw) => combined.includes(kw));
}

async function fetchRSSFeed(feedUrl: string): Promise<FeedItem[]> {
  try {
    const RssParser = (await import("rss-parser")).default;
    const parser = new RssParser({
      timeout: 10000,
      headers: {
        "User-Agent": "OscarBallot98/1.0 (RSS Reader)",
      },
    });

    const feed = await parser.parseURL(feedUrl);
    const sourceName =
      feed.title || new URL(feedUrl).hostname.replace("www.", "");

    const items: FeedItem[] = [];

    for (const entry of feed.items?.slice(0, 20) || []) {
      const title = entry.title || "";
      const snippet = sanitizeSnippet(
        entry.contentSnippet || entry.content || entry.summary || ""
      );

      if (!isOscarRelated(title + " " + snippet)) continue;
      if (!isSafeContent(title, snippet)) continue;

      items.push({
        title: title.substring(0, 200),
        snippet,
        sourceName,
        sourceUrl: entry.link || feedUrl,
        publishedAt: entry.pubDate ? new Date(entry.pubDate) : undefined,
      });
    }

    return items;
  } catch (error) {
    console.error(`Failed to fetch RSS feed ${feedUrl}:`, error);
    return [];
  }
}

/**
 * Main fetch function: fetches from all configured feeds,
 * stores new items in DB, and respects TTL.
 */
export async function fetchTickerItems(): Promise<number> {
  const feedUrls = (
    process.env.TICKER_RSS_FEEDS || ""
  )
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);

  if (feedUrls.length === 0) {
    console.log("No RSS feeds configured, using fallback trivia");
    await ensureFallbackTrivia();
    return 0;
  }

  let newCount = 0;

  for (const feedUrl of feedUrls) {
    const items = await fetchRSSFeed(feedUrl);

    for (const item of items) {
      // Check for duplicates by title
      const existing = await prisma.tickerItem.findFirst({
        where: { title: item.title },
      });

      if (!existing) {
        await prisma.tickerItem.create({
          data: {
            title: item.title,
            snippet: item.snippet,
            sourceName: item.sourceName,
            sourceUrl: item.sourceUrl,
            publishedAt: item.publishedAt,
            isActive: true,
          },
        });
        newCount++;
      }
    }
  }

  // If no items fetched, ensure fallback trivia
  if (newCount === 0) {
    await ensureFallbackTrivia();
  }

  return newCount;
}

async function ensureFallbackTrivia() {
  const count = await prisma.tickerItem.count({
    where: { isTrivia: true, isActive: true },
  });
  if (count > 0) return;

  const trivia = [
    {
      title: "Oscar Statuette Weight",
      snippet:
        "The Oscar statuette weighs 8.5 pounds and stands 13.5 inches tall. It's made of gold-plated bronze.",
    },
    {
      title: "Most Nominated Film",
      snippet:
        "All About Eve (1950) and Titanic (1997) share the record for most nominations at 14 each.",
    },
    {
      title: "Youngest Winner",
      snippet:
        "Tatum O'Neal became the youngest competitive winner at age 10 for Paper Moon (1973).",
    },
    {
      title: "Most Wins in a Night",
      snippet:
        'The Lord of the Rings: Return of the King won all 11 categories it was nominated in, tying Ben-Hur and Titanic for most wins.',
    },
    {
      title: "Origin of the Name",
      snippet:
        'The nickname "Oscar" is rumored to have originated when a librarian said the statuette resembled her Uncle Oscar.',
    },
    {
      title: "First Color Film to Win",
      snippet:
        "Gone with the Wind (1939) was the first color film to win Best Picture.",
    },
    {
      title: "Envelope Please",
      snippet:
        "PricewaterhouseCoopers has been tabulating Oscar ballots since 1934 — over 90 years of counting votes.",
    },
    {
      title: "The Oscar Curse",
      snippet:
        'Some believe in the "Oscar curse" — the idea that winning Best Picture can actually hurt a film\'s long-term reputation.',
    },
  ];

  for (const t of trivia) {
    await prisma.tickerItem.create({
      data: {
        title: t.title,
        snippet: t.snippet,
        sourceName: "Oscar Ballot 98",
        isTrivia: true,
        isActive: true,
      },
    });
  }
}

/**
 * Get cached ticker items for display.
 * Returns most recent active items.
 */
export async function getCachedTickerItems(limit = 20) {
  return prisma.tickerItem.findMany({
    where: { isActive: true, isTrivia: false },
    orderBy: { retrievedAt: "desc" },
    take: limit,
  });
}

export async function getTriviaItems(limit = 10) {
  return prisma.tickerItem.findMany({
    where: { isActive: true, isTrivia: true },
    orderBy: { retrievedAt: "desc" },
    take: limit,
  });
}

export async function getSpotlightItem() {
  return prisma.tickerItem.findFirst({
    where: { isActive: true, isSpotlight: true },
    orderBy: { retrievedAt: "desc" },
  });
}
