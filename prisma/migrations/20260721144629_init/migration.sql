-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "defaultThreshold" REAL NOT NULL DEFAULT 60,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "managerId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "managerId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "label" TEXT,
    "rawTranscriptRef" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionMetrics" (
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
    CONSTRAINT "SessionMetrics_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "dueHint" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    CONSTRAINT "ActionItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ManagerSettings" (
    "managerId" TEXT NOT NULL PRIMARY KEY,
    "talkPctThreshold" REAL NOT NULL DEFAULT 60,
    "retentionDays" INTEGER NOT NULL DEFAULT 180,
    CONSTRAINT "ManagerSettings_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Report_managerId_idx" ON "Report"("managerId");

-- CreateIndex
CREATE INDEX "Session_managerId_idx" ON "Session"("managerId");

-- CreateIndex
CREATE INDEX "Session_reportId_idx" ON "Session"("reportId");

-- CreateIndex
CREATE INDEX "Session_status_idx" ON "Session"("status");

-- CreateIndex
CREATE INDEX "ActionItem_sessionId_idx" ON "ActionItem"("sessionId");

-- CreateIndex
CREATE INDEX "ActionItem_status_idx" ON "ActionItem"("status");
