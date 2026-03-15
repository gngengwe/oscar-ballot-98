import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const clusters = await prisma.cluster.findMany({
    include: {
      categories: {
        include: {
          nominees: { orderBy: { sortOrder: "asc" } },
          winnerDraft: true,
          winnerPublished: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const settings = await prisma.globalSettings.findUnique({
    where: { id: "singleton" },
  });

  const userCount = await prisma.user.count();
  const winnersPublishedCount = await prisma.winnerPublished.count();
  const totalCategories = await prisma.category.count();

  return (
    <AdminClient
      clusters={JSON.parse(JSON.stringify(clusters))}
      settings={settings ? JSON.parse(JSON.stringify(settings)) : null}
      auditLogs={[]}
      stats={{
        userCount,
        committedBallots: 0,
        winnersPublished: winnersPublishedCount,
        totalCategories,
        tickerItems: 0,
      }}
      pickStats={[]}
      scoreDistribution={{ buckets: [], avg: 0, total: 0 }}
      tickerItems={[]}
    />
  );
}
