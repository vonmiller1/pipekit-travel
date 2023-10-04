// ============================================================
// GET   /api/action-items — List action items
// PATCH /api/action-items — Update action item status
// POST  /api/action-items — Create a manual action item (Feature 1)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveDueDate } from "@/lib/llm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("reportId");
    const status = searchParams.get("status");
    const sessionId = searchParams.get("sessionId");

    const where: Record<string, unknown> = {};

    if (sessionId) {
      where.sessionId = sessionId;
    } else if (reportId) {
      where.session = { reportId };
    }

    if (status) {
      where.status = status;
    }

    const actionItems = await prisma.actionItem.findMany({
      where,
      include: {
        session: {
          select: {
            occurredAt: true,
            report: { select: { displayName: true } },
          },
        },
      },
      orderBy: { session: { occurredAt: "desc" } },
    });

    return NextResponse.json(actionItems);
  } catch (error) {
    console.error("[API] GET /action-items error:", error);
    return NextResponse.json(
      { error: "Failed to fetch action items" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, flaggedInaccurate, flaggedReason } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const dataToUpdate: any = {};

    if (status !== undefined) {
      const validStatuses = ["open", "done", "carried_over", "dropped"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      dataToUpdate.status = status;
    }

    if (flaggedInaccurate !== undefined) {
      dataToUpdate.flaggedInaccurate = flaggedInaccurate;
      dataToUpdate.flaggedAt = flaggedInaccurate ? new Date() : null;
    }

    if (flaggedReason !== undefined) {
      dataToUpdate.flaggedReason = flaggedReason;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { error: "No fields to update provided." },
        { status: 400 }
      );
    }

    const actionItem = await prisma.actionItem.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(actionItem);
  } catch (error) {
    console.error("[API] PATCH /action-items error:", error);
    return NextResponse.json(
      { error: "Failed to update action item" },
      { status: 500 }
    );
  }
}

// Feature 1: Create a manual action item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, owner, speakerName, speakerRole, text, dueHint } = body;

    if (!sessionId || !owner || !text) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, owner, text" },
        { status: 400 }
      );
    }

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const dueDate = resolveDueDate(dueHint ?? null);

    const item = await prisma.actionItem.create({
      data: {
        sessionId,
        owner: owner,
        speakerName: speakerName || owner,
        speakerRole: speakerRole || owner,
        text: text.trim(),
        dueHint: dueHint || null,
        dueDate,
        status: "open",
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("[API] POST /action-items error:", error);
    return NextResponse.json(
      { error: "Failed to create action item" },
      { status: 500 }
    );
  }
}
