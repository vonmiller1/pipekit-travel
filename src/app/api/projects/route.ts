// ============================================================
// GET & POST /api/projects — Manage Project Workspaces
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureUserExists } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let managerId = searchParams.get("managerId");

    if (!managerId) {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        managerId = firstUser.id;
      } else {
        return NextResponse.json(
          { error: "managerId query parameter is required" },
          { status: 400 }
        );
      }
    }

    await ensureUserExists(managerId);

    let projects = await prisma.project.findMany({
      where: { managerId },
      orderBy: { createdAt: "desc" },
    });

    // Auto-seed default projects if none exist
    if (projects.length === 0) {
      const p1 = await prisma.project.create({
        data: {
          managerId,
          name: "🚀 Core Engineering",
          description: "Backend architecture & API syncs",
          color: "#0066cc",
        },
      });

      const p2 = await prisma.project.create({
        data: {
          managerId,
          name: "🎨 Design & UX Squad",
          description: "UI/UX component design & research",
          color: "#A855F7",
        },
      });

      const p3 = await prisma.project.create({
        data: {
          managerId,
          name: "💼 Operations & Sales",
          description: "Strategy & customer growth check-ins",
          color: "#FF6B35",
        },
      });

      // Link existing sessions to default projects so different projects show different sessions!
      const userSessions = await prisma.session.findMany({
        where: { managerId },
        orderBy: { occurredAt: "desc" },
      });

      for (let i = 0; i < userSessions.length; i++) {
        const assignedProjId = i % 2 === 0 ? p1.id : p2.id;
        await prisma.session.update({
          where: { id: userSessions[i].id },
          data: { projectId: assignedProjId },
        });
      }

      projects = [p1, p2, p3];
    }

    return NextResponse.json(projects);
  } catch (error) {
    console.error("[API] GET /projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { managerId, name, description, color } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    if (!managerId) {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        managerId = firstUser.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            email: "manager@example.com",
            name: "Alex Chen",
            defaultThreshold: 60,
          },
        });
        managerId = newUser.id;
      }
    }

    await ensureUserExists(managerId);

    // Bug 1.5 fix: enforce unique names per manager
    const trimmedName = String(name).trim();
    const existing = await prisma.project.findFirst({
      where: { managerId, name: trimmedName },
    });
    if (existing) {
      return NextResponse.json(
        { error: `A project named "${trimmedName}" already exists. Please choose a different name.` },
        { status: 409 }
      );
    }

    const project = await prisma.project.create({
      data: {
        managerId,
        name: trimmedName,
        description: description ? String(description).trim() : null,
        color: color || "#8B6FBD",
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("[API] POST /projects error:", error);
    return NextResponse.json(
      { error: "Failed to create project", details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/projects — rename a project
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("id");
    const body = await request.json();
    const { managerId, name } = body;

    if (!projectId || !managerId || !name?.trim()) {
      return NextResponse.json(
        { error: "projectId, managerId, and name are required" },
        { status: 400 }
      );
    }

    // Check ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, managerId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check duplicate name
    const trimmedName = name.trim();
    const duplicate = await prisma.project.findFirst({
      where: { managerId, name: trimmedName, NOT: { id: projectId } },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: `A project named "${trimmedName}" already exists.` },
        { status: 409 }
      );
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { name: trimmedName },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[API] PATCH /projects error:", error);
    return NextResponse.json(
      { error: "Failed to rename project", details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/projects?id=<projectId>&managerId=<managerId>
// Unlinks sessions from the project, then deletes it.
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("id");
    const managerId = searchParams.get("managerId");

    if (!projectId || !managerId) {
      return NextResponse.json(
        { error: "id and managerId query parameters are required" },
        { status: 400 }
      );
    }

    // Verify ownership before deleting
    const project = await prisma.project.findFirst({
      where: { id: projectId, managerId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Unlink any sessions that belong to this project (set projectId → null)
    await prisma.session.updateMany({
      where: { projectId },
      data: { projectId: null },
    });

    // Now delete the project
    await prisma.project.delete({ where: { id: projectId } });

    return NextResponse.json({ success: true, deletedId: projectId });
  } catch (error) {
    console.error("[API] DELETE /projects error:", error);
    return NextResponse.json(
      { error: "Failed to delete project", details: String(error) },
      { status: 500 }
    );
  }
}
