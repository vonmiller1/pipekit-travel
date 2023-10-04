// ============================================================
// GET /api/team-overview — Aggregated reports data for manager
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

    // Fetch manager settings for talk percentage threshold
    const settings = await prisma.managerSettings.findUnique({
      where: { managerId },
    });
    const threshold = settings?.talkPctThreshold ?? 60;

    // Fetch reports with their sessions, metrics, and action items in one efficient query
    const reports = await prisma.report.findMany({
      where: { managerId },
      select: {
        id: true,
        displayName: true,
        sessions: {
          where: {
            status: "processed",
          },
          orderBy: { occurredAt: "desc" },
          select: {
            id: true,
            occurredAt: true,
            metrics: {
              select: {
                managerTalkPct: true,
                reportTalkPct: true,
              },
            },
            actionItems: {
              where: {
                status: "open",
              },
              select: {
                id: true,
                staleSessionCount: true,
                staleSince: true,
                flaggedInaccurate: true,
              },
            },
          },
        },
      },
    });

    const reportOverview = reports.map((report) => {
      const processedSessions = report.sessions;
      const latestSession = processedSessions[0] || null;

      // Extract all open action items that are NOT flagged inaccurate
      const openItems = processedSessions.flatMap((s) => s.actionItems).filter((item) => !item.flaggedInaccurate);
      const openItemCount = openItems.length;

      // Check if any open item has staleSessionCount >= 2 or staleSince set
      const hasStaleItems = openItems.some(
        (item) => (item.staleSessionCount ?? 0) >= 2 || item.staleSince !== null
      );

      // Find maximum stale_since across open items
      let maxStaleSince: Date | null = null;
      openItems.forEach((item) => {
        if (item.staleSince) {
          const date = new Date(item.staleSince);
          if (!maxStaleSince || date > maxStaleSince) {
            maxStaleSince = date;
          }
        }
      });

      const currentTalkRatio = latestSession?.metrics?.managerTalkPct ?? null;
      const isThresholdBreached = currentTalkRatio !== null && currentTalkRatio > threshold;

      // Compile trend data for sparkline (last 5 sessions in chronological order, oldest first)
      const sparklineData = processedSessions
        .slice(0, 5)
        .reverse()
        .map((s) => s.metrics?.managerTalkPct ?? 0);

      const needsAttention = hasStaleItems || isThresholdBreached;

      return {
        id: report.id,
        name: report.displayName,
        lastSessionDate: latestSession?.occurredAt ?? null,
        currentTalkRatio,
        openItemCount,
        hasStaleItems,
        maxStaleSince: maxStaleSince ? (maxStaleSince as Date).toISOString() : null,
        sparkline: sparklineData,
        needsAttention,
        isThresholdBreached,
      };
    });

    // Default Sort: needs attention first, then by longest-since-last-session (oldest met first, null is treated as oldest)
    reportOverview.sort((a, b) => {
      if (a.needsAttention && !b.needsAttention) return -1;
      if (!a.needsAttention && b.needsAttention) return 1;

      // Sort by longest since last session
      if (!a.lastSessionDate && !b.lastSessionDate) return 0;
      if (!a.lastSessionDate) return -1; // null (never met) comes first
      if (!b.lastSessionDate) return 1;

      const timeA = new Date(a.lastSessionDate).getTime();
      const timeB = new Date(b.lastSessionDate).getTime();
      return timeA - timeB; // ascending order to place oldest dates first
    });

    return NextResponse.json({
      reports: reportOverview,
      threshold,
    });
  } catch (error) {
    console.error("[API] GET /team-overview error:", error);
    return NextResponse.json(
      { error: "Failed to load team overview details" },
      { status: 500 }
    );
  }
}
