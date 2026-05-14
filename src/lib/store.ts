// 本地 JSON 文件存储 —— MVP 阶段使用文件系统代替数据库
// 后续可迁移到 Supabase/数据库

import { Tracker, Brief } from "./data";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const TRACKERS_FILE = path.join(DATA_DIR, "trackers.json");
const BRIEFS_FILE = path.join(DATA_DIR, "briefs.json");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJSON<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return defaultValue;
  }
}

async function writeJSON<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ========== Tracker CRUD ==========
export async function getTrackers(): Promise<Tracker[]> {
  return readJSON<Tracker[]>(TRACKERS_FILE, []);
}

export async function getTracker(id: string): Promise<Tracker | undefined> {
  const trackers = await getTrackers();
  return trackers.find((t) => t.id === id);
}

export async function createTracker(
  data: Omit<Tracker, "id" | "createdAt" | "updatedAt">
): Promise<Tracker> {
  const trackers = await getTrackers();
  const tracker: Tracker = {
    ...data,
    id: `tracker-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  trackers.push(tracker);
  await writeJSON(TRACKERS_FILE, trackers);
  return tracker;
}

export async function updateTracker(
  id: string,
  data: Partial<Tracker>
): Promise<Tracker | undefined> {
  const trackers = await getTrackers();
  const index = trackers.findIndex((t) => t.id === id);
  if (index === -1) return undefined;

  trackers[index] = {
    ...trackers[index],
    ...data,
    id, // prevent id override
    updatedAt: new Date().toISOString(),
  };
  await writeJSON(TRACKERS_FILE, trackers);
  return trackers[index];
}

export async function deleteTracker(id: string): Promise<boolean> {
  const trackers = await getTrackers();
  const filtered = trackers.filter((t) => t.id !== id);
  if (filtered.length === trackers.length) return false;
  await writeJSON(TRACKERS_FILE, filtered);
  return true;
}

// ========== Briefs ==========
export async function getBriefs(trackerId?: string): Promise<Brief[]> {
  const all = await readJSON<Brief[]>(BRIEFS_FILE, []);
  if (trackerId) return all.filter((b) => b.trackerId === trackerId);
  return all.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
}

export async function saveBrief(brief: Brief): Promise<Brief> {
  const briefs = await getBriefs();
  briefs.unshift(brief);
  // 只保留最近100条
  const trimmed = briefs.slice(0, 100);
  await writeJSON(BRIEFS_FILE, trimmed);
  return brief;
}
