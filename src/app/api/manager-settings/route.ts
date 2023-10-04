// ============================================================
// GET & PUT /api/manager-settings — Manage manager preferences
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureUserExists } from "@/lib/prisma";

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

    let settings = await prisma.managerSettings.findUnique({
      where: { managerId },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.managerSettings.create({
        data: {
          managerId,
          talkPctThreshold: 60,
          retentionDays: 180,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[API] GET /manager-settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch manager settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { managerId, talkPctThreshold, retentionDays } = body;

    if (!managerId) {
      return NextResponse.json(
        { error: "managerId is required" },
        { status: 400 }
      );
    }

    await ensureUserExists(managerId);

    const updated = await prisma.managerSettings.upsert({
      where: { managerId },
      update: {
        ...(talkPctThreshold !== undefined && { talkPctThreshold: Number(talkPctThreshold) }),
        ...(retentionDays !== undefined && { retentionDays: Number(retentionDays) }),
      },
      create: {
        managerId,
        talkPctThreshold: talkPctThreshold ? Number(talkPctThreshold) : 60,
        retentionDays: retentionDays ? Number(retentionDays) : 180,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[API] PUT /manager-settings error:", error);
    return NextResponse.json(
      { error: "Failed to update manager settings" },
      { status: 500 }
    );
  }
}

// PATCH is an alias for PUT — supports inline threshold editing from dashboard
export { PUT as PATCH };
