// ============================================================
// GET, PATCH, DELETE /api/sessions/:id — Fetch, Update, or Delete session
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as fs from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        metrics: true,
        actionItems: true,
        report: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("[API] GET /sessions/:id error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reportId, label, occurredAt, notes } = body;

    const dataToUpdate: Record<string, any> = {};
    if (reportId) dataToUpdate.reportId = reportId;
    if (label !== undefined) dataToUpdate.label = label;
    if (occurredAt) dataToUpdate.occurredAt = new Date(occurredAt);
    if (notes !== undefined) dataToUpdate.notes = notes;

    const updatedSession = await prisma.session.update({
      where: { id },
      data: dataToUpdate,
      include: {
        metrics: true,
        actionItems: true,
        report: true,
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("[API] PATCH /sessions/:id error:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find session to clean up disk storage if exists
    const session = await prisma.session.findUnique({ where: { id } });
    if (session?.rawTranscriptRef && fs.existsSync(session.rawTranscriptRef)) {
      try {
        fs.unlinkSync(session.rawTranscriptRef);
      } catch (err) {
        console.warn("[API] Could not delete transcript file:", err);
      }
    }

    // Delete associated metrics & action items first
    await prisma.actionItem.deleteMany({ where: { sessionId: id } });
    await prisma.sessionMetrics.deleteMany({ where: { sessionId: id } });
    await prisma.session.delete({ where: { id } });

    return NextResponse.json({ message: "Session deleted successfully", id });
  } catch (error) {
    console.error("[API] DELETE /sessions/:id error:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
