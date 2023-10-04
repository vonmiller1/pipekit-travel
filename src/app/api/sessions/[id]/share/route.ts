// ============================================================
// POST /api/sessions/:id/share — Generate shareable summary link
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
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

    // Generate explicit opt-in share token & payload
    const shareToken = Buffer.from(`${session.id}:${Date.now()}`).toString("base64url");
    const shareUrl = `${request.nextUrl.origin}/share/${shareToken}`;

    return NextResponse.json({
      message: "Shareable summary link generated (explicit opt-in)",
      shareToken,
      shareUrl,
      summary: session.metrics?.summary || "No summary available",
      reportName: session.report?.displayName || "Team Member",
      occurredAt: session.occurredAt,
      actionItems: session.actionItems.map((a) => ({
        text: a.text,
        owner: a.owner,
        status: a.status,
      })),
    });
  } catch (error) {
    console.error("[API] POST /sessions/:id/share error:", error);
    return NextResponse.json(
      { error: "Failed to generate share link" },
      { status: 500 }
    );
  }
}
