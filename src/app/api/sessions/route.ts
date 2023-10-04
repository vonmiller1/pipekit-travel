// ============================================================
// POST /api/sessions — Submit a transcript for analysis
// GET  /api/sessions — List sessions for a manager
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureUserExists } from "@/lib/prisma";
import { transcriptQueue } from "@/lib/queue";
import { initializeWorker } from "@/lib/worker";
import { CreateSessionRequest } from "@/lib/types";
import { encrypt } from "@/lib/encryption";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

// Initialize worker on first API call
let workerInitialized = false;
function ensureWorker() {
  if (!workerInitialized) {
    initializeWorker();
    workerInitialized = true;
  }
}

export async function POST(request: NextRequest) {
  ensureWorker();

  try {
    const body: CreateSessionRequest = await request.json();
    const { managerId, reportId, projectId, occurredAt, transcript, managerSpeakerName, label, notes } = body;

    if (!managerId || !reportId || !transcript || !managerSpeakerName) {
      return NextResponse.json(
        { error: "Missing required fields: managerId, reportId, transcript, managerSpeakerName" },
        { status: 400 }
      );
    }

    await ensureUserExists(managerId);

    // Save transcript to local storage (mock S3)
    const storageDir = path.join(process.cwd(), "storage", "transcripts");
    fs.mkdirSync(storageDir, { recursive: true });

    const transcriptId = uuidv4();
    const transcriptPath = path.join(storageDir, `${transcriptId}.txt`);
    
    // Encrypt raw transcript at rest
    const encryptedTranscript = encrypt(transcript);
    fs.writeFileSync(transcriptPath, encryptedTranscript, "utf-8");

    // Create session record
    const session = await prisma.session.create({
      data: {
        managerId,
        reportId,
        projectId: projectId || null,
        occurredAt: new Date(occurredAt),
        label: label || null,
        notes: notes || null,
        rawTranscriptRef: transcriptPath,
        status: "queued",
      },
    });

    // Enqueue job for async processing
    await transcriptQueue.addJob({
      sessionId: session.id,
      transcriptPath,
      managerSpeakerName,
    });

    return NextResponse.json(
      {
        id: session.id,
        status: "queued",
        message: "Transcript submitted for analysis",
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("[API] POST /sessions error:", error);
    return NextResponse.json(
      { error: "Failed to submit transcript" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get("managerId");
    const reportId = searchParams.get("reportId");

    if (!managerId) {
      return NextResponse.json(
        { error: "managerId query parameter is required" },
        { status: 400 }
      );
    }

    await ensureUserExists(managerId);

    const where: Record<string, string> = { managerId };
    if (reportId) where.reportId = reportId;

    const sessions = await prisma.session.findMany({
      where,
      include: {
        metrics: true,
        actionItems: true,
        report: true,
        project: true,
      },
      orderBy: { occurredAt: "desc" },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("[API] GET /sessions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
