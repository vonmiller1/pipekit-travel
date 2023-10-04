-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "managerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#8B6FBD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActionItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ActionItem" ("dueHint", "id", "owner", "sessionId", "status", "text") SELECT "dueHint", "id", "owner", "sessionId", "status", "text" FROM "ActionItem";
DROP TABLE "ActionItem";
ALTER TABLE "new_ActionItem" RENAME TO "ActionItem";
CREATE INDEX "ActionItem_sessionId_idx" ON "ActionItem"("sessionId");
CREATE INDEX "ActionItem_status_idx" ON "ActionItem"("status");
CREATE INDEX "ActionItem_speakerRole_idx" ON "ActionItem"("speakerRole");
CREATE TABLE "new_Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "managerId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "projectId" TEXT,
    "occurredAt" DATETIME NOT NULL,
    "label" TEXT,
    "rawTranscriptRef" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Session" ("createdAt", "id", "label", "managerId", "occurredAt", "rawTranscriptRef", "reportId", "status") SELECT "createdAt", "id", "label", "managerId", "occurredAt", "rawTranscriptRef", "reportId", "status" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
CREATE INDEX "Session_managerId_idx" ON "Session"("managerId");
CREATE INDEX "Session_reportId_idx" ON "Session"("reportId");
CREATE INDEX "Session_projectId_idx" ON "Session"("projectId");
CREATE INDEX "Session_status_idx" ON "Session"("status");
CREATE INDEX "Session_occurredAt_idx" ON "Session"("occurredAt");
CREATE TABLE "new_SessionMetrics" (
    "sessionId" TEXT NOT NULL PRIMARY KEY,
    "managerTalkPct" REAL NOT NULL,
    "reportTalkPct" REAL NOT NULL,
    "managerQuestions" INTEGER NOT NULL,
    "reportQuestions" INTEGER NOT NULL,
    "managerInitiatedTopics" INTEGER NOT NULL,
    "reportInitiatedTopics" INTEGER NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "summary" TEXT,
    CONSTRAINT "SessionMetrics_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SessionMetrics" ("flagReason", "flagged", "managerInitiatedTopics", "managerQuestions", "managerTalkPct", "reportInitiatedTopics", "reportQuestions", "reportTalkPct", "sessionId", "summary") SELECT "flagReason", "flagged", "managerInitiatedTopics", "managerQuestions", "managerTalkPct", "reportInitiatedTopics", "reportQuestions", "reportTalkPct", "sessionId", "summary" FROM "SessionMetrics";
DROP TABLE "SessionMetrics";
ALTER TABLE "new_SessionMetrics" RENAME TO "SessionMetrics";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Project_managerId_idx" ON "Project"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_managerId_name_key" ON "Project"("managerId", "name");
