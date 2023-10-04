// ============================================================
// PATCH /api/action-items/:id — Update individual action item
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, flaggedInaccurate, flaggedReason } = body;

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

    const updated = await prisma.actionItem.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[API] PATCH /action-items/:id error:", error);
    return NextResponse.json(
      { error: "Failed to update action item" },
      { status: 500 }
    );
  }
}
