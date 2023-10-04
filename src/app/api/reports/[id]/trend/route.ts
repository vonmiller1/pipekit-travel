// ============================================================
// GET /api/reports/:id/trend — Trend data for charting
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TrendDataPoint } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sessions = await prisma.session.findMany({
      where: {
        reportId: id,
        status: "processed",
      },
      include: {
        metrics: true,
      },
      orderBy: { occurredAt: "asc" },
      take: 20, // last 20 sessions
    });

    const trendData: TrendDataPoint[] = sessions
      .filter((s) => s.metrics)
      .map((s) => ({
        occurredAt: s.occurredAt.toISOString(),
        managerTalkPct: s.metrics!.managerTalkPct,
        reportTalkPct: s.metrics!.reportTalkPct,
        managerQuestions: s.metrics!.managerQuestions,
        reportQuestions: s.metrics!.reportQuestions,
        label: s.label,
      }));

    return NextResponse.json(trendData);
  } catch (error) {
    console.error("[API] GET /reports/:id/trend error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trend data" },
      { status: 500 }
    );
  }
}
