-- News Tracker 数据库 Schema
-- 在 Supabase SQL Editor 中执行此脚本

-- 追踪器表
CREATE TABLE IF NOT EXISTS trackers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  sources TEXT[] NOT NULL DEFAULT '{}',
  cron_expression TEXT NOT NULL DEFAULT '0 8,20 * * *',
  cron_label TEXT NOT NULL DEFAULT '每天 8:00 & 20:00',
  email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 简报表
CREATE TABLE IF NOT EXISTS briefs (
  id TEXT PRIMARY KEY,
  tracker_id TEXT NOT NULL REFERENCES trackers(id) ON DELETE CASCADE,
  tracker_name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  summary TEXT NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_briefs_tracker_id ON briefs(tracker_id);
CREATE INDEX IF NOT EXISTS idx_briefs_generated_at ON briefs(generated_at DESC);

-- 开启 RLS（Row Level Security）
ALTER TABLE trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;

-- MVP 阶段：允许所有操作（无用户认证）
CREATE POLICY "Allow all on trackers" ON trackers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on briefs" ON briefs
  FOR ALL USING (true) WITH CHECK (true);
