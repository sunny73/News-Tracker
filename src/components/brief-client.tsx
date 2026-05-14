"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Play,
  Mail,
  Clock,
  Sparkles,
  History,
  ExternalLink,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import {
  NEWS_SOURCES,
  CRON_OPTIONS,
  getSourceLabel,
  getSourceIcon,
  type Tracker,
  type Brief,
} from "@/lib/data";

export function BriefClient() {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTracker, setEditingTracker] = useState<Tracker | null>(null);
  const [formName, setFormName] = useState("");
  const [formKeywords, setFormKeywords] = useState("");
  const [formSources, setFormSources] = useState<string[]>([]);
  const [formCron, setFormCron] = useState("0 8,20 * * *");
  const [formEmail, setFormEmail] = useState("353526082@qq.com");

  const loadTrackers = useCallback(async () => {
    try {
      const res = await fetch("/api/trackers");
      const data = await res.json();
      setTrackers(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadBriefs = useCallback(async () => {
    try {
      const res = await fetch("/api/briefs");
      const data = await res.json();
      setBriefs(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadTrackers(), loadBriefs()]).finally(() => setLoading(false));
  }, [loadTrackers, loadBriefs]);

  const resetForm = () => {
    setFormName("");
    setFormKeywords("");
    setFormSources([]);
    setFormCron("0 8,20 * * *");
    setFormEmail("353526082@qq.com");
    setEditingTracker(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (tracker: Tracker) => {
    setEditingTracker(tracker);
    setFormName(tracker.name);
    setFormKeywords(tracker.keywords.join(", "));
    setFormSources(tracker.sources);
    setFormCron(tracker.cronExpression);
    setFormEmail(tracker.email);
    setDialogOpen(true);
  };

  const toggleSource = (sourceId: string) => {
    setFormSources((prev) =>
      prev.includes(sourceId)
        ? prev.filter((s) => s !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleSave = async () => {
    const keywords = formKeywords
      .split(/[,，、\n]+/)
      .map((k) => k.trim())
      .filter(Boolean);

    if (!formName || keywords.length === 0) return;

    const cronOption = CRON_OPTIONS.find((c) => c.value === formCron);

    if (editingTracker) {
      await fetch("/api/trackers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTracker.id,
          name: formName,
          keywords,
          sources: formSources,
          cronExpression: formCron,
          cronLabel: cronOption?.label || formCron,
          email: formEmail,
        }),
      });
    } else {
      await fetch("/api/trackers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          keywords,
          sources: formSources,
          cronExpression: formCron,
          cronLabel: cronOption?.label || formCron,
          email: formEmail,
        }),
      });
    }

    setDialogOpen(false);
    resetForm();
    loadTrackers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此追踪器？")) return;
    await fetch(`/api/trackers?id=${id}`, { method: "DELETE" });
    loadTrackers();
  };

  const handleToggle = async (tracker: Tracker) => {
    await fetch("/api/trackers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tracker.id, isActive: !tracker.isActive }),
    });
    loadTrackers();
  };

  const handleGenerate = async (trackerId: string) => {
    setGenerating(trackerId);
    try {
      const res = await fetch(`/api/briefs/generate?trackerId=${trackerId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.brief) {
        loadBriefs();
      }
    } catch (e) {
      console.error(e);
    }
    setGenerating(null);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-indigo-500" />
          <div>
            <h1 className="text-2xl font-bold">简报追踪</h1>
            <p className="text-sm text-muted-foreground">
              自定义关键词和来源，AI 自动生成新闻简报并推送邮箱
            </p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" />
          新建追踪
        </Button>
      </div>

      {/* Trackers Grid */}
      {trackers.length === 0 ? (
        <Card className="max-w-lg mx-auto mt-10">
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-3">📡</div>
            <h3 className="font-semibold mb-2">还没有追踪器</h3>
            <p className="text-sm text-muted-foreground mb-4">
              创建追踪器，设置关键词和来源，AI 将自动生成新闻简报
            </p>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" />
              创建第一个追踪器
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {trackers.map((tracker) => (
            <Card key={tracker.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{tracker.name}</CardTitle>
                    <CardDescription className="mt-1 flex flex-wrap gap-1">
                      {tracker.keywords.map((kw) => (
                        <Badge key={kw} variant="secondary" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={tracker.isActive}
                      onCheckedChange={() => handleToggle(tracker)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {/* Sources */}
                <div className="flex flex-wrap gap-1">
                  {tracker.sources.length > 0
                    ? tracker.sources.map((sid) => (
                        <Badge key={sid} variant="outline" className="text-xs">
                          {getSourceIcon(sid)} {getSourceLabel(sid)}
                        </Badge>
                      ))
                    : NEWS_SOURCES.slice(0, 4).map((s) => (
                        <Badge key={s.id} variant="outline" className="text-xs">
                          {s.icon} {s.name}
                        </Badge>
                      ))}
                  {tracker.sources.length === 0 && (
                    <span className="text-xs text-muted-foreground">（默认全部源）</span>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {tracker.cronLabel}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {tracker.email}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => handleGenerate(tracker.id)}
                    disabled={generating === tracker.id || !tracker.isActive}
                  >
                    {generating === tracker.id ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 mr-1" />
                    )}
                    立即生成
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(tracker)}>
                    编辑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(tracker.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Briefs History */}
      {briefs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">简报历史</h2>
            <Badge variant="secondary">{briefs.length} 条</Badge>
          </div>
          <div className="space-y-4">
            {briefs.slice(0, 10).map((brief) => (
              <Card key={brief.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{brief.trackerName}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(brief.generatedAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {brief.itemCount} 条新闻
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                    {brief.summary}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTracker ? "编辑追踪器" : "新建追踪器"}
            </DialogTitle>
            <DialogDescription>
              设置追踪关键词、新闻来源和推送频率
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label>追踪名称 *</Label>
              <Input
                placeholder="例如：AI 行业动态"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label>追踪关键词 *</Label>
              <Input
                placeholder="用逗号分隔，例如：AI, 大模型, DeepSeek"
                value={formKeywords}
                onChange={(e) => setFormKeywords(e.target.value)}
              />
              {formKeywords && (
                <div className="flex flex-wrap gap-1">
                  {formKeywords
                    .split(/[,，、\n]+/)
                    .map((k) => k.trim())
                    .filter(Boolean)
                    .map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                </div>
              )}
            </div>

            {/* Sources */}
            <div className="space-y-2">
              <Label>新闻来源（不选则追踪全部）</Label>
              <div className="flex flex-wrap gap-1.5">
                {NEWS_SOURCES.map((source) => (
                  <Badge
                    key={source.id}
                    variant={formSources.includes(source.id) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-indigo-50 transition-colors"
                    onClick={() => toggleSource(source.id)}
                  >
                    {source.icon} {source.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Cron */}
            <div className="space-y-2">
              <Label>更新频率</Label>
              <Select value={formCron} onValueChange={setFormCron}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label>推送邮箱 *</Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formName || !formKeywords.trim() || !formEmail}
              >
                {editingTracker ? "保存修改" : "创建追踪器"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
