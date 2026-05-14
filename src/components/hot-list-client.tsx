"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink, Flame } from "lucide-react";
import { NEWS_SOURCES, getSourceLabel, type NewsItem } from "@/lib/data";

type SourceData = {
  id: string;
  name: string;
  icon: string;
  items: NewsItem[];
  loading: boolean;
  error?: string;
  updatedAt?: string;
};

const DEFAULT_SOURCES = ["zhihu", "weibo", "baidu", "toutiao", "douyin", "bilibili"];

export function HotListClient() {
  const [sources, setSources] = useState<SourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results: SourceData[] = DEFAULT_SOURCES.map((id) => {
      const source = NEWS_SOURCES.find((s) => s.id === id);
      return {
        id,
        name: source?.name || id,
        icon: source?.icon || "📰",
        items: [],
        loading: true,
      };
    });
    setSources(results);

    const promises = DEFAULT_SOURCES.map(async (id, index) => {
      try {
        const res = await fetch(`/api/hotlist?source=${id}`);
        const data = await res.json();
        setSources((prev) => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            items: data.items || [],
            loading: false,
            updatedAt: new Date().toLocaleTimeString("zh-CN"),
          };
          return next;
        });
      } catch {
        setSources((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], loading: false, error: "加载失败" };
          return next;
        });
      }
    });
    await Promise.allSettled(promises);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const displaySources =
    activeTab === "all"
      ? sources
      : sources.filter((s) => s.id === activeTab);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Flame className="w-6 h-6 text-orange-500" />
          <h1 className="text-2xl font-bold">全网热榜</h1>
          <Badge variant="secondary" className="text-xs">
            {sources.filter((s) => s.items.length > 0).length}/{sources.length} 源
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAll}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          刷新
        </Button>
      </div>

      {/* Source Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Badge
          variant={activeTab === "all" ? "default" : "outline"}
          className="cursor-pointer hover:bg-indigo-50 px-3 py-1"
          onClick={() => setActiveTab("all")}
        >
          全部
        </Badge>
        {sources.map((s) => (
          <Badge
            key={s.id}
            variant={activeTab === s.id ? "default" : "outline"}
            className="cursor-pointer hover:bg-indigo-50 px-3 py-1 shrink-0"
            onClick={() => setActiveTab(s.id)}
          >
            {s.icon} {s.name}
            {s.items.length > 0 && (
              <span className="ml-1 text-xs opacity-70">{s.items.length}</span>
            )}
          </Badge>
        ))}
      </div>

      {/* Content Grid */}
      <div
        className={
          activeTab === "all"
            ? "grid grid-cols-1 md:grid-cols-2 gap-6"
            : "max-w-3xl mx-auto"
        }
      >
        {displaySources.map((source) => (
          <Card key={source.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-lg">{source.icon}</span>
                  {source.name}
                </CardTitle>
                {source.updatedAt && (
                  <span className="text-xs text-muted-foreground">
                    {source.updatedAt} 更新
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {source.loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-5 bg-gray-100 rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : source.error ? (
                <p className="text-sm text-destructive">{source.error}</p>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-0">
                    {source.items.slice(0, 20).map((item, index) => (
                      <div key={item.id}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 py-2.5 px-1 group hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <span
                            className={`shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                              index < 3
                                ? "bg-red-500 text-white"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">
                              {item.title}
                            </p>
                            {item.hot && (
                              <span className="text-xs text-orange-500 mt-0.5 inline-block">
                                {item.hot}
                              </span>
                            )}
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-1 group-hover:text-indigo-400 transition-colors" />
                        </a>
                        {index < source.items.length - 1 && index < 19 && (
                          <Separator className="opacity-50" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {sources.length > 0 && sources.every((s) => !s.loading && s.items.length === 0) && (
        <div className="text-center py-20 text-muted-foreground">
          <p>暂无数据，请稍后刷新重试</p>
        </div>
      )}
    </div>
  );
}
