/**
 * Seed the 98th Academy Awards nominees into the database.
 * Safe to run multiple times — skips categories that already have nominees.
 *
 * Run with:
 *   npx tsx prisma/seed-nominees.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NOMINEES: Record<string, { displayName: string; filmTitle?: string }[]> = {
  "Best Picture": [
    { displayName: "Bugonia",                     filmTitle: "Bugonia" },
    { displayName: "F1",                          filmTitle: "F1" },
    { displayName: "Frankenstein",                filmTitle: "Frankenstein" },
    { displayName: "Hamnet",                      filmTitle: "Hamnet" },
    { displayName: "Marty Supreme",               filmTitle: "Marty Supreme" },
    { displayName: "One Battle After Another",    filmTitle: "One Battle After Another" },
    { displayName: "The Secret Agent",            filmTitle: "The Secret Agent" },
    { displayName: "Sentimental Value",           filmTitle: "Sentimental Value" },
    { displayName: "Sinners",                     filmTitle: "Sinners" },
    { displayName: "Train Dreams",                filmTitle: "Train Dreams" },
  ],
  "Best Director": [
    { displayName: "Chloé Zhao",           filmTitle: "Hamnet" },
    { displayName: "Josh Safdie",          filmTitle: "Marty Supreme" },
    { displayName: "Paul Thomas Anderson", filmTitle: "One Battle After Another" },
    { displayName: "Joachim Trier",        filmTitle: "Sentimental Value" },
    { displayName: "Ryan Coogler",         filmTitle: "Sinners" },
  ],
  "Best Actor": [
    { displayName: "Timothée Chalamet", filmTitle: "Marty Supreme" },
    { displayName: "Leonardo DiCaprio", filmTitle: "One Battle After Another" },
    { displayName: "Ethan Hawke",       filmTitle: "Blue Moon" },
    { displayName: "Michael B. Jordan", filmTitle: "Sinners" },
    { displayName: "Wagner Moura",      filmTitle: "The Secret Agent" },
  ],
  "Best Actress": [
    { displayName: "Jessie Buckley",  filmTitle: "Hamnet" },
    { displayName: "Rose Byrne",      filmTitle: "If I Had Legs I'd Kick You" },
    { displayName: "Kate Hudson",     filmTitle: "Song Sung Blue" },
    { displayName: "Renate Reinsve",  filmTitle: "Sentimental Value" },
    { displayName: "Emma Stone",      filmTitle: "Bugonia" },
  ],
  "Best Supporting Actor": [
    { displayName: "Benicio Del Toro",   filmTitle: "One Battle After Another" },
    { displayName: "Jacob Elordi",       filmTitle: "Frankenstein" },
    { displayName: "Delroy Lindo",       filmTitle: "Sinners" },
    { displayName: "Sean Penn",          filmTitle: "One Battle After Another" },
    { displayName: "Stellan Skarsgård", filmTitle: "Sentimental Value" },
  ],
  "Best Supporting Actress": [
    { displayName: "Elle Fanning",             filmTitle: "Sentimental Value" },
    { displayName: "Inga Ibsdotter Lilleaas",  filmTitle: "Sentimental Value" },
    { displayName: "Amy Madigan",              filmTitle: "Weapons" },
    { displayName: "Wunmi Mosaku",             filmTitle: "Sinners" },
    { displayName: "Teyana Taylor",            filmTitle: "One Battle After Another" },
  ],
  "Best Animated Feature Film": [
    { displayName: "Arco",                                filmTitle: "Arco" },
    { displayName: "Elio",                               filmTitle: "Elio" },
    { displayName: "KPop Demon Hunters",                 filmTitle: "KPop Demon Hunters" },
    { displayName: "Little Amélie or the Character of Rain", filmTitle: "Little Amélie or the Character of Rain" },
    { displayName: "Zootopia 2",                         filmTitle: "Zootopia 2" },
  ],
  "Best International Feature Film": [
    { displayName: "The Secret Agent",         filmTitle: "The Secret Agent (Brazil)" },
    { displayName: "It Was Just an Accident",  filmTitle: "It Was Just an Accident (France)" },
    { displayName: "Sentimental Value",        filmTitle: "Sentimental Value (Norway)" },
    { displayName: "Sirāt",                   filmTitle: "Sirāt (Spain)" },
    { displayName: "The Voice of Hind Rajab", filmTitle: "The Voice of Hind Rajab (Tunisia)" },
  ],
  "Best Original Screenplay": [
    { displayName: "Robert Kaplow",                filmTitle: "Blue Moon" },
    { displayName: "Jafar Panahi",                 filmTitle: "It Was Just an Accident" },
    { displayName: "Ronald Bronstein & Josh Safdie", filmTitle: "Marty Supreme" },
    { displayName: "Eskil Vogt & Joachim Trier",   filmTitle: "Sentimental Value" },
    { displayName: "Ryan Coogler",                 filmTitle: "Sinners" },
  ],
  "Best Adapted Screenplay": [
    { displayName: "Will Tracy",                    filmTitle: "Bugonia" },
    { displayName: "Guillermo del Toro",            filmTitle: "Frankenstein" },
    { displayName: "Chloé Zhao & Maggie O'Farrell", filmTitle: "Hamnet" },
    { displayName: "Paul Thomas Anderson",          filmTitle: "One Battle After Another" },
    { displayName: "Clint Bentley & Greg Kwedar",   filmTitle: "Train Dreams" },
  ],
  "Best Original Score": [
    { displayName: "Jerskin Fendrix",   filmTitle: "Bugonia" },
    { displayName: "Alexandre Desplat", filmTitle: "Frankenstein" },
    { displayName: "Max Richter",       filmTitle: "Hamnet" },
    { displayName: "Jonny Greenwood",   filmTitle: "One Battle After Another" },
    { displayName: "Ludwig Göransson", filmTitle: "Sinners" },
  ],
  "Best Original Song": [
    { displayName: '"Dear Me"',          filmTitle: "Diane Warren: Relentless" },
    { displayName: '"Golden"',           filmTitle: "KPop Demon Hunters" },
    { displayName: '"I Lied to You"',    filmTitle: "Sinners" },
    { displayName: '"Sweet Dreams of Joy"', filmTitle: "Viva Verdi!" },
    { displayName: '"Train Dreams"',     filmTitle: "Train Dreams" },
  ],
  "Best Cinematography": [
    { displayName: "Dan Laustsen",          filmTitle: "Frankenstein" },
    { displayName: "Darius Khondji",        filmTitle: "Marty Supreme" },
    { displayName: "Michael Bauman",        filmTitle: "One Battle After Another" },
    { displayName: "Autumn Durald Arkapaw", filmTitle: "Sinners" },
    { displayName: "Adolpho Veloso",        filmTitle: "Train Dreams" },
  ],
  "Best Film Editing": [
    { displayName: "Stephen Mirrione",             filmTitle: "F1" },
    { displayName: "Ronald Bronstein & Josh Safdie", filmTitle: "Marty Supreme" },
    { displayName: "Andy Jurgensen",               filmTitle: "One Battle After Another" },
    { displayName: "Olivier Bugge Coutté",         filmTitle: "Sentimental Value" },
    { displayName: "Michael P. Shawver",           filmTitle: "Sinners" },
  ],
  "Best Production Design": [
    { displayName: "Tamara Deverell & Shane Vieau",       filmTitle: "Frankenstein" },
    { displayName: "Fiona Crombie & Alice Felton",        filmTitle: "Hamnet" },
    { displayName: "Jack Fisk & Adam Willis",             filmTitle: "Marty Supreme" },
    { displayName: "Florencia Martin & Anthony Carlino",  filmTitle: "One Battle After Another" },
    { displayName: "Hannah Beachler & Monique Champagne", filmTitle: "Sinners" },
  ],
  "Best Casting": [
    { displayName: "Nina Gold",             filmTitle: "Hamnet" },
    { displayName: "Jennifer Venditti",     filmTitle: "Marty Supreme" },
    { displayName: "Cassandra Kulukundis", filmTitle: "One Battle After Another" },
    { displayName: "Gabriel Domingues",    filmTitle: "The Secret Agent" },
    { displayName: "Francine Maisler",     filmTitle: "Sinners" },
  ],
};

async function main() {
  console.log("🎬 Seeding 98th Academy Awards nominees...\n");

  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

  let totalAdded = 0;
  let totalSkipped = 0;

  for (const [categoryName, nominees] of Object.entries(NOMINEES)) {
    const categoryId = categoryMap.get(categoryName);
    if (!categoryId) {
      console.warn(`⚠️  Category not found in DB: "${categoryName}" — skipping`);
      continue;
    }

    const existing = await prisma.nominee.count({ where: { categoryId } });
    if (existing > 0) {
      console.log(`↷  ${categoryName}: already has ${existing} nominees — skipping`);
      totalSkipped += existing;
      continue;
    }

    for (let i = 0; i < nominees.length; i++) {
      await prisma.nominee.create({
        data: {
          categoryId,
          displayName: nominees[i].displayName,
          filmTitle: nominees[i].filmTitle ?? null,
          sortOrder: i + 1,
        },
      });
    }
    console.log(`✓  ${categoryName}: added ${nominees.length} nominees`);
    totalAdded += nominees.length;
  }

  console.log(`\n✅ Done! Added ${totalAdded} nominees, skipped ${totalSkipped} (already existed).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
