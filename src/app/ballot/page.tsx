import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import BallotClient from "./BallotClient";

export default async function BallotPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const settings = await prisma.globalSettings.findUnique({
    where: { id: "singleton" },
  });

  const clusters = await prisma.cluster.findMany({
    include: {
      categories: {
        include: {
          nominees: { orderBy: { sortOrder: "asc" } },
          insightMetrics: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const userPicks = await prisma.pick.findMany({
    where: { userId: session.user.id },
  });

  const userFinalTen = await prisma.finalTenPick.findUnique({
    where: { userId: session.user.id },
  });

  const winnersPublished = await prisma.winnerPublished.findMany();

  // Determine ballot status
  const now = new Date();
  const isOpen = settings
    ? now >= settings.ballotOpensAt && now <= settings.ballotClosesAt
    : false;
  const isCommitted = userPicks.some((p) => p.lockedAt !== null);

  // Count picks made
  const totalCategories = clusters.reduce(
    (sum, c) => sum + c.categories.length,
    0
  );
  const picksMade = userPicks.length;

  return (
    <BallotClient
      clusters={JSON.parse(JSON.stringify(clusters))}
      userPicks={JSON.parse(JSON.stringify(userPicks))}
      userFinalTen={userFinalTen ? JSON.parse(JSON.stringify(userFinalTen)) : null}
      winnersPublished={JSON.parse(JSON.stringify(winnersPublished))}
      isOpen={isOpen}
      isCommitted={isCommitted}
      ballotClosesAt={settings?.ballotClosesAt?.toISOString() || null}
      totalCategories={totalCategories}
      picksMade={picksMade}
    />
  );
}
