import { NextRequest, NextResponse } from "next/server";
import { fetchMixOembedMetadata } from "@/lib/mix-oembed";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url?.trim()) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const meta = await fetchMixOembedMetadata(url.trim());
    return NextResponse.json({
      title: meta.title,
      thumbnailUrl: meta.thumbnailUrl,
    });
  } catch {
    return NextResponse.json(
      { title: null, thumbnailUrl: null },
      { status: 200 },
    );
  }
}
