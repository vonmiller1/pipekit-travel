"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Logo from "@/components/common/Logo";
import CommitmentsHub from "@/components/dashboard/CommitmentsHub";
import { secureStorage } from "@/lib/secureStorage";
import { ListChecks, ArrowLeft, Loader2, CheckCircle2, Clock, Sparkles } from "lucide-react";
import type { SessionResponse, ActionItemStatus } from "@/lib/types";

const MANAGER_ID_KEY = "balance_manager_id";

export default function CommitmentsPage() {
  const [managerId, setManagerId] = useState("");
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize: load or seed manager ID
  useEffect(() => {
    async function initManager() {
      try {
        let mId = secureStorage.getItem(MANAGER_ID_KEY) || "";

        if (!mId) {
          const seedRes = await fetch("/api/seed", { method: "POST" });
          const seedData = await seedRes.json();
          if (seedData.data?.managerId) {
            mId = seedData.data.managerId;
            secureStorage.setItem(MANAGER_ID_KEY, mId);
          }
        }

        if (mId) {
          setManagerId(mId);
          const sessionsRes = await fetch(`/api/sessions?managerId=${mId}`);
          const sessionsData = await sessionsRes.json();
          if (Array.isArray(sessionsData)) {
            setSessions(sessionsData);
          }
        }
      } catch (err) {
        console.error("Commitments init error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    initManager();
  }, []);

  const loadSessions = useCallback(() => {
    if (!managerId) return;
    fetch(`/api/sessions?managerId=${managerId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSessions(data);
        }
      })
      .catch(console.error);
  }, [managerId]);

  // Handle action item status update with optimistic UI updates!
  const handleActionItemStatusChange = async (
    id: string,
    nextStatus: ActionItemStatus
  ) => {
    // 1. Optimistic update
    setSessions((prevSessions) =>
      prevSessions.map((session) => ({
        ...session,
        actionItems: (session.actionItems || []).map((item) =>
          item.id === id ? { ...item, status: nextStatus } : item
        ),
      }))
    );

    // 2. Send PATCH to API
    try {
      const res = await fetch(`/api/action-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        // Revert on failure
        loadSessions();
      }
    } catch (error) {
      console.error("Update action item error:", error);
      loadSessions();
    }
  };

  const allActionItems = useMemo(() => {
    return sessions.flatMap((s) => s.actionItems || []);
  }, [sessions]);

  const openCount = useMemo(
    () => allActionItems.filter((a) => a.status === "open").length,
    [allActionItems]
  );
  const doneCount = useMemo(
    () => allActionItems.filter((a) => a.status === "done").length,
    [allActionItems]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Logo size="md" />
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold text-[#1d1d1f] bg-white/5 border border-[#e0e0e0] hover:border-white/20 hover:text-white transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 text-[#0066cc]" />
          Back to Dashboard
        </Link>
      </div>

      {/* Commitments Page Hero */}
      <div
        className="p-6 sm:p-8 rounded-3xl border border-[#e0e0e0] relative overflow-hidden space-y-6"
        style={{
          background: "linear-gradient(160deg, #0C1524 0%, #070D18 100%)",
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.8)",
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6B35]/15 border border-[#FF6B35]/30 text-[#FF6B35] text-xs font-extrabold mb-3">
              <ListChecks className="w-3.5 h-3.5" />
              <span>Action Items & Follow-Through Studio</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Commitments & Action Items Hub
            </h1>
            <p className="text-xs sm:text-sm text-[#1d1d1f] font-medium max-w-2xl mt-1">
              Track agreed next steps, review commitments by direct report, and cycle item statuses to guarantee accountability across 1:1 meetings.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/5 border border-[#e0e0e0] px-5 py-3.5 rounded-2xl backdrop-blur-md text-center min-w-[120px]">
              <p className="text-[10px] font-extrabold text-[#7a7a7a] uppercase tracking-wider">Open Tasks</p>
              <p className="text-2xl font-extrabold text-[#FF6B35]">{openCount}</p>
            </div>
            <div className="bg-white/5 border border-[#e0e0e0] px-5 py-3.5 rounded-2xl backdrop-blur-md text-center min-w-[120px]">
              <p className="text-[10px] font-extrabold text-[#7a7a7a] uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-extrabold text-[#0066cc]">{doneCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Commitments Board */}
      <CommitmentsHub sessions={sessions} onStatusChange={handleActionItemStatusChange} />
    </div>
  );
}
