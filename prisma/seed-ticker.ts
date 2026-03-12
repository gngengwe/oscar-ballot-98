/**
 * Seed trivia + spotlight into TickerItem table.
 * Run with: npx tsx prisma/seed-ticker.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🎬 Seeding ticker content...\n");

  // ─── Trivia ───────────────────────────────────────────────────
  const existingTrivia = await prisma.tickerItem.count({ where: { isTrivia: true } });
  if (existingTrivia > 0) {
    console.log(`↷  Trivia: already has ${existingTrivia} items — skipping`);
  } else {
    const trivia = [
      {
        title: "Oscar Statuette",
        snippet: "The Oscar statuette weighs 8.5 pounds and stands 13.5 inches tall. It is made of gold-plated bronze.",
      },
      {
        title: "Most Nominated Film Ever",
        snippet: "All About Eve (1950) and Titanic (1997) share the record with 14 nominations each — until Sinners challenged that record this year.",
      },
      {
        title: "Youngest Competitive Winner",
        snippet: "Tatum O'Neal won Best Supporting Actress at age 10 for Paper Moon (1973), making her the youngest competitive Oscar winner ever.",
      },
      {
        title: "11 for 11",
        snippet: "The Lord of the Rings: The Return of the King won all 11 categories it was nominated in — tying Ben-Hur and Titanic for most wins in a single night.",
      },
      {
        title: 'Where did "Oscar" come from?',
        snippet: "The nickname is rumored to have originated when Academy librarian Margaret Herrick said the statuette resembled her Uncle Oscar.",
      },
      {
        title: "PwC and the Envelopes",
        snippet: "PricewaterhouseCoopers has been tabulating Oscar ballots since 1934 — over 90 years of counting votes in secret.",
      },
      {
        title: "Best Picture Record",
        snippet: "Wings (1927) was the first Best Picture winner. It beat 3 other films — today Best Picture has 10 nominees.",
      },
      {
        title: "Sinners Makes History",
        snippet: "Ryan Coogler's Sinners leads the 98th Oscars with a record 16 nominations — the most any film has ever received in a single year.",
      },
      {
        title: "First Non-English Best Picture",
        snippet: "Parasite (2019) became the first non-English language film to win Best Picture, taking home 4 Oscars that night.",
      },
      {
        title: "The 98th Ceremony",
        snippet: "The 98th Academy Awards ceremony takes place on March 15, 2026, at the Dolby Theatre in Hollywood.",
      },
    ];

    for (const t of trivia) {
      await prisma.tickerItem.create({
        data: { ...t, isTrivia: true, isActive: true, sourceName: "Oscar Ballot 98" },
      });
    }
    console.log(`✓  Added ${trivia.length} trivia items`);
  }

  // ─── Spotlight ───────────────────────────────────────────────
  const existingSpotlight = await prisma.tickerItem.count({ where: { isSpotlight: true } });
  if (existingSpotlight > 0) {
    console.log(`↷  Spotlight: already exists — skipping`);
  } else {
    await prisma.tickerItem.create({
      data: {
        title: "Sinners leads with 16 nominations",
        snippet:
          "Ryan Coogler's Sinners is the frontrunner this year, scoring nominations across every major category — from Best Picture and Director to Costume Design and Visual Effects.",
        isSpotlight: true,
        isActive: true,
        sourceName: "Oscar Ballot 98",
      },
    });
    console.log(`✓  Added spotlight item`);
  }

  console.log("\n✅ Ticker seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
