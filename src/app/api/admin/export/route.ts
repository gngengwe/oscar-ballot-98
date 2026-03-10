import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user as { role?: string }).role !== "admin"
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const type = req.nextUrl.searchParams.get("type");

  let data: unknown;

  switch (type) {
    case "nominees":
      data = await prisma.nominee.findMany({
        include: { category: { select: { name: true, cluster: { select: { name: true } } } } },
        orderBy: { sortOrder: "asc" },
      });
      break;
    case "winners":
      data = {
        draft: await prisma.winnerDraft.findMany({
          include: {
            category: { select: { name: true } },
            nominee: { select: { displayName: true } },
          },
        }),
        published: await prisma.winnerPublished.findMany({
          include: {
            category: { select: { name: true } },
            nominee: { select: { displayName: true } },
          },
        }),
      };
      break;
    case "insights":
      data = await prisma.insightMetric.findMany();
      break;
    case "ticker":
      data = await prisma.tickerItem.findMany({ where: { isActive: true } });
      break;
    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  return NextResponse.json(data, {
    headers: {
      "Content-Disposition": `attachment; filename="${type}-export.json"`,
    },
  });
}
