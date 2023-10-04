// ============================================================
// 1:1 Balance — Transcript Retention Policy Cleanup
// ============================================================

import { prisma } from "@/lib/prisma";
import fs from "fs";

/**
 * Scans all manager sessions and prunes raw transcripts that exceed
 * the manager's retention threshold. Pruned rawTranscriptRef records
 * are set to "pruned".
 */
export async function pruneOldTranscripts(): Promise<number> {
  console.log("[Retention] Running transcript cleanup scan...");
  
  // Fetch all users/managers with settings
  const managers = await prisma.user.findMany({
    include: {
      settings: true,
    },
  });

  let prunedCount = 0;

  for (const manager of managers) {
    const retentionDays = manager.settings?.retentionDays ?? 180;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    console.log(`[Retention] Checking sessions for manager ${manager.email} (Retention: ${retentionDays} days, Cutoff: ${cutoffDate.toISOString()})`);

    // Find all sessions for this manager that occurred before cutoff date
    // and have not been pruned yet.
    const sessionsToPrune = await prisma.session.findMany({
      where: {
        managerId: manager.id,
        occurredAt: {
          lt: cutoffDate,
        },
        NOT: {
          rawTranscriptRef: "pruned",
        },
      },
    });

    for (const session of sessionsToPrune) {
      const filePath = session.rawTranscriptRef;
      
      // If reference is a file path and exists, delete it
      if (filePath && filePath !== "pruned" && filePath !== "seed-data" && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`[Retention] Successfully deleted transcript file: ${filePath}`);
        } catch (err) {
          console.error(`[Retention] Error deleting transcript file ${filePath}:`, err);
        }
      }

      // Mark the database record as pruned
      await prisma.session.update({
        where: { id: session.id },
        data: {
          rawTranscriptRef: "pruned",
        },
      });

      prunedCount++;
    }
  }

  console.log(`[Retention] Cleanup scan complete. Pruned ${prunedCount} sessions.`);
  return prunedCount;
}
