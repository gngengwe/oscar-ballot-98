import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🎬 Seeding Oscar Ballot 98 database...\n");

  // ─── Clean slate ───
  await prisma.auditLog.deleteMany();
  await prisma.computedScore.deleteMany();
  await prisma.winnerPublished.deleteMany();
  await prisma.winnerDraft.deleteMany();
  await prisma.finalTenPick.deleteMany();
  await prisma.pick.deleteMany();
  await prisma.insightMetric.deleteMany();
  await prisma.tickerItem.deleteMany();
  await prisma.nominee.deleteMany();
  await prisma.category.deleteMany();
  await prisma.cluster.deleteMany();
  await prisma.globalSettings.deleteMany();
  await prisma.user.deleteMany();

  // ─── Admin User ───
  const adminPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "changeme123",
    12
  );
  const admin = await prisma.user.create({
    data: {
      email: process.env.ADMIN_EMAIL || "gngengwe@gmail.com",
      passwordHash: adminPassword,
      displayName: "Admin",
      role: "admin",
    },
  });
  console.log(`✓ Admin user: ${admin.email}`);

  // Demo users
  const demoPassword = await bcrypt.hash("demo1234", 12);
  const demoUsers = [];
  for (const name of ["Alice", "Bob", "Charlie", "Diana", "Eve"]) {
    const user = await prisma.user.create({
      data: {
        email: `${name.toLowerCase()}@demo.com`,
        passwordHash: demoPassword,
        displayName: name,
        role: "user",
      },
    });
    demoUsers.push(user);
  }
  console.log(`✓ ${demoUsers.length} demo users (password: demo1234)`);

  // ─── Global Settings ───
  const now = new Date();
  const closesAt = new Date(now);
  closesAt.setDate(closesAt.getDate() + 30);

  await prisma.globalSettings.create({
    data: {
      ballotOpensAt: now,
      ballotClosesAt: closesAt,
      timezone: "America/Los_Angeles",
    },
  });
  console.log("✓ Ballot window: open now → 30 days");

  // ─── Clusters ───
  const clusterData = [
    {
      name: "The Crown",
      icon: "crown",
      description: "The most prestigious categories of the night",
      maxPoints: 60,
      sortOrder: 1,
      sweepType: "full",
      sweepBonus: 20,
    },
    {
      name: "The Performers",
      icon: "performers",
      description: "Celebrating outstanding supporting performances",
      maxPoints: 26,
      sortOrder: 2,
      sweepType: "full",
      sweepBonus: 10,
    },
    {
      name: "The Authors",
      icon: "authors",
      description: "Honoring the written word in cinema",
      maxPoints: 28,
      sortOrder: 3,
      sweepType: "full",
      sweepBonus: 12,
    },
    {
      name: "Global & Animated",
      icon: "global",
      description: "Stories that transcend borders and animation",
      maxPoints: 24,
      sortOrder: 4,
      sweepType: "full",
      sweepBonus: 10,
    },
    {
      name: "Soundtrack",
      icon: "soundtrack",
      description: "The music that moves us",
      maxPoints: 20,
      sortOrder: 5,
      sweepType: "full",
      sweepBonus: 8,
    },
    {
      name: "The Crafts",
      icon: "crafts",
      description: "The artistry behind the camera — now including Best Casting",
      maxPoints: 32,
      sortOrder: 6,
      sweepType: "partial",
      sweepBonus: 12,
      partialThreshold: 4,
      partialBonus: 5,
    },
  ];

  const clusters: Record<string, string> = {};
  for (const c of clusterData) {
    const cluster = await prisma.cluster.create({ data: c });
    clusters[c.name] = cluster.id;
  }
  console.log("✓ 6 clusters created");

  // ─── Categories + Nominees ───
  // Using placeholder nominees for the 98th Academy Awards
  const categoryData = [
    // Cluster 1: The Crown
    {
      clusterName: "The Crown",
      name: "Best Picture",
      basePoints: 10,
      eligibleForFinalTen: true,
      sortOrder: 1,
      nominees: [
        { displayName: "Anora", filmTitle: "Anora" },
        { displayName: "The Brutalist", filmTitle: "The Brutalist" },
        { displayName: "A Complete Unknown", filmTitle: "A Complete Unknown" },
        { displayName: "Conclave", filmTitle: "Conclave" },
        { displayName: "Dune: Part Two", filmTitle: "Dune: Part Two" },
        { displayName: "Emilia Pérez", filmTitle: "Emilia Pérez" },
        { displayName: "I'm Still Here", filmTitle: "I'm Still Here" },
        { displayName: "Nickel Boys", filmTitle: "Nickel Boys" },
        { displayName: "The Substance", filmTitle: "The Substance" },
        { displayName: "Wicked", filmTitle: "Wicked" },
      ],
    },
    {
      clusterName: "The Crown",
      name: "Best Director",
      basePoints: 10,
      eligibleForFinalTen: true,
      sortOrder: 2,
      nominees: [
        { displayName: "Sean Baker", filmTitle: "Anora" },
        { displayName: "Brady Corbet", filmTitle: "The Brutalist" },
        { displayName: "James Mangold", filmTitle: "A Complete Unknown" },
        { displayName: "Jacques Audiard", filmTitle: "Emilia Pérez" },
        { displayName: "Coralie Fargeat", filmTitle: "The Substance" },
      ],
    },
    {
      clusterName: "The Crown",
      name: "Best Actor",
      basePoints: 10,
      eligibleForFinalTen: true,
      sortOrder: 3,
      nominees: [
        { displayName: "Adrien Brody", filmTitle: "The Brutalist" },
        { displayName: "Timothée Chalamet", filmTitle: "A Complete Unknown" },
        { displayName: "Colman Domingo", filmTitle: "Sing Sing" },
        { displayName: "Ralph Fiennes", filmTitle: "Conclave" },
        { displayName: "Sebastian Stan", filmTitle: "The Apprentice" },
      ],
    },
    {
      clusterName: "The Crown",
      name: "Best Actress",
      basePoints: 10,
      eligibleForFinalTen: true,
      sortOrder: 4,
      nominees: [
        { displayName: "Cynthia Erivo", filmTitle: "Wicked" },
        { displayName: "Karla Sofía Gascón", filmTitle: "Emilia Pérez" },
        { displayName: "Mikey Madison", filmTitle: "Anora" },
        { displayName: "Demi Moore", filmTitle: "The Substance" },
        { displayName: "Fernanda Torres", filmTitle: "I'm Still Here" },
      ],
    },

    // Cluster 2: The Performers
    {
      clusterName: "The Performers",
      name: "Best Supporting Actor",
      basePoints: 8,
      eligibleForFinalTen: false,
      sortOrder: 1,
      nominees: [
        { displayName: "Yura Borisov", filmTitle: "Anora" },
        { displayName: "Kieran Culkin", filmTitle: "A Real Pain" },
        { displayName: "Edward Norton", filmTitle: "A Complete Unknown" },
        { displayName: "Guy Pearce", filmTitle: "The Brutalist" },
        { displayName: "Jeremy Strong", filmTitle: "The Apprentice" },
      ],
    },
    {
      clusterName: "The Performers",
      name: "Best Supporting Actress",
      basePoints: 8,
      eligibleForFinalTen: false,
      sortOrder: 2,
      nominees: [
        { displayName: "Monica Barbaro", filmTitle: "A Complete Unknown" },
        { displayName: "Ariana Grande", filmTitle: "Wicked" },
        { displayName: "Felicity Jones", filmTitle: "The Brutalist" },
        { displayName: "Isabella Rossellini", filmTitle: "Conclave" },
        { displayName: "Zoe Saldaña", filmTitle: "Emilia Pérez" },
      ],
    },

    // Cluster 3: The Authors
    {
      clusterName: "The Authors",
      name: "Best Original Screenplay",
      basePoints: 8,
      eligibleForFinalTen: false,
      sortOrder: 1,
      nominees: [
        { displayName: "Sean Baker", filmTitle: "Anora" },
        { displayName: "Brady Corbet & Mona Fastvold", filmTitle: "The Brutalist" },
        { displayName: "Jesse Eisenberg", filmTitle: "A Real Pain" },
        { displayName: "Justin Kuritzkes", filmTitle: "The Substance" },
        { displayName: "Coralie Fargeat", filmTitle: "The Substance" },
      ],
    },
    {
      clusterName: "The Authors",
      name: "Best Adapted Screenplay",
      basePoints: 8,
      eligibleForFinalTen: false,
      sortOrder: 2,
      nominees: [
        { displayName: "Jacques Audiard", filmTitle: "Emilia Pérez" },
        { displayName: "Peter Straughan", filmTitle: "Conclave" },
        { displayName: "RaMell Ross & Joslyn Barnes", filmTitle: "Nickel Boys" },
        { displayName: "Denis Villeneuve & Jon Spaihts", filmTitle: "Dune: Part Two" },
        { displayName: "Virgil Williams", filmTitle: "Sing Sing" },
      ],
    },

    // Cluster 4: Global & Animated
    {
      clusterName: "Global & Animated",
      name: "Best International Feature Film",
      basePoints: 7,
      eligibleForFinalTen: false,
      sortOrder: 1,
      nominees: [
        { displayName: "I'm Still Here", filmTitle: "Brazil" },
        { displayName: "The Girl with the Needle", filmTitle: "Denmark" },
        { displayName: "Emilia Pérez", filmTitle: "France" },
        { displayName: "The Seed of the Sacred Fig", filmTitle: "Germany" },
        { displayName: "Flow", filmTitle: "Latvia" },
      ],
    },
    {
      clusterName: "Global & Animated",
      name: "Best Animated Feature Film",
      basePoints: 7,
      eligibleForFinalTen: false,
      sortOrder: 2,
      nominees: [
        { displayName: "Flow" },
        { displayName: "Inside Out 2" },
        { displayName: "Memoir of a Snail" },
        { displayName: "Wallace & Gromit: Vengeance Most Fowl" },
        { displayName: "The Wild Robot" },
      ],
    },

    // Cluster 5: Soundtrack
    {
      clusterName: "Soundtrack",
      name: "Best Original Score",
      basePoints: 6,
      eligibleForFinalTen: false,
      sortOrder: 1,
      nominees: [
        { displayName: "Volker Bertelmann", filmTitle: "Conclave" },
        { displayName: "Daniel Blumberg", filmTitle: "The Brutalist" },
        { displayName: "Clément Ducol & Camille", filmTitle: "Emilia Pérez" },
        { displayName: "Kris Bowers", filmTitle: "The Wild Robot" },
        { displayName: "Hans Zimmer", filmTitle: "Dune: Part Two" },
      ],
    },
    {
      clusterName: "Soundtrack",
      name: "Best Original Song",
      basePoints: 6,
      eligibleForFinalTen: false,
      sortOrder: 2,
      nominees: [
        { displayName: '"El Mal"', filmTitle: "Emilia Pérez" },
        { displayName: '"The Journey"', filmTitle: "The Six Triple Eight" },
        { displayName: '"Like a Bird"', filmTitle: "Sing Sing" },
        { displayName: '"Mi Camino"', filmTitle: "Emilia Pérez" },
        { displayName: '"Never Too Late"', filmTitle: "Elton John: Never Too Late" },
      ],
    },

    // Cluster 6: The Crafts
    {
      clusterName: "The Crafts",
      name: "Best Cinematography",
      basePoints: 4,
      eligibleForFinalTen: false,
      sortOrder: 1,
      nominees: [
        { displayName: "Lol Crawley", filmTitle: "The Brutalist" },
        { displayName: "Greig Fraser", filmTitle: "Dune: Part Two" },
        { displayName: "Jarin Blaschke", filmTitle: "Nosferatu" },
        { displayName: "Paul Guilhaume", filmTitle: "Emilia Pérez" },
        { displayName: "Stéphane Fontaine", filmTitle: "Conclave" },
      ],
    },
    {
      clusterName: "The Crafts",
      name: "Best Production Design",
      basePoints: 4,
      eligibleForFinalTen: false,
      sortOrder: 2,
      nominees: [
        { displayName: "Judy Becker", filmTitle: "The Brutalist" },
        { displayName: "Patrice Vermette", filmTitle: "Dune: Part Two" },
        { displayName: "Nathan Crowley", filmTitle: "Wicked" },
        { displayName: "Craig Lathrop", filmTitle: "Nosferatu" },
        { displayName: "Suzie Davies", filmTitle: "Conclave" },
      ],
    },
    {
      clusterName: "The Crafts",
      name: "Best Costume Design",
      basePoints: 4,
      eligibleForFinalTen: false,
      sortOrder: 3,
      nominees: [
        { displayName: "Massimo Cantini Parrini", filmTitle: "Conclave" },
        { displayName: "Arianne Phillips", filmTitle: "A Complete Unknown" },
        { displayName: "Linda Hemming", filmTitle: "Nosferatu" },
        { displayName: "Paul Tazewell", filmTitle: "Wicked" },
        { displayName: "Jacqueline West", filmTitle: "Dune: Part Two" },
      ],
    },
    {
      clusterName: "The Crafts",
      name: "Best Film Editing",
      basePoints: 4,
      eligibleForFinalTen: false,
      sortOrder: 4,
      nominees: [
        { displayName: "Sean Baker", filmTitle: "Anora" },
        { displayName: "David Jancso", filmTitle: "The Brutalist" },
        { displayName: "Dávid Jancsó", filmTitle: "Conclave" },
        { displayName: "Juliette Welfling", filmTitle: "Emilia Pérez" },
        { displayName: "Joe Walker", filmTitle: "Dune: Part Two" },
      ],
    },
    // ✨ NEW for 98th Academy Awards — Best Casting introduced as an official category
    {
      clusterName: "The Crafts",
      name: "Best Casting",
      basePoints: 4,
      eligibleForFinalTen: false,
      sortOrder: 5,
      nominees: [
        { displayName: "Jeanne McCarthy & Nicole Abellera Klompus", filmTitle: "Anora" },
        { displayName: "Susie Figgis", filmTitle: "The Brutalist" },
        { displayName: "Carmen Cuba", filmTitle: "Conclave" },
        { displayName: "Francine Maisler", filmTitle: "A Complete Unknown" },
        { displayName: "Rhonda Price", filmTitle: "Wicked" },
      ],
    },
  ];

  const categoryIds: Record<string, string> = {};
  const nomineeIds: string[] = [];

  for (const catDef of categoryData) {
    const clusterId = clusters[catDef.clusterName];
    const category = await prisma.category.create({
      data: {
        name: catDef.name,
        clusterId,
        basePoints: catDef.basePoints,
        eligibleForFinalTen: catDef.eligibleForFinalTen,
        sortOrder: catDef.sortOrder,
      },
    });
    categoryIds[catDef.name] = category.id;

    for (let i = 0; i < catDef.nominees.length; i++) {
      const nom = catDef.nominees[i];
      const nominee = await prisma.nominee.create({
        data: {
          categoryId: category.id,
          displayName: nom.displayName,
          filmTitle: ("filmTitle" in nom ? nom.filmTitle : undefined) || null,
          imageUrl: `/placeholders/nominee-${(i % 10) + 1}.jpg`,
          sortOrder: i + 1,
        },
      });
      nomineeIds.push(nominee.id);
    }
  }
  console.log(`✓ ${Object.keys(categoryIds).length} categories with nominees`);

  // ─── Sample Insights ───
  const insightsData = [
    {
      categoryName: "Best Picture",
      scope: "category" as const,
      key: "total_noms",
      label: "Total Films Nominated",
      value: "10",
      sourceName: "Academy",
    },
    {
      categoryName: "Best Director",
      scope: "category" as const,
      key: "first_time_noms",
      label: "First-time Nominees",
      value: "2",
      sourceName: "Academy",
    },
    {
      categoryName: "Best Actor",
      scope: "category" as const,
      key: "prior_winners",
      label: "Prior Oscar Winners in Race",
      value: "1",
      sourceName: "Oscar History",
    },
    {
      categoryName: "Best Actress",
      scope: "category" as const,
      key: "critics_fav",
      label: "Critics Choice Winner",
      value: "Demi Moore",
      sourceName: "Critics Choice",
    },
  ];

  for (const ins of insightsData) {
    const catId = categoryIds[ins.categoryName];
    if (catId) {
      await prisma.insightMetric.create({
        data: {
          scope: ins.scope,
          categoryId: catId,
          key: ins.key,
          label: ins.label,
          value: ins.value,
          sourceName: ins.sourceName,
        },
      });
    }
  }
  console.log("✓ Sample insight metrics");

  // ─── Ticker / Trivia ───
  const triviaItems = [
    {
      title: "Oscar Statuette",
      snippet:
        "The Oscar statuette weighs 8.5 pounds, stands 13.5 inches tall, and is made of gold-plated bronze on a black metal base.",
      isTrivia: true,
    },
    {
      title: "Most Nominated Film Ever",
      snippet:
        'All About Eve (1950), Titanic (1997), and La La Land (2016, though one was rescinded) hold records for most nominations. "All About Eve" and "Titanic" each received 14.',
      isTrivia: true,
    },
    {
      title: "Youngest Winner",
      snippet:
        "Tatum O'Neal became the youngest competitive winner at age 10 for her role in Paper Moon (1973).",
      isTrivia: true,
    },
    {
      title: "The 11-Win Club",
      snippet:
        "Only three films have won 11 Oscars: Ben-Hur (1959), Titanic (1997), and The Lord of the Rings: The Return of the King (2003).",
      isTrivia: true,
    },
    {
      title: "Envelope Origin",
      snippet:
        'The iconic "envelope please" tradition started in the 1940s to prevent leaked results. PwC has tabulated ballots since 1934.',
      isTrivia: true,
    },
    {
      title: "First Color Best Picture",
      snippet:
        "Gone with the Wind (1939) was the first color film to win Best Picture, also winning 8 competitive Oscars.",
      isTrivia: true,
    },
    {
      title: "Oscar Night Duration",
      snippet:
        "The longest Oscar ceremony ran 4 hours and 23 minutes (2002). The Academy has been trying to keep it under 3.5 hours since.",
      isTrivia: true,
    },
    {
      title: "Most Oscar Wins (Person)",
      snippet:
        "Walt Disney holds the record for the most Oscar wins by an individual — 22 competitive Academy Awards plus 4 honorary ones.",
      isTrivia: true,
    },
    {
      title: "Category Spotlight: Best Picture 2026",
      snippet:
        "The 98th Academy Awards Best Picture race features 10 diverse nominees spanning genres from musical to drama to horror to animation.",
      isSpotlight: true,
    },
    {
      title: "New: Best Casting",
      snippet:
        "The 98th Academy Awards marks the debut of Best Casting as an official competitive category — recognizing the vital craft of assembling a film's ensemble.",
      isTrivia: true,
    },
  ];

  for (const t of triviaItems) {
    await prisma.tickerItem.create({
      data: {
        title: t.title,
        snippet: t.snippet,
        sourceName: "Oscar Ballot 2026",
        isTrivia: t.isTrivia || false,
        isSpotlight: t.isSpotlight || false,
        isActive: true,
      },
    });
  }
  console.log("✓ Ticker items & trivia");

  // ─── Awards Year ───
  await prisma.awardsYear.create({
    data: { label: "98th", year: 2026, isActive: true },
  });

  console.log("\n🏆 Seed complete!");
  console.log("───────────────────────────────────────");
  console.log(`Admin login: ${admin.email} / ${process.env.ADMIN_PASSWORD || "changeme123"}`);
  console.log("Demo users: alice@demo.com (etc.) / demo1234");
  console.log("Ballot is open for 30 days");
  console.log("───────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
