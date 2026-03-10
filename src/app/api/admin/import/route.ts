import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user as { role?: string }).role !== "admin"
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file || !type) {
      return NextResponse.json(
        { error: "File and type required" },
        { status: 400 }
      );
    }

    const MAX_SIZE = 1 * 1024 * 1024; // 1 MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 1 MB)" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const data = JSON.parse(text);

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: "Expected JSON array" },
        { status: 400 }
      );
    }

    let count = 0;

    switch (type) {
      case "nominees":
        for (const item of data) {
          if (!item.categoryId || !item.displayName) continue;
          await prisma.nominee.create({
            data: {
              categoryId: item.categoryId,
              displayName: item.displayName,
              filmTitle: item.filmTitle || null,
              imageUrl: item.imageUrl || null,
              sortOrder: item.sortOrder || 0,
            },
          });
          count++;
        }
        break;

      case "insights":
        for (const item of data) {
          if (!item.key || !item.label || !item.value) continue;
          await prisma.insightMetric.create({
            data: {
              scope: item.scope || "category",
              categoryId: item.categoryId || null,
              nomineeId: item.nomineeId || null,
              key: item.key,
              label: item.label,
              value: item.value,
              sourceName: item.sourceName || null,
              sourceUrl: item.sourceUrl || null,
            },
          });
          count++;
        }
        break;

      case "ticker":
        for (const item of data) {
          if (!item.title || !item.snippet) continue;
          await prisma.tickerItem.create({
            data: {
              title: item.title,
              snippet: item.snippet,
              sourceName: item.sourceName || null,
              sourceUrl: item.sourceUrl || null,
              isTrivia: item.isTrivia || false,
              isSpotlight: item.isSpotlight || false,
              isActive: true,
            },
          });
          count++;
        }
        break;

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: `bulk_import_${type}`,
        entityType: type,
        afterJson: JSON.stringify({ count }),
      },
    });

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
