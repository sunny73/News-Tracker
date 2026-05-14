import { NextResponse } from "next/server";
import { getBriefs } from "@/lib/store";

// GET /api/briefs?trackerId=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackerId = searchParams.get("trackerId");

  const briefs = await getBriefs(trackerId || undefined);
  // 返回简报列表（不含完整新闻列表，减少数据量）
  const summary = briefs.map((b) => ({
    id: b.id,
    trackerId: b.trackerId,
    trackerName: b.trackerName,
    summary: b.summary,
    itemCount: b.items.length,
    generatedAt: b.generatedAt,
  }));

  return NextResponse.json(summary);
}
