// ============================================================
// 1:1 Balance — In-Memory Job Queue (Mock BullMQ for MVP)
// ============================================================
// In production, replace with BullMQ + Redis.
// This mock provides the same interface for development.

import { LLMAnalysisResult } from "@/lib/types";

type JobHandler = (jobData: TranscriptJobData) => Promise<void>;

export interface TranscriptJobData {
  sessionId: string;
  transcriptPath: string;
  managerSpeakerName: string;
}

interface Job {
  id: string;
  data: TranscriptJobData;
  status: "waiting" | "processing" | "completed" | "failed";
}

class InMemoryQueue {
  private jobs: Map<string, Job> = new Map();
  private handler: JobHandler | null = null;

  registerHandler(handler: JobHandler) {
    this.handler = handler;
  }

  async addJob(data: TranscriptJobData): Promise<string> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const job: Job = { id: jobId, data, status: "waiting" };
    this.jobs.set(jobId, job);

    // Process async immediately (works reliably in Next.js API routes)
    Promise.resolve().then(() => this.processJob(jobId));

    return jobId;
  }

  private async processJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job || !this.handler) return;

    job.status = "processing";
    try {
      await this.handler(job.data);
      job.status = "completed";
    } catch (error) {
      job.status = "failed";
      console.error(`[Queue] Job ${jobId} failed:`, error);
    }
  }

  getJob(jobId: string) {
    return this.jobs.get(jobId) ?? null;
  }
}

// Singleton queue instance
const globalForQueue = globalThis as unknown as {
  transcriptQueue: InMemoryQueue | undefined;
};

export const transcriptQueue =
  globalForQueue.transcriptQueue ?? new InMemoryQueue();

if (process.env.NODE_ENV !== "production") {
  globalForQueue.transcriptQueue = transcriptQueue;
}
