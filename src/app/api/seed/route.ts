// ============================================================
// Seed API — Initialize demo data for development
// POST /api/seed — Creates demo manager, reports, projects, and sessions
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Check if seed data already exists
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        // Ensure default projects exist for this user
        const projCount = await prisma.project.count({ where: { managerId: firstUser.id } });
        if (projCount === 0) {
          await prisma.project.create({
            data: {
              managerId: firstUser.id,
              name: "🚀 Core Engineering",
              description: "Backend architecture & API syncs",
              color: "#0066cc",
            },
          });
          await prisma.project.create({
            data: {
              managerId: firstUser.id,
              name: "🎨 Design & UX Squad",
              description: "UI/UX component design & research",
              color: "#A855F7",
            },
          });
          await prisma.project.create({
            data: {
              managerId: firstUser.id,
              name: "💼 Operations & Sales",
              description: "Strategy & customer growth check-ins",
              color: "#FF6B35",
            },
          });
        }
      }

      return NextResponse.json({
        message: "Database already seeded",
        seeded: false,
        data: { managerId: firstUser?.id },
      });
    }

    // Create demo manager
    const manager = await prisma.user.create({
      data: {
        email: "alex@example.com",
        name: "Alex Chen",
        defaultThreshold: 60,
        settings: {
          create: {
            talkPctThreshold: 60,
            retentionDays: 180,
          },
        },
      },
    });

    // Create default project workspaces
    const p1 = await prisma.project.create({
      data: {
        managerId: manager.id,
        name: "🚀 Core Engineering",
        description: "Backend architecture & API syncs",
        color: "#0066cc",
      },
    });

    const p2 = await prisma.project.create({
      data: {
        managerId: manager.id,
        name: "🎨 Design & UX Squad",
        description: "UI/UX component design & research",
        color: "#A855F7",
      },
    });

    await prisma.project.create({
      data: {
        managerId: manager.id,
        name: "💼 Operations & Sales",
        description: "Strategy & customer growth check-ins",
        color: "#FF6B35",
      },
    });

    // Create reports (team members)
    const jordan = await prisma.report.create({
      data: { managerId: manager.id, displayName: "Jordan Rivera" },
    });

    const sam = await prisma.report.create({
      data: { managerId: manager.id, displayName: "Sam Patel" },
    });

    // Historical sessions for Jordan
    const jordanSessions = [
      { days: 42, mPct: 68, rPct: 32, mQ: 3, rQ: 7, mT: 4, rT: 1, flagged: true },
      { days: 35, mPct: 62, rPct: 38, mQ: 5, rQ: 6, mT: 3, rT: 2, flagged: true },
      { days: 28, mPct: 55, rPct: 45, mQ: 6, rQ: 8, mT: 3, rT: 3, flagged: false },
      { days: 21, mPct: 52, rPct: 48, mQ: 4, rQ: 9, mT: 2, rT: 3, flagged: false },
      { days: 14, mPct: 48, rPct: 52, mQ: 7, rQ: 5, mT: 2, rT: 4, flagged: false },
      { days: 7,  mPct: 45, rPct: 55, mQ: 8, rQ: 6, mT: 2, rT: 4, flagged: false },
    ];

    for (let idx = 0; idx < jordanSessions.length; idx++) {
      const s = jordanSessions[idx];
      const date = new Date();
      date.setDate(date.getDate() - s.days);

      const session = await prisma.session.create({
        data: {
          managerId: manager.id,
          reportId: jordan.id,
          projectId: idx % 2 === 0 ? p1.id : p2.id,
          occurredAt: date,
          label: `Week ${Math.ceil(s.days / 7)} check-in`,
          rawTranscriptRef: "seed-data",
          status: "processed",
        },
      });

      await prisma.sessionMetrics.create({
        data: {
          sessionId: session.id,
          managerTalkPct: s.mPct,
          reportTalkPct: s.rPct,
          managerQuestions: s.mQ,
          reportQuestions: s.rQ,
          managerInitiatedTopics: s.mT,
          reportInitiatedTopics: s.rT,
          flagged: s.flagged,
          flagReason: s.flagged ? `Manager talk time (${s.mPct}%) exceeds threshold (60%)` : null,
          summary: `Weekly 1:1 covering sprint progress, blockers, and career development. Manager ${s.mPct > 55 ? 'dominated' : 'balanced'} the conversation.`,
        },
      });

      // Add some action items to recent sessions
      if (s.days <= 14) {
        await prisma.actionItem.createMany({
          data: [
            {
              sessionId: session.id,
              owner: "manager",
              text: "Review promotion criteria and share feedback",
              dueHint: "by next 1:1",
              status: s.days === 14 ? "done" : "open",
            },
            {
              sessionId: session.id,
              owner: "report",
              text: "Complete tech spec for new feature",
              dueHint: "by Friday",
              status: s.days === 14 ? "done" : "open",
            },
          ],
        });
      }
    }

    // Historical sessions for Sam
    const samSessions = [
      { days: 40, mPct: 58, rPct: 42, mQ: 4, rQ: 5, mT: 3, rT: 2, flagged: false },
      { days: 33, mPct: 63, rPct: 37, mQ: 3, rQ: 4, mT: 4, rT: 1, flagged: true },
      { days: 26, mPct: 57, rPct: 43, mQ: 5, rQ: 7, mT: 3, rT: 3, flagged: false },
      { days: 19, mPct: 50, rPct: 50, mQ: 6, rQ: 6, mT: 2, rT: 3, flagged: false },
      { days: 12, mPct: 53, rPct: 47, mQ: 5, rQ: 8, mT: 2, rT: 4, flagged: false },
    ];

    for (let idx = 0; idx < samSessions.length; idx++) {
      const s = samSessions[idx];
      const date = new Date();
      date.setDate(date.getDate() - s.days);

      const session = await prisma.session.create({
        data: {
          managerId: manager.id,
          reportId: sam.id,
          projectId: idx % 2 === 0 ? p1.id : p2.id,
          occurredAt: date,
          label: `Week ${Math.ceil(s.days / 7)} sync`,
          rawTranscriptRef: "seed-data",
          status: "processed",
        },
      });

      await prisma.sessionMetrics.create({
        data: {
          sessionId: session.id,
          managerTalkPct: s.mPct,
          reportTalkPct: s.rPct,
          managerQuestions: s.mQ,
          reportQuestions: s.rQ,
          managerInitiatedTopics: s.mT,
          reportInitiatedTopics: s.rT,
          flagged: s.flagged,
          flagReason: s.flagged ? `Manager talk time (${s.mPct}%) exceeds threshold (60%)` : null,
          summary: `Regular sync covering project status and team health. ${s.mPct <= 55 ? 'Good balance' : 'Manager led most topics'}.`,
        },
      });
    }

    return NextResponse.json({
      message: "Database seeded successfully",
      seeded: true,
      data: {
        managerId: manager.id,
        reports: [
          { id: jordan.id, name: "Jordan Rivera" },
          { id: sam.id, name: "Sam Patel" },
        ],
      },
    });
  } catch (error) {
    console.error("[API] POST /seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
