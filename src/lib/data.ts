// ========== 数据类型定义 ==========

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  hot?: string;
  summary?: string;
  publishedAt?: string;
}

export interface NewsSource {
  id: string;
  name: string;
  category: string;
  apiType: "dailyhot" | "rsshub" | "custom";
  apiEndpoint?: string;
  icon?: string;
}

export interface Tracker {
  id: string;
  name: string;
  keywords: string[];
  sources: string[]; // source ids
  cronExpression: string;
  cronLabel: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Brief {
  id: string;
  trackerId: string;
  trackerName: string;
  items: NewsItem[];
  summary: string;
  generatedAt: string;
}

// ========== 预设新闻源 ==========
export const NEWS_SOURCES: NewsSource[] = [
  { id: "zhihu", name: "知乎热榜", category: "社区", apiType: "dailyhot", icon: "💡" },
  { id: "weibo", name: "微博热搜", category: "社交媒体", apiType: "dailyhot", icon: "🔥" },
  { id: "baidu", name: "百度热搜", category: "搜索引擎", apiType: "dailyhot", icon: "🔍" },
  { id: "toutiao", name: "今日头条", category: "新闻", apiType: "dailyhot", icon: "📰" },
  { id: "douyin", name: "抖音热榜", category: "短视频", apiType: "dailyhot", icon: "🎵" },
  { id: "bilibili", name: "哔哩哔哩", category: "视频", apiType: "dailyhot", icon: "📺" },
  { id: "36kr", name: "36氪", category: "科技", apiType: "dailyhot", icon: "🚀" },
  { id: "ithome", name: "IT之家", category: "科技", apiType: "dailyhot", icon: "💻" },
  { id: "thepaper", name: "澎湃新闻", category: "新闻", apiType: "dailyhot", icon: "📋" },
  { id: "netease", name: "网易新闻", category: "新闻", apiType: "dailyhot", icon: "📧" },
];

// ========== 预设 Cron 选项 ==========
export const CRON_OPTIONS = [
  { label: "每小时", value: "0 * * * *" },
  { label: "每6小时", value: "0 */6 * * *" },
  { label: "每天 8:00", value: "0 8 * * *" },
  { label: "每天 12:00", value: "0 12 * * *" },
  { label: "每天 20:00", value: "0 20 * * *" },
  { label: "每天 8:00 & 20:00", value: "0 8,20 * * *" },
];

// ========== DailyHot API 映射 ==========
const DAILYHOT_SOURCE_MAP: Record<string, string> = {
  zhihu: "zhihuHot",
  weibo: "weiBoHot",
  baidu: "baiduRD",
  toutiao: "toutiaoHot",
  douyin: "douYinHot",
  bilibili: "biliHot",
  "36kr": "36Kr",
  ithome: "ithome",
  thepaper: "thepaper",
  netease: "wangyiNews",
};

// ========== 数据获取函数 ==========

export async function fetchHotList(sourceId: string): Promise<NewsItem[]> {
  const apiType = DAILYHOT_SOURCE_MAP[sourceId];
  if (!apiType) return [];

  try {
    const res = await fetch(
      `https://api.vvhan.com/api/hotlist/${apiType}`,
      { next: { revalidate: 600 } } // 缓存10分钟
    );
    if (!res.ok) return [];

    const data = await res.json();
    if (data.success !== true) return [];

    return (data.data || []).map((item: any, index: number) => ({
      id: `${sourceId}-${index}`,
      title: item.title || "",
      url: item.url || "",
      source: sourceId,
      hot: item.hot || "",
      summary: item.desc || "",
    }));
  } catch {
    console.error(`Failed to fetch ${sourceId}`);
    return [];
  }
}

export async function fetchAllHotLists(): Promise<Record<string, NewsItem[]>> {
  const results: Record<string, NewsItem[]> = {};
  const promises = NEWS_SOURCES.map(async (source) => {
    const items = await fetchHotList(source.id);
    if (items.length > 0) results[source.id] = items;
  });
  await Promise.allSettled(promises);
  return results;
}

// ========== 关键词过滤 ==========
export function filterByKeywords(
  items: NewsItem[],
  keywords: string[]
): NewsItem[] {
  if (keywords.length === 0) return items;
  return items.filter((item) =>
    keywords.some(
      (kw) =>
        item.title.toLowerCase().includes(kw.toLowerCase()) ||
        item.summary?.toLowerCase().includes(kw.toLowerCase())
    )
  );
}

// ========== DeepSeek AI 摘要 ==========
export async function generateSummary(
  trackerName: string,
  items: NewsItem[],
  keywords: string[]
): Promise<string> {
  if (items.length === 0) return "本次未找到匹配的新闻。";

  const newsText = items
    .slice(0, 20)
    .map((item, i) => `${i + 1}. [${getSourceLabel(item.source)}] ${item.title}${item.hot ? ` (热度: ${item.hot})` : ""}`)
    .join("\n");

  const prompt = `你是一个新闻分析师。请根据以下新闻列表，生成一份简明扼要的新闻简报。

追踪名称：${trackerName}
追踪关键词：${keywords.join("、")}

新闻列表：
${newsText}

请按以下格式输出简报：

📊 ${trackerName} - 新闻简报
━━━━━━━━━━━━━━━━━━━━

📌 核心摘要
（2-3句话概括最重要的趋势和事件）

🔥 热点事件 TOP 5
（选出最值得关注的5条新闻，每条一行：序号. 标题）

💡 趋势洞察
（1-2句分析这些新闻反映的趋势）

━━━━━━━━━━━━━━━━━━━━
共追踪到 ${items.length} 条相关新闻`;

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return generateLocalSummary(items, keywords);

    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!res.ok) return generateLocalSummary(items, keywords);

