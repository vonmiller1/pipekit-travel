"use client";

import { useState } from "react";
import { MessageSquare, Calendar, ChevronRight, AlertTriangle, CheckCircle2, Trash2, ArrowLeftRight, Check, X, Clock } from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import type { SessionResponse } from "@/lib/types";

interface SessionListProps {
  sessions: SessionResponse[];
  selectedSessionId: string | null;
  onSelectSession: (session: SessionResponse) => void;
  onEditSession?: (session: SessionResponse) => void;
  onDeleteSession?: (sessionId: string) => void;
  selectedReportId: string;
  reportNameFilter?: string;
}

export default function SessionList({
  sessions,
  selectedSessionId,
  onSelectSession,
  onEditSession,
  onDeleteSession,
  selectedReportId,
  reportNameFilter,
}: SessionListProps) {
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const filteredSessions = sessions.filter(
    (s) => s.reportId === selectedReportId
  );

  if (filteredSessions.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-gradient-to-b from-[#FFF4F6] to-white border border-[#F5BEC6] text-center space-y-3.5 my-2">
        <div className="w-10 h-10 rounded-2xl mx-auto flex items-center justify-center bg-[#FCE4E8] border border-[#F5BEC6] text-[#8B6FBD]">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-extrabold text-[#241830]">
            No 1:1 sessions recorded for {reportNameFilter || "this report"} yet
          </p>
          <p className="text-[11px] text-[#665578] font-semibold mt-1 max-w-xs mx-auto">
            Paste a meeting transcript in the editor on the left, or load pre-populated demo sessions.
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            try {
              await fetch("/api/seed", { method: "POST" });
              window.location.reload();
            } catch (e) {
              console.error(e);
            }
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold text-[#8B6FBD] bg-[#FCE4E8] border border-[#F5BEC6] hover:bg-[#8B6FBD] hover:text-white transition-all shadow-xs"
        >
          <span>⚡ Load Sample 1:1 Session</span>
        </button>
      </div>
    );
  }

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();

    if (confirmingDeleteId === id) {
      onDeleteSession?.(id);
      setConfirmingDeleteId(null);
    } else {
      setConfirmingDeleteId(id);
      setTimeout(() => {
        setConfirmingDeleteId((prev) => (prev === id ? null : prev));
      }, 4000);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setConfirmingDeleteId(null);
  };

  const handleEdit = (e: React.MouseEvent, session: SessionResponse) => {
    e.stopPropagation();
    e.preventDefault();
    onEditSession?.(session);
  };

  return (
    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
      {filteredSessions.map((session) => {
        const isSelected = session.id === selectedSessionId;
        const isConfirming = confirmingDeleteId === session.id;
        const metrics = session.metrics;
        // Bug 1.4 fix: use occurredAt as the single authoritative date
        // Bug 1.6 fix: show date + time, not date-only
        const occurredDate = parseISO(session.occurredAt);
        const formattedDate = format(occurredDate, "MMM d, yyyy");
        const formattedTime = format(occurredDate, "h:mm a");
        const relativeTime = formatDistanceToNow(occurredDate, { addSuffix: true });

        return (
          <div
            key={session.id}
            onClick={() => onSelectSession(session)}
            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer group ${
              isSelected
                ? "bg-[#FCE4E8] border-[#8B6FBD] shadow-sm shadow-[#8B6FBD]/10"
                : "bg-white border-[#F5BEC6] hover:border-[#8B6FBD] hover:bg-[#FFF4F6]"
            }`}
          >
            <div className="space-y-1 flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-[#241830]">
                  {session.label || "1:1 Meeting"}
                </span>
                {metrics?.flagged ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#E06D83] bg-[#FFE3E8] border border-[#F5BEC6] px-2 py-0.5 rounded-full uppercase">
                    <AlertTriangle className="w-3 h-3" />
                    Over 60%
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8B6FBD] bg-[#FCE4E8] border border-[#F5BEC6] px-2 py-0.5 rounded-full uppercase">
                    <CheckCircle2 className="w-3 h-3" />
                    Balanced
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-[11px] text-[#665578] font-semibold flex-wrap">
                <span className="flex items-center gap-1" title={relativeTime}>
                  <Calendar className="w-3 h-3 text-[#8B6FBD]" />
                  {formattedDate}
                  <Clock className="w-3 h-3 text-[#C3B1E1] ml-1" />
                  <span className="text-[#8B6FBD]">{formattedTime}</span>
                </span>
                {metrics && (
                  <span>
                    Manager: <strong style={{ color: "#E06D83" }}>{metrics.managerTalkPct}%</strong> | Report: <strong style={{ color: "#8B6FBD" }}>{metrics.reportTalkPct}%</strong>
                  </span>
                )}
              </div>
              {session.notes && (
                <p className="text-[10px] text-[#8E7E9E] font-semibold truncate italic mt-0.5 max-w-[220px]">
                  📝 {session.notes}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isConfirming ? (
                <div className="flex items-center gap-1 bg-[#FFE3E8] border border-[#F5BEC6] p-1 rounded-xl animate-fade-in-up">
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(e, session.id)}
                    className="px-2 py-1 bg-[#E06D83] text-white font-extrabold text-[10px] rounded-lg shadow-sm flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    className="p-1 text-[#665578] hover:text-[#241830] rounded-lg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  {onEditSession && (
                    <button
                      type="button"
                      onClick={(e) => handleEdit(e, session)}
                      title="Move / Reassign Session"
                      className="p-1.5 rounded-xl bg-[#FFF4F6] hover:bg-[#FCE4E8] border border-[#F5BEC6] text-[#8B6FBD] font-bold transition-all hover:scale-105"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDeleteSession && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, session.id)}
                      title="Delete Session"
                      className="p-1.5 rounded-xl bg-[#FFE3E8] hover:bg-[#F5BEC6] border border-[#F5BEC6] text-[#E06D83] font-bold transition-all hover:scale-105"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
              <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? "text-[#8B6FBD] translate-x-1" : "text-[#665578]"}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
