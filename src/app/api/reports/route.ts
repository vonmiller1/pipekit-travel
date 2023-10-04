// ============================================================
// GET  /api/reports — List reports for a manager
// POST /api/reports — Create a new report (team member)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureUserExists } from "@/lib/prisma";
import { CreateReportRequest } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get("managerId");

    if (!managerId) {
      return NextResponse.json(
        { error: "managerId query parameter is required" },
        { status: 400 }
      );
    }

    await ensureUserExists(managerId);

    const reports = await prisma.report.findMany({
      where: { managerId },
      orderBy: { displayName: "asc" },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("[API] GET /reports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateReportRequest = await request.json();
    const { managerId, displayName } = body;

    if (!managerId || !displayName) {
      return NextResponse.json(
        { error: "Missing required fields: managerId, displayName" },
        { status: 400 }
      );
    }

    await ensureUserExists(managerId);

    const report = await prisma.report.create({
      data: { managerId, displayName: displayName.trim() },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("[API] POST /reports error:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