    const data = await res.json();
    return data.choices?.[0]?.message?.content || generateLocalSummary(items, keywords);
  } catch {
    return generateLocalSummary(items, keywords);
  }
}

function generateLocalSummary(items: NewsItem[], keywords: string[]): string {
  const top5 = items.slice(0, 5);
  return `📊 新闻简报
━━━━━━━━━━━━━━━━━━━━

📌 核心摘要
共追踪到 ${items.length} 条与「${keywords.join("、")}」相关的新闻。

🔥 热点事件 TOP 5
${top5.map((item, i) => `${i + 1}. [${getSourceLabel(item.source)}] ${item.title}`).join("\n")}

💡 趋势洞察
当前追踪关键词热度较高，建议关注上述事件动态。

━━━━━━━━━━━━━━━━━━━━
共追踪到 ${items.length} 条相关新闻`;
}

// ========== 邮件发送 ==========
export async function sendBriefEmail(
  to: string,
  trackerName: string,
  summary: string,
  items: NewsItem[]
): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("RESEND_API_KEY not configured, skipping email");
    return false;
  }

  const newsListHtml = items
    .slice(0, 20)
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;">
            <a href="${item.url}" style="color:#1a73e8;text-decoration:none;">${item.title}</a>
            <span style="color:#999;font-size:12px;margin-left:8px;">[${getSourceLabel(item.source)}]${item.hot ? ` ${item.hot}` : ""}</span>
          </td>
        </tr>`
    )
    .join("");

  const htmlContent = `
    <div style="max-width:680px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;">
      <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:24px 32px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;color:#fff;font-size:20px;">📰 ${trackerName}</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">新闻简报 · ${new Date().toLocaleDateString("zh-CN")}</p>
      </div>
      <div style="padding:24px 32px;background:#fff;">
        <div style="white-space:pre-wrap;background:#f8f9fa;padding:16px;border-radius:8px;font-size:14px;line-height:1.6;margin-bottom:20px;">${summary}</div>
        <h2 style="font-size:16px;color:#333;border-bottom:2px solid #667eea;padding-bottom:8px;">📋 完整新闻列表 (${items.length}条)</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tbody>${newsListHtml}</tbody>
        </table>
      </div>
      <div style="padding:16px 32px;background:#f8f9fa;border-radius:0 0 12px 12px;text-align:center;font-size:12px;color:#999;">
        News Tracker · ${new Date().toLocaleDateString("zh-CN")} ${new Date().toLocaleTimeString("zh-CN")}
      </div>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "News Tracker <onboarding@resend.dev>",
        to: [to],
        subject: `📰 ${trackerName} - 新闻简报 ${new Date().toLocaleDateString("zh-CN")}`,
        html: htmlContent,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ========== 工具函数 ==========
export function getSourceLabel(sourceId: string): string {
  return NEWS_SOURCES.find((s) => s.id === sourceId)?.name || sourceId;
}

export function getSourceIcon(sourceId: string): string {
  return NEWS_SOURCES.find((s) => s.id === sourceId)?.icon || "📰";
}
