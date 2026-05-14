// Supabase 存储层
// 替换原有的 JSON 文件存储，支持 Vercel Serverless 部署

import { supabase } from "./supabase";
import type { Tracker, Brief, NewsItem } from "./data";

// ========== Tracker CRUD ==========

export async function getTrackers(): Promise<Tracker[]> {
  const { data, error } = await supabase
    .from("trackers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    keywords: row.keywords,
    sources: row.sources,
    cronExpression: row.cron_expression,
    cronLabel: row.cron_label,
    email: row.email,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getTracker(id: string): Promise<Tracker | undefined> {
  const { data, error } = await supabase
    .from("trackers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return undefined;

  return {
    id: data.id,
    name: data.name,
    keywords: data.keywords,
    sources: data.sources,
    cronExpression: data.cron_expression,
    cronLabel: data.cron_label,
    email: data.email,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function createTracker(
  data: Omit<Tracker, "id" | "createdAt" | "updatedAt">
): Promise<Tracker> {
  const id = `tracker-${Date.now()}`;

  const { error } = await supabase.from("trackers").insert({
    id,
    name: data.name,
    keywords: data.keywords,
    sources: data.sources,
    cron_expression: data.cronExpression,
    cron_label: data.cronLabel,
    email: data.email,
    is_active: data.isActive,
  });

  if (error) throw new Error(`Failed to create tracker: ${error.message}`);

  const tracker = await getTracker(id);
  return tracker!;
}

export async function updateTracker(
  id: string,
  data: Partial<Tracker>
): Promise<Tracker | undefined> {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.keywords !== undefined) updateData.keywords = data.keywords;
  if (data.sources !== undefined) updateData.sources = data.sources;
  if (data.cronExpression !== undefined) updateData.cron_expression = data.cronExpression;
  if (data.cronLabel !== undefined) updateData.cron_label = data.cronLabel;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.isActive !== undefined) updateData.is_active = data.isActive;

  const { error } = await supabase
    .from("trackers")
    .update(updateData)
    .eq("id", id);

  if (error) throw new Error(`Failed to update tracker: ${error.message}`);

  return getTracker(id);
}

export async function deleteTracker(id: string): Promise<boolean> {
  const { error } = await supabase.from("trackers").delete().eq("id", id);
  if (error) return false;
  return true;
}

// ========== Briefs ==========

export async function getBriefs(trackerId?: string): Promise<Brief[]> {
  let query = supabase
    .from("briefs")
    .select("*")
    .order("generated_at", { ascending: false })
    .limit(100);

  if (trackerId) {
    query = query.eq("tracker_id", trackerId);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    trackerId: row.tracker_id,
    trackerName: row.tracker_name,
    items: (row.items || []) as NewsItem[],
    summary: row.summary,
    generatedAt: row.generated_at,
  }));
}

export async function saveBrief(brief: Brief): Promise<Brief> {
  const { error } = await supabase.from("briefs").insert({
    id: brief.id,
    tracker_id: brief.trackerId,
    tracker_name: brief.trackerName,
    items: brief.items,
    summary: brief.summary,
    item_count: brief.items.length,
  });

  if (error) throw new Error(`Failed to save brief: ${error.message}`);

  return brief;
}
