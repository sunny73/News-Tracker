import { NextResponse } from "next/server";
import { fetchHotList, filterByKeywords, generateSummary, sendBriefEmail, getSourceLabel } from "@/lib/data";
import { getTracker, saveBrief } from "@/lib/store";
import { Brief, NewsItem } from "@/lib/data";

// POST /api/briefs/generate?trackerId=xxx
export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  const { searchParams } = new URL(request.url);
  const trackerId = searchParams.get("trackerId");

  if (!trackerId) {
    return NextResponse.json({ error: "trackerId required" }, { status: 400 });
  }

  const tracker = await getTracker(trackerId);
  if (!tracker) {
    return NextResponse.json({ error: "Tracker not found" }, { status: 404 });
  }

  // 1. 抓取所有配置源的新闻
  const sourceIds = tracker.sources.length > 0 ? tracker.sources : undefined;
  const sources = sourceIds || ["zhihu", "weibo", "baidu", "toutiao"];

  const allItems: NewsItem[] = [];
  const fetchPromises = sources.map(async (sourceId) => {
    const items = await fetchHotList(sourceId);
    allItems.push(...items);
  });
  await Promise.allSettled(fetchPromises);

  // 2. 按关键词过滤
  const filtered = filterByKeywords(allItems, tracker.keywords);

  // 3. 去重（按标题相似度）
  const seen = new Set<string>();
  const unique = filtered.filter((item) => {
    const key = item.title.trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 4. 生成 AI 摘要
  const summary = await generateSummary(tracker.name, unique, tracker.keywords);

  // 5. 保存简报
  const brief: Brief = {
    id: `brief-${Date.now()}`,
    trackerId: tracker.id,
    trackerName: tracker.name,
    items: unique,
    summary,
    generatedAt: new Date().toISOString(),
  };
  await saveBrief(brief);

  // 6. 发送邮件（如果配置了）
  if (tracker.isActive && tracker.email) {
    sendBriefEmail(tracker.email, tracker.name, summary, unique).catch(console.error);
  }

  return NextResponse.json({
    brief,
    stats: {
      totalFetched: allItems.length,
      filtered: unique.length,
      sentEmail: !!tracker.email && tracker.isActive,
    },
  });
}
