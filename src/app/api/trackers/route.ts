import { NextResponse } from "next/server";
import { getTrackers, createTracker, updateTracker, deleteTracker } from "@/lib/store";

// GET /api/trackers
export async function GET() {
  const trackers = await getTrackers();
  return NextResponse.json(trackers);
}

// POST /api/trackers
export async function POST(request: Request) {
  const body = await request.json();
  const { name, keywords, sources, cronExpression, cronLabel, email } = body;

  if (!name || !keywords?.length || !email) {
    return NextResponse.json(
      { error: "名称、关键词和邮箱为必填项" },
      { status: 400 }
    );
  }

  const tracker = await createTracker({
    name,
    keywords,
    sources: sources || [],
    cronExpression: cronExpression || "0 8,20 * * *",
    cronLabel: cronLabel || "每天 8:00 & 20:00",
    email,
    isActive: true,
  });

  return NextResponse.json(tracker, { status: 201 });
}

// PUT /api/trackers
export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const tracker = await updateTracker(id, data);
  if (!tracker) {
    return NextResponse.json({ error: "Tracker not found" }, { status: 404 });
  }

  return NextResponse.json(tracker);
}

// DELETE /api/trackers?id=xxx
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const deleted = await deleteTracker(id);
  if (!deleted) {
    return NextResponse.json({ error: "Tracker not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
