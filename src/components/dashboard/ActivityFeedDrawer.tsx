"use client";

import { useMemo } from "react";
import { Bell, CheckCircle2, AlertTriangle, Calendar, X, Sparkles, UserCircle } from "lucide-react";
import type { SessionResponse } from "@/lib/types";

interface ActivityFeedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionResponse[];
  onSelectSession: (session: SessionResponse) => void;
}

export default function ActivityFeedDrawer({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
}: ActivityFeedDrawerProps) {
  const activityItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      timestamp: string;
      type: "session" | "overdue" | "balanced";
      session?: SessionResponse;
    }> = [];

    for (const session of sessions) {
      if (session.status === "processed" && session.metrics) {
        if (session.metrics.flagged) {
          items.push({
            id: `flag-${session.id}`,
            title: `Threshold Alert (${session.metrics.managerTalkPct}% manager talk) in 1:1 with ${session.report?.displayName || "Report"}`,
            timestamp: session.occurredAt,
            type: "overdue",
            session,
          });
        } else {
          items.push({
            id: `bal-${session.id}`,
            title: `Balanced 1:1 session recorded with ${session.report?.displayName || "Report"}`,
            timestamp: session.occurredAt,
            type: "balanced",
            session,
          });
        }
      }
    }

    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [sessions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-white border-l border-[#F5BEC6] h-full shadow-2xl flex flex-col animate-slide-in-right p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#F5BEC6]">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#8B6FBD]" />
            <h2 className="text-base font-extrabold text-[#241830]">Activity &amp; Insights Feed</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#FFF4F6] text-[#665578] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {activityItems.length === 0 ? (
            <div className="py-16 text-center text-xs font-semibold text-[#665578]">
              No activity logs yet. Analyze your first 1:1 session!
            </div>
          ) : (
            activityItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.session) onSelectSession(item.session);
                  onClose();
                }}
                className="w-full text-left p-3.5 rounded-2xl border border-[#F5BEC6] bg-[#FFF4F6] hover:bg-[#FCE4E8] transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-[#8B6FBD] flex items-center gap-1">
                    {item.type === "overdue" ? (
                      <AlertTriangle className="w-3 h-3 text-[#E06D83]" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    )}
                    {item.type === "overdue" ? "Attention Needed" : "Session Insight"}
                  </span>
                  <span className="text-[10px] text-[#665578] font-bold">
                    {new Date(item.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#241830] leading-snug group-hover:text-[#8B6FBD] transition-colors">
                  {item.title}
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
