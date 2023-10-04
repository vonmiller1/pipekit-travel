// ============================================================
// GET /api/reports/:id/sessions — List sessions for one report
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sessions = await prisma.session.findMany({
      where: { reportId: id },
      include: {
        metrics: true,
        actionItems: true,
        report: true,
      },
      orderBy: { occurredAt: "desc" },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("[API] GET /reports/:id/sessions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions for report" },
      { status: 500 }
    );
  }
}
