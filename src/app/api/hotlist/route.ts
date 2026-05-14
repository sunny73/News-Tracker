import { NextResponse } from "next/server";
import { fetchHotList, filterByKeywords, NEWS_SOURCES } from "@/lib/data";

// GET /api/hotlist?source=zhihu
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get("source");
  const keyword = searchParams.get("keyword");

  if (!sourceId) {
    // 返回所有源的最新数据（带缓存）
    return NextResponse.json({ sources: NEWS_SOURCES });
  }

  const items = await fetchHotList(sourceId);
  const filtered = keyword ? filterByKeywords(items, [keyword]) : items;
  const source = NEWS_SOURCES.find((s) => s.id === sourceId);

  return NextResponse.json({
    source: source?.name || sourceId,
    items: filtered,
    total: filtered.length,
  });
}
