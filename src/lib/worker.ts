// ============================================================
// 1:1 Balance — Transcript Processing Worker (v2)
// Bug 1.1 fix: stores speakerName + speakerRole independently
// Bug 1.7 (due-date resolution): resolves dueHint → dueDate
// Staleness: increments staleSessionCount for still-open items
// ============================================================

import { prisma } from "@/lib/prisma";
import { transcriptQueue, TranscriptJobData } from "@/lib/queue";
import { analyzeTranscript, resolveDueDate } from "@/lib/llm";
import { decrypt } from "@/lib/encryption";
import * as fs from "fs";

async function processTranscriptJob(jobData: TranscriptJobData) {
  const { sessionId, transcriptPath, managerSpeakerName } = jobData;

  console.log(`[Worker] Processing session ${sessionId}...`);

  try {
    // Read and decrypt transcript
    let transcript: string;
    try {
      const fileData = fs.readFileSync(transcriptPath, "utf-8");
      transcript = decrypt(fileData);
    } catch {
      try {
        transcript = fs.readFileSync(transcriptPath, "utf-8");
      } catch {
        transcript = transcriptPath;
      }
    }

    // Run LLM analysis
    const result = await analyzeTranscript(transcript, managerSpeakerName);

    // Load session + manager settings for threshold
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { manager: { include: { settings: true } } },
    });

    const threshold = session?.manager?.settings?.talkPctThreshold ?? 60;
    const flagged = result.manager_talk_pct > threshold;
    const flagReason = flagged
      ? `Manager talk time (${result.manager_talk_pct}%) exceeds threshold (${threshold}%)`
      : null;

    // Upsert metrics
    await prisma.sessionMetrics.upsert({
      where: { sessionId },
      update: {
        managerTalkPct: result.manager_talk_pct,
        reportTalkPct: result.report_talk_pct,
        managerQuestions: result.manager_questions,
        reportQuestions: result.report_questions,
        managerInitiatedTopics: result.manager_initiated_topics,
        reportInitiatedTopics: result.report_initiated_topics,
        flagged,
        flagReason,
        summary: result.summary,
      },
      create: {
        sessionId,
        managerTalkPct: result.manager_talk_pct,
        reportTalkPct: result.report_talk_pct,
        managerQuestions: result.manager_questions,
        reportQuestions: result.report_questions,
        managerInitiatedTopics: result.manager_initiated_topics,
        reportInitiatedTopics: result.report_initiated_topics,
        flagged,
        flagReason,
        summary: result.summary,
      },
    });

    // Remove old action items for this session
    await prisma.actionItem.deleteMany({ where: { sessionId } });

    // Write new action items with all v2 fields
    if (result.action_items && result.action_items.length > 0) {
      const validItems = result.action_items.filter((item) => item.text && item.owner);
      if (validItems.length > 0) {
        await prisma.actionItem.createMany({
          data: validItems.map((item) => ({
            sessionId,
            owner: item.speakerRole === "manager" ? "manager" : "report",
            speakerName: item.speakerName || managerSpeakerName,
            speakerRole: item.speakerRole === "manager" ? "manager" : "report",
            text: item.text,
            dueHint: item.due_hint || null,
            // Bug fix #7: resolve relative due dates to actual dates
            dueDate: resolveDueDate(item.due_hint),
            status: "open",
          })),
        });
      }
    }

    // Staleness check: mark open action items from strictly earlier sessions
    // as stale if they have been open across 2 or more subsequent sessions.
    if (session?.reportId) {
      const reportId = session.reportId;
      const newSessionOccurredAt = session.occurredAt;

      // Find all open action items for this report from strictly earlier sessions
      const openItems = await prisma.actionItem.findMany({
        where: {
          session: {
            reportId,
            occurredAt: {
              lt: newSessionOccurredAt,
            },
          },
          status: "open",
        },
        include: {
          session: true,
        },
      });

      for (const item of openItems) {
        // Count processed sessions that occurred strictly after this item's session,
        // up to and including the current session.
        const subsequentCount = await prisma.session.count({
          where: {
            reportId,
            occurredAt: {
              gt: item.session.occurredAt,
              lte: newSessionOccurredAt,
            },
            OR: [
              { status: "processed" },
              { id: sessionId },
            ],
          },
        });

        const isStaleNow = subsequentCount >= 2;
        await prisma.actionItem.update({
          where: { id: item.id },
          data: {
            staleSessionCount: subsequentCount,
            staleSince: isStaleNow ? (item.staleSince ?? new Date()) : null,
          },
        });
      }
    }

    // Mark session as processed
    await prisma.session.update({
      where: { id: sessionId },
      data: { status: "processed" },
    });

    console.log(`[Worker] Session ${sessionId} processed successfully.`);
  } catch (error) {
    console.error(`[Worker] Failed to process session ${sessionId}:`, error);
    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: "failed" },
      });
    } catch (dbErr) {
      console.error("[Worker] Failed to update session error status:", dbErr);
    }
  }
}

export function initializeWorker() {
  transcriptQueue.registerHandler(processTranscriptJob);
  console.log("[Worker] Transcript processing worker initialized.");
}
