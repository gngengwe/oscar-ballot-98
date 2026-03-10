/**
 * Standalone ticker fetch script.
 * Run with: npm run ticker:fetch
 * Schedule via cron or Vercel Cron for periodic refreshes.
 */
import { PrismaClient } from "@prisma/client";
import { fetchTickerItems } from "../src/lib/ticker-fetcher";

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching Oscar ticker items from RSS feeds...");
  const count = await fetchTickerItems();
  console.log(`Done. ${count} new items stored.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
