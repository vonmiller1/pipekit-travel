"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Calendar, CheckCircle2, Clock, Sparkles, ArrowRight, UserCircle, ChevronDown } from "lucide-react";
import type { ReportResponse } from "@/lib/types";

interface OpenItem {
  id: string;
  text: string;
  speakerRole: "manager" | "report";
  dueHint: string | null;
  staleSessionCount: number;
}

interface MeetingPrepModalProps {
  reports: ReportResponse[];
  isOpen: boolean;
  onClose: () => void;
  managerId: string;
  onLoadAgenda: (reportId: string, generatedNotes: string) => void;
}

export default function MeetingPrepModal({
  reports,
  isOpen,
  onClose,
  managerId,
  onLoadAgenda,
}: MeetingPrepModalProps) {
  const [selectedReportId, setSelectedReportId] = useState<string>("");
  const [openItems, setOpenItems] = useState<OpenItem[]>([]);
  const [lastSessionLabel, setLastSessionLabel] = useState<string | null>(null);
  const [lastSessionDate, setLastSessionDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (reports.length > 0 && !selectedReportId) {
      setSelectedReportId(reports[0].id);
    }
  }, [reports, selectedReportId]);

  useEffect(() => {
    if (!selectedReportId || !managerId || !isOpen) return;
    setIsLoading(true);
    fetch(`/api/reports/${selectedReportId}/open-items?managerId=${managerId}`)
      .then((r) => r.json())
      .then((data) => {
        setOpenItems(data.items || []);
        setLastSessionLabel(data.lastSessionLabel || null);
        setLastSessionDate(data.lastSessionDate || null);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedReportId, managerId, isOpen]);

  if (!isOpen) return null;

  const activeReport = reports.find((r) => r.id === selectedReportId);

  const generateAgendaText = () => {
    const lines: string[] = [];
    lines.push(`📋 Pre-Meeting Prep Agenda — 1:1 Sync with ${activeReport?.displayName || "Report"}`);
    lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("1️⃣ Check-in & How are things going this week?");
    lines.push("");

    if (openItems.length > 0) {
      lines.push("2️⃣ Review Action Items from Previous Sessions:");
      openItems.forEach((item) => {
        const due = item.dueHint ? ` (due ${item.dueHint})` : "";
        lines.push(`   • [ ] ${item.text}${due}`);
      });
      lines.push("");
    } else {
      lines.push("2️⃣ Priorities & Goal Progress for this week");
      lines.push("");
    }

    lines.push("3️⃣ Blockers, Dependencies & Needed Support");
    lines.push("4️⃣ Feedback, Wins & Growth Opportunities");
    lines.push("5️⃣ Key Takeaways & New Commitments");

    return lines.join("\n");
  };

  const handleApplyAgenda = () => {
    const agenda = generateAgendaText();
    onLoadAgenda(selectedReportId, agenda);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white border-[#F5BEC6] text-[#241830] sm:max-w-lg rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="space-y-2 pb-4 border-b border-[#F5BEC6]">
          <DialogTitle className="text-base font-extrabold flex items-center gap-2 text-[#241830]">
            <Zap className="w-5 h-5 text-[#8B6FBD]" />
            1:1 Meeting Prep Assistant
          </DialogTitle>
          <p className="text-xs font-semibold text-[#665578]">
            Automated agenda builder that reviews open action items & previous session context.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Direct Report Select */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-[#241830] uppercase tracking-wider flex items-center gap-1.5">
              <UserCircle className="w-3.5 h-3.5 text-[#8B6FBD]" />
              Select Direct Report
            </label>
            <div className="relative">
              <select
                value={selectedReportId}
                onChange={(e) => setSelectedReportId(e.target.value)}
                className="w-full h-11 pl-4 pr-10 text-xs font-extrabold text-[#241830] rounded-2xl border border-[#F5BEC6] bg-[#FFF4F6] hover:bg-[#FCE4E8] appearance-none focus:outline-none focus:ring-2 focus:ring-[#8B6FBD] transition-all cursor-pointer shadow-xs"
              >
                {reports.map((r) => (
                  <option key={r.id} value={r.id} className="bg-white text-[#241830] font-bold py-1">
                    {r.displayName}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-3.5 pointer-events-none text-[#8B6FBD]">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Open Items Summary Preview */}
          <div className="p-4 rounded-2xl bg-[#FFF4F6] border border-[#F5BEC6] space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-[#241830]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#E06D83]" />
                Open Commitments to Review ({openItems.length})
              </span>
              {lastSessionDate && (
                <span className="text-[10px] text-[#665578] font-bold">
                  Last sync: {new Date(lastSessionDate).toLocaleDateString()}
                </span>
              )}
            </div>

            {isLoading ? (
              <p className="text-xs text-[#665578] animate-pulse">Checking previous session items...</p>
            ) : openItems.length === 0 ? (
              <p className="text-xs text-[#8B6FBD] font-bold">✓ All commitments completed! Great job.</p>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {openItems.map((item) => (
                  <div key={item.id} className="text-xs font-semibold text-[#665578] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E06D83]" />
                    <span className="truncate">{item.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between pt-4 border-t border-[#F5BEC6]">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs font-bold text-[#665578] border-[#F5BEC6] hover:bg-[#FCE4E8] rounded-xl h-10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApplyAgenda}
            className="bg-[#8B6FBD] text-white font-extrabold text-xs px-5 rounded-xl h-10 hover:scale-105 shadow-md shadow-[#8B6FBD]/30 flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            Load Prep Agenda into Form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
