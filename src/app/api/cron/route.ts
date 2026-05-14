import { NextResponse } from "next/server";
import { getTrackers } from "@/lib/store";
import { fetchHotList, filterByKeywords, generateSummary, sendBriefEmail, getSourceLabel } from "@/lib/data";
import { saveBrief } from "@/lib/store";
import type { Brief, NewsItem } from "@/lib/data";

// Vercel Cron Job: 每6小时触发一次
// 配合 vercel.json 中的 cron 配置使用
export async function GET(request: Request) {
  // 验证 Cron 密钥（防止外部触发）
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const trackers = await getTrackers();
    const activeTrackers = trackers.filter((t) => t.isActive);

    if (activeTrackers.length === 0) {
      return NextResponse.json({ message: "No active trackers", processed: 0 });
    }

    const results: { trackerId: string; trackerName: string; success: boolean; itemCount: number }[] = [];

    for (const tracker of activeTrackers) {
      try {
        // 抓取新闻
        const sourceIds = tracker.sources.length > 0 ? tracker.sources : ["zhihu", "weibo", "baidu", "toutiao"];
        const allItems: NewsItem[] = [];

        const fetchPromises = sourceIds.map(async (sourceId) => {
          const items = await fetchHotList(sourceId);
          allItems.push(...items);
        });
        await Promise.allSettled(fetchPromises);

        // 过滤 + 去重
        const filtered = filterByKeywords(allItems, tracker.keywords);
        const seen = new Set<string>();
        const unique = filtered.filter((item) => {
          const key = item.title.trim();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        if (unique.length === 0) {
          results.push({ trackerId: tracker.id, trackerName: tracker.name, success: true, itemCount: 0 });
          continue;
        }

        // 生成摘要
        const summary = await generateSummary(tracker.name, unique, tracker.keywords);

        // 保存简报
        const brief: Brief = {
          id: `brief-${Date.now()}-${tracker.id}`,
          trackerId: tracker.id,
          trackerName: tracker.name,
          items: unique,
          summary,
          generatedAt: new Date().toISOString(),
        };
        await saveBrief(brief);

        // 发送邮件
        if (tracker.email) {
          await sendBriefEmail(tracker.email, tracker.name, summary, unique);
        }

        results.push({ trackerId: tracker.id, trackerName: tracker.name, success: true, itemCount: unique.length });
      } catch (err) {
        results.push({ trackerId: tracker.id, trackerName: tracker.name, success: false, itemCount: 0 });
        console.error(`Failed to process tracker ${tracker.id}:`, err);
      }
    }

    return NextResponse.json({
      message: "Cron job completed",
      processed: results.length,
      results,
    });
  } catch (err) {
    console.error("Cron job failed:", err);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
