"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Calendar, UserCircle, ListChecks, ArrowRight, X, Sparkles } from "lucide-react";
import type { SessionResponse, ReportResponse, ActionItemResponse } from "@/lib/types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionResponse[];
  reports: ReportResponse[];
  onSelectSession: (session: SessionResponse) => void;
  onSelectReport: (reportId: string) => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  sessions,
  reports,
  onSelectSession,
  onSelectReport,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredSessions = sessions.filter(
    (s) =>
      s.label?.toLowerCase().includes(query.toLowerCase()) ||
      s.notes?.toLowerCase().includes(query.toLowerCase()) ||
      s.report?.displayName.toLowerCase().includes(query.toLowerCase())
  );

  const filteredReports = reports.filter((r) =>
    r.displayName.toLowerCase().includes(query.toLowerCase())
  );

  const allActionItems = sessions.flatMap((s) =>
    (s.actionItems || []).map((item) => ({
      ...item,
      session: s,
    }))
  );

  const filteredItems = allActionItems.filter(
    (item) =>
      item.text.toLowerCase().includes(query.toLowerCase()) ||
      item.speakerName.toLowerCase().includes(query.toLowerCase())
  );

  const totalResults =
    filteredSessions.length + filteredReports.length + filteredItems.length;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalResults));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalResults) % Math.max(1, totalResults));
      }
    },
    [onClose, totalResults]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white border border-[#F5BEC6] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F5BEC6] bg-[#FFF4F6]">
          <Search className="w-5 h-5 text-[#8B6FBD]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search sessions, action items, or direct reports... (Esc to close)"
            className="flex-1 bg-transparent text-sm font-bold text-[#241830] placeholder-[#8E7E9E] focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#FCE4E8] text-[#665578] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {totalResults === 0 ? (
            <div className="py-12 text-center text-xs font-semibold text-[#665578]">
              No matching sessions, action items, or direct reports found.
            </div>
          ) : (
            <>
              {/* Direct Reports Section */}
              {filteredReports.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#665578] px-3 py-1">
                    Direct Reports
                  </p>
                  {filteredReports.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => {
                        onSelectReport(report.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#FFF4F6] text-left transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <UserCircle className="w-4 h-4 text-[#8B6FBD]" />
                        <span className="text-xs font-extrabold text-[#241830]">
                          {report.displayName}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#665578] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}

              {/* Sessions Section */}
              {filteredSessions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#665578] px-3 py-1">
                    Sessions & Conversations
                  </p>
                  {filteredSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        onSelectSession(session);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#FFF4F6] text-left transition-colors group"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <Calendar className="w-4 h-4 text-[#E06D83] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-extrabold text-[#241830] truncate">
                            {session.label || "1:1 Session"} —{" "}
                            <span className="text-[#8B6FBD]">
                              {session.report?.displayName || "Report"}
                            </span>
                          </p>
                          {session.notes && (
                            <p className="text-[10px] text-[#8E7E9E] font-medium truncate mt-0.5">
                              {session.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#665578] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}

              {/* Action Items Section */}
              {filteredItems.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#665578] px-3 py-1">
                    Action Items & Commitments
                  </p>
                  {filteredItems.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectSession(item.session);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#FFF4F6] text-left transition-colors group"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <ListChecks className="w-4 h-4 text-[#8B6FBD] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#241830] truncate">
                            {item.text}
                          </p>
                          <p className="text-[10px] text-[#665578] font-semibold mt-0.5">
                            Assigned to {item.speakerName} ({item.speakerRole})
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#665578] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="px-5 py-2.5 bg-[#FFF4F6] border-t border-[#F5BEC6] flex items-center justify-between text-[10px] font-bold text-[#665578]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <div className="flex items-center gap-1 text-[#8B6FBD]">
            <Sparkles className="w-3 h-3" />
            <span>1:1 Balance Studio Search</span>
          </div>
        </div>
      </div>
    </div>
  );
}
