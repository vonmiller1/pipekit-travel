-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "speakerName" TEXT NOT NULL DEFAULT '',
    "speakerRole" TEXT NOT NULL DEFAULT 'report',
    "text" TEXT NOT NULL,
    "dueHint" TEXT,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'open',
    "staleSessionCount" INTEGER NOT NULL DEFAULT 0,
    "staleSince" DATETIME,
    "flaggedInaccurate" BOOLEAN NOT NULL DEFAULT false,
    "flaggedReason" TEXT,
    "flaggedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActionItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ActionItem" ("createdAt", "dueDate", "dueHint", "id", "owner", "sessionId", "speakerName", "speakerRole", "staleSessionCount", "staleSince", "status", "text") SELECT "createdAt", "dueDate", "dueHint", "id", "owner", "sessionId", "speakerName", "speakerRole", "staleSessionCount", "staleSince", "status", "text" FROM "ActionItem";
DROP TABLE "ActionItem";
ALTER TABLE "new_ActionItem" RENAME TO "ActionItem";
CREATE INDEX "ActionItem_sessionId_idx" ON "ActionItem"("sessionId");
CREATE INDEX "ActionItem_status_idx" ON "ActionItem"("status");
CREATE INDEX "ActionItem_speakerRole_idx" ON "ActionItem"("speakerRole");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
