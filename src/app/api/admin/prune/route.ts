// ============================================================
// POST /api/admin/prune — Trigger transcript retention cleanup
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { pruneOldTranscripts } from "@/lib/retention";

export async function POST(request: NextRequest) {
  try {
    const prunedCount = await pruneOldTranscripts();
    return NextResponse.json({
      message: "Pruning completed successfully",
      prunedCount,
    });
  } catch (error) {
    console.error("[API] POST /api/admin/prune error:", error);
    return NextResponse.json(
      { error: "Failed to prune transcripts" },
      { status: 500 }
    );
  }
}
