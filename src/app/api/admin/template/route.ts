import { NextRequest, NextResponse } from "next/server";

const templates: Record<string, unknown[]> = {
  nominees: [
    {
      categoryId: "CATEGORY_ID_HERE",
      displayName: "Actor Name",
      filmTitle: "Film Title",
      imageUrl: "/placeholders/nominee-1.jpg",
      sortOrder: 1,
    },
    {
      categoryId: "CATEGORY_ID_HERE",
      displayName: "Another Actor",
      filmTitle: "Another Film",
      imageUrl: null,
      sortOrder: 2,
    },
  ],
  insights: [
    {
      scope: "category",
      categoryId: "CATEGORY_ID_HERE",
      nomineeId: null,
      key: "total_nominations",
      label: "Total Nominations",
      value: "10",
      sourceName: "Academy",
      sourceUrl: "https://oscar.go.com",
    },
    {
      scope: "nominee",
      categoryId: "CATEGORY_ID_HERE",
      nomineeId: "NOMINEE_ID_HERE",
      key: "prior_wins",
      label: "Prior Oscar Wins",
      value: "2",
      sourceName: "IMDb",
      sourceUrl: null,
    },
  ],
  ticker: [
    {
      title: "Fun Oscar Fact",
      snippet: "The Oscar statuette weighs 8.5 pounds.",
      sourceName: "Academy",
      sourceUrl: null,
      isTrivia: true,
      isSpotlight: false,
    },
    {
      title: "Category Spotlight: Best Picture",
      snippet: "This year's Best Picture race is wide open with 10 nominees.",
      sourceName: null,
      sourceUrl: null,
      isTrivia: false,
      isSpotlight: true,
    },
  ],
};

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");

  if (!type || !templates[type]) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  return NextResponse.json(templates[type], {
    headers: {
      "Content-Disposition": `attachment; filename="${type}-template.json"`,
    },
  });
}
