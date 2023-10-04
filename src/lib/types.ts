// ============================================================
// 1:1 Balance — Shared TypeScript Types (v2)
// ============================================================

export type SessionStatus = "queued" | "processed" | "failed";
export type ActionItemOwner = "manager" | "report";
export type ActionItemStatus = "open" | "done" | "carried_over" | "dropped";
export type SpeakerRole = "manager" | "report";

// --- API Response Types ---

export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  defaultThreshold: number;
}

export interface ProjectResponse {
  id: string;
  managerId: string;
  name: string;
  description?: string | null;
  color: string;
  createdAt: string;
}

export interface ReportResponse {
  id: string;
  managerId: string;
  displayName: string;
  createdAt: string;
}

export interface SessionMetricsResponse {
  managerTalkPct: number;
  reportTalkPct: number;
  managerQuestions: number;
  reportQuestions: number;
  managerInitiatedTopics: number;
  reportInitiatedTopics: number;
  flagged: boolean;
  flagReason: string | null;
  summary: string | null;
}

export interface ActionItemResponse {
  id: string;
  sessionId: string;
  owner: ActionItemOwner;
  // v2: explicit speaker identity fields (Bug 1.1 fix)
  speakerName: string;
  speakerRole: SpeakerRole;
  text: string;
  dueHint: string | null;
  dueDate: string | null;   // ISO string resolved from dueHint
  status: ActionItemStatus;
  staleSessionCount: number;
  staleSince: string | null; // ISO string when item went stale
  flaggedInaccurate: boolean;
  flaggedReason: string | null;
  flaggedAt: string | null;
  createdAt: string;
}

export interface SessionResponse {
  id: string;
  managerId: string;
  reportId: string;
  projectId?: string | null;
  occurredAt: string;  // authoritative date field (Bug 1.4 fix)
  label: string | null;
  notes: string | null;  // Feature 3: session notes
  status: SessionStatus;
  createdAt: string;
  metrics: SessionMetricsResponse | null;
  actionItems: ActionItemResponse[];
  report?: ReportResponse;
  project?: ProjectResponse;
}

// --- API Request Types ---

export interface CreateSessionRequest {
  managerId: string;
  reportId: string;
  projectId?: string;
  occurredAt: string;
  transcript: string;
  managerSpeakerName: string;
  label?: string;
  notes?: string;  // Feature 3: session notes
}

export interface CreateProjectRequest {
  managerId: string;
  name: string;
  description?: string;
  color?: string;
}

export interface RenameProjectRequest {
  name: string;
}

export interface CreateReportRequest {
  managerId: string;
  displayName: string;
}

export interface UpdateActionItemRequest {
  status: ActionItemStatus;
}

// Feature 1: Manual action item creation
export interface CreateActionItemRequest {
  sessionId: string;
  owner: ActionItemOwner;
  speakerName: string;
  speakerRole: SpeakerRole;
  text: string;
  dueHint?: string | null;
}

// --- Trend Data ---

export interface TrendDataPoint {
  occurredAt: string;  // always occurredAt, never createdAt
  managerTalkPct: number;
  reportTalkPct: number;
  managerQuestions: number;
  reportQuestions: number;
  label: string | null;
}

// --- LLM Output ---

export interface LLMActionItem {
  owner: ActionItemOwner;
  speakerName: string;  // actual name from transcript
  speakerRole: SpeakerRole; // role resolved from form mapping
  text: string;
  due_hint: string | null;
}

export interface LLMAnalysisResult {
  manager_talk_pct: number;
  report_talk_pct: number;
  manager_questions: number;
  report_questions: number;
  manager_initiated_topics: number;
  report_initiated_topics: number;
  action_items: LLMActionItem[];
  summary: string;
}
