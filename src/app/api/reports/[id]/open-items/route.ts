// ============================================================
// GET /api/reports/:id/open-items
// Returns all open action items from the last N sessions for a report
// Used for carry-forward banner in the ingestion studio
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;
    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get("managerId");

    if (!reportId) {
      return NextResponse.json({ error: "reportId is required" }, { status: 400 });
    }

    // Get the most recent processed session for this report
    const lastSession = await prisma.session.findFirst({
      where: {
        reportId,
        status: "processed",
        ...(managerId ? { managerId } : {}),
      },
      orderBy: { occurredAt: "desc" },
      include: {
        actionItems: {
          where: { status: "open" },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!lastSession || lastSession.actionItems.length === 0) {
      return NextResponse.json({ count: 0, items: [], lastSessionLabel: null });
    }

    return NextResponse.json({
      count: lastSession.actionItems.length,
      items: lastSession.actionItems.map((item) => ({
        id: item.id,
        text: item.text,
        speakerName: item.speakerName,
        speakerRole: item.speakerRole,
        dueHint: item.dueHint,
        dueDate: item.dueDate?.toISOString() ?? null,
        status: item.status,
        staleSince: item.staleSince?.toISOString() ?? null,
        staleSessionCount: item.staleSessionCount,
        createdAt: item.createdAt.toISOString(),
      })),
      lastSessionLabel: lastSession.label,
      lastSessionDate: lastSession.occurredAt.toISOString(),
    });
  } catch (error) {
    console.error("[API] GET /reports/:id/open-items error:", error);
    return NextResponse.json(
      { error: "Failed to fetch open items" },
      { status: 500 }
    );
  }
}
