"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ListChecks,
  Search,
  CheckCircle2,
  Circle,
  XCircle,
  ArrowRightCircle,
  UserCircle,
  Clock,
  LayoutList,
  TrendingUp,
  Plus,
  X,
  AlertCircle,
  SortAsc,
  Flag,
} from "lucide-react";
import type { SessionResponse, ActionItemStatus } from "@/lib/types";

interface CommitmentsHubProps {
  sessions: SessionResponse[];
  onStatusChange: (id: string, status: ActionItemStatus) => void;
  managerId?: string;
}

const STATUS_CONFIG: Record<
  ActionItemStatus,
  { icon: typeof Circle; color: string; bg: string; border: string; label: string; next: ActionItemStatus }
> = {
  open: {
    icon: Circle,
    color: "#E06D83",
    bg: "#FFE3E8",
    border: "#F5BEC6",
    label: "Open",
    next: "done",
  },
  done: {
    icon: CheckCircle2,
    color: "#8B6FBD",
    bg: "#FCE4E8",
    border: "#F5BEC6",
    label: "Done",
    next: "dropped",
  },
  dropped: {
    icon: XCircle,
    color: "#665578",
    bg: "#FFF4F6",
    border: "#F5BEC6",
    label: "Dropped",
    next: "open",
  },
  carried_over: {
    icon: ArrowRightCircle,
    color: "#665578",
    bg: "#FFF4F6",
    border: "#F5BEC6",
    label: "Carried",
    next: "open",
  },
};

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "done", label: "Done" },
  { value: "dropped", label: "Dropped" },
  { value: "flagged", label: "Flagged" },
] as const;

type SortMode = "default" | "dueDate";

// Feature 2: Due date chip logic
function getDueDateInfo(dueDate: string | null, status: ActionItemStatus): {
  label: string;
  color: string;
  bg: string;
  isOverdue: boolean;
} | null {
  if (!dueDate || status === "done" || status === "dropped") return null;
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `${Math.abs(diffDays)}d overdue`, color: "#CC3355", bg: "#FFE3E8", isOverdue: true };
  }
  if (diffDays <= 3) {
    return { label: `${diffDays}d left`, color: "#E06D83", bg: "#FFE3E8", isOverdue: false };
  }
  if (diffDays <= 7) {
    return { label: `${diffDays}d left`, color: "#8B6FBD", bg: "#FCE4E8", isOverdue: false };
  }
  return { label: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }), color: "#665578", bg: "#FFF4F6", isOverdue: false };
}

// Feature 1: Inline add form
function AddItemForm({
  sessions,
  onAdd,
  onClose,
}: {
  sessions: SessionResponse[];
  onAdd: () => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [owner, setOwner] = useState<"manager" | "report">("report");
  const [dueHint, setDueHint] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get all processed sessions for the dropdown
  const processedSessions = useMemo(
    () => sessions.filter((s) => s.status === "processed"),
    [sessions]
  );

  useEffect(() => {
    if (processedSessions.length > 0 && !sessionId) {
      setSessionId(processedSessions[0].id);
    }
    inputRef.current?.focus();
  }, [processedSessions, sessionId]);

  const handleSubmit = async () => {
    if (!text.trim() || !sessionId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/action-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          owner,
          speakerName: owner === "manager" ? "Manager" : "Report",
          speakerRole: owner,
          text: text.trim(),
          dueHint: dueHint.trim() || null,
        }),
      });
      if (res.ok) {
        onAdd();
        onClose();
      }
    } catch (e) {
      console.error("Add item error:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (processedSessions.length === 0) {
    return (
      <div className="p-4 rounded-2xl border border-[#F5BEC6] bg-[#FFF4F6] text-center text-xs font-semibold text-[#665578]">
        Analyze a transcript first to create manual action items.
        <button onClick={onClose} className="ml-2 text-[#8B6FBD] underline">Dismiss</button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl border border-[#8B6FBD] bg-[#FFF4F6] space-y-3 animate-fade-in-up shadow-md shadow-[#8B6FBD]/10">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold text-[#241830]">➕ Add Action Item</span>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#FCE4E8] text-[#665578] transition-all">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onClose(); }}
        placeholder="Describe the commitment or action item..."
        className="w-full h-9 px-3 text-xs font-bold text-[#241830] placeholder-[#8E7E9E] rounded-xl border border-[#F5BEC6] bg-white focus:outline-none focus:ring-2 focus:ring-[#8B6FBD] transition-all"
      />

      <div className="grid grid-cols-3 gap-2">
        {/* Owner */}
        <div className="col-span-1">
          <label className="text-[10px] font-extrabold text-[#665578] uppercase tracking-wider mb-1 block">Owner</label>
          <select
            value={owner}
            onChange={(e) => setOwner(e.target.value as "manager" | "report")}
            className="w-full h-8 px-2 text-[11px] font-bold text-[#241830] rounded-lg border border-[#F5BEC6] bg-white focus:outline-none focus:ring-1 focus:ring-[#8B6FBD]"
          >
            <option value="report" className="bg-white text-[#241830] font-bold">Report</option>
            <option value="manager" className="bg-white text-[#241830] font-bold">Manager</option>
          </select>
        </div>

        {/* Due hint */}
        <div className="col-span-1">
          <label className="text-[10px] font-extrabold text-[#665578] uppercase tracking-wider mb-1 block">Due</label>
          <input
            value={dueHint}
            onChange={(e) => setDueHint(e.target.value)}
            placeholder="e.g. by Friday"
            className="w-full h-8 px-2 text-[11px] font-bold text-[#241830] placeholder-[#8E7E9E] rounded-lg border border-[#F5BEC6] bg-white focus:outline-none focus:ring-1 focus:ring-[#8B6FBD]"
          />
        </div>

        {/* Session anchor */}
        <div className="col-span-1">
          <label className="text-[10px] font-extrabold text-[#665578] uppercase tracking-wider mb-1 block">Session</label>
          <select
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="w-full h-8 px-2 text-[11px] font-bold text-[#241830] rounded-lg border border-[#F5BEC6] bg-white focus:outline-none focus:ring-1 focus:ring-[#8B6FBD]"
          >
            {processedSessions.map((s) => (
              <option key={s.id} value={s.id} className="bg-white text-[#241830] font-bold">
                {s.report?.displayName || "Team"} — {new Date(s.occurredAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1.5 text-[11px] font-bold text-[#665578] hover:text-[#241830] border border-[#F5BEC6] rounded-xl hover:bg-[#FCE4E8] transition-all">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || !sessionId || isSubmitting}
          className="px-4 py-1.5 text-[11px] font-extrabold text-white bg-[#8B6FBD] rounded-xl hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-[#8B6FBD]/30"
        >
          {isSubmitting ? "Adding..." : "Add Item"}
        </button>
      </div>
    </div>
  );
}

export default function CommitmentsHub({
  sessions,
  onStatusChange,
  managerId,
}: CommitmentsHubProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reportFilter, setReportFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const handleToggleFlagged = async (item: any) => {
    const nextFlagged = !item.flaggedInaccurate;
    const defaultReason = nextFlagged ? (item.flaggedReason || "AI mis-extracted") : null;

    try {
      await fetch(`/api/action-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flaggedInaccurate: nextFlagged,
          flaggedReason: defaultReason,
        }),
      });
      // Force page reload or parent refresh
      window.location.reload();
    } catch (e) {
      console.error("Error toggling flag status:", e);
    }
  };

  const handleUpdateFlaggedReason = async (id: string, reason: string) => {
    try {
      await fetch(`/api/action-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flaggedReason: reason,
        }),
      });
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error("Error saving inaccuracy reason:", e);
    }
  };

  const handleBulkStatusChange = (newStatus: ActionItemStatus) => {
    selectedIds.forEach((id) => onStatusChange(id, newStatus));
    setSelectedIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Expose search focus to parent via window event
  useEffect(() => {
    const handler = () => searchRef.current?.focus();
    window.addEventListener("balance:focus-search", handler);
    return () => window.removeEventListener("balance:focus-search", handler);
  }, []);

  const allItems = useMemo(() => {
    const items: Array<{
      id: string;
      text: string;
      owner: string;
      speakerRole: string;
      dueHint?: string | null;
      dueDate?: string | null;
      status: ActionItemStatus;
      sessionId: string;
      reportName: string;
      sessionDate: string;
      flaggedInaccurate?: boolean;
      flaggedReason?: string | null;
      flaggedAt?: string | null;
    }> = [];

    for (const session of sessions) {
      if (session.actionItems?.length) {
        for (const item of session.actionItems) {
          items.push({
            ...item,
            reportName: session.report?.displayName || "Team Member",
            sessionDate: session.occurredAt,
          });
        }
      }
    }
    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, refreshKey]);

  const uniqueReports = useMemo(() => {
    const names = new Set<string>();
    allItems.forEach((i) => names.add(i.reportName));
    return Array.from(names).sort();
  }, [allItems]);

  const filteredItems = useMemo(() => {
    let items = allItems.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        item.text.toLowerCase().includes(q) ||
        item.reportName.toLowerCase().includes(q) ||
        (item.dueHint || "").toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "flagged"
          ? item.flaggedInaccurate
          : (statusFilter === "all" || item.status === statusFilter) && !item.flaggedInaccurate;
      const matchesReport =
        reportFilter === "all" || item.reportName === reportFilter;
      return matchesSearch && matchesStatus && matchesReport;
    });

    if (sortMode === "dueDate") {
      items = [...items].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }

    return items;
  }, [allItems, searchQuery, statusFilter, reportFilter, sortMode]);

  const stats = useMemo(() => ({
    total: allItems.filter((i) => !i.flaggedInaccurate).length,
    open: allItems.filter((i) => i.status === "open" && !i.flaggedInaccurate).length,
    done: allItems.filter((i) => i.status === "done" && !i.flaggedInaccurate).length,
    dropped: allItems.filter((i) => i.status === "dropped" && !i.flaggedInaccurate).length,
    flagged: allItems.filter((i) => i.flaggedInaccurate).length,
  }), [allItems]);

  const completionPct =
    stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const overdueCount = allItems.filter((i) => {
    if (i.status !== "open" || !i.dueDate || i.flaggedInaccurate) return false;
    return new Date(i.dueDate) < new Date();
  }).length;

  const filterStyles: Record<string, { activeClass: string; inactiveClass: string; accentColor: string }> = {
    all: {
      activeClass: "bg-gradient-to-br from-white to-[#FCE4E8] border-[#8B6FBD] shadow-lg shadow-[#8B6FBD]/15 scale-[1.03]",
      inactiveClass: "bg-white/95 border-[#F5BEC6] hover:bg-[#FFF4F6] hover:border-[#8B6FBD]/50",
      accentColor: "#8B6FBD",
    },
    open: {
      activeClass: "bg-gradient-to-br from-white to-[#FFE3E8] border-[#E06D83] shadow-lg shadow-[#E06D83]/15 scale-[1.03]",
      inactiveClass: "bg-white/95 border-[#F5BEC6] hover:bg-[#FFF0F2] hover:border-[#E06D83]/50",
      accentColor: "#E06D83",
    },
    done: {
      activeClass: "bg-gradient-to-br from-white to-[#F5E6FF] border-[#8B6FBD] shadow-lg shadow-[#8B6FBD]/15 scale-[1.03]",
      inactiveClass: "bg-white/95 border-[#F5BEC6] hover:bg-[#FAF5FF] hover:border-[#8B6FBD]/50",
      accentColor: "#8B6FBD",
    },
    dropped: {
      activeClass: "bg-gradient-to-br from-white to-[#F1F3F5] border-[#665578] shadow-lg shadow-[#665578]/15 scale-[1.03]",
      inactiveClass: "bg-white/95 border-[#F5BEC6] hover:bg-gray-50 hover:border-[#665578]/50",
      accentColor: "#665578",
    },
    flagged: {
      activeClass: "bg-gradient-to-br from-white to-[#FFF0E6] border-[#FF6B35] shadow-lg shadow-[#FF6B35]/15 scale-[1.03]",
      inactiveClass: "bg-white/95 border-[#F5BEC6] hover:bg-[#FFF5F0] hover:border-[#FF6B35]/50",
      accentColor: "#FF6B35",
    },
  };

  return (
    <div className="space-y-6">
      {/* STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total", value: stats.total, color: "#241830", icon: LayoutList, filterVal: "all" },
          { label: "Open", value: stats.open, color: "#E06D83", icon: Circle, filterVal: "open" },
          { label: "Completed", value: stats.done, color: "#8B6FBD", icon: CheckCircle2, filterVal: "done" },
          { label: "Dropped", value: stats.dropped, color: "#665578", icon: XCircle, filterVal: "dropped" },
          { label: "Flagged", value: stats.flagged, color: "#FF6B35", icon: Flag, filterVal: "flagged" },
        ].map(({ label, value, color, icon: Icon, filterVal }) => {
          const style = filterStyles[filterVal] || filterStyles.all;
          const isActive = statusFilter === filterVal;
          const tooltipText =
            filterVal === "all" ? "View all commitments" :
            filterVal === "open" ? "View active commitments" :
            filterVal === "done" ? "View completed commitments" :
            filterVal === "dropped" ? "View dropped commitments" :
            "View flagged inaccurate AI items";
          return (
            <div key={label} className="uiverse-tooltip-container">
              <button
                onClick={() => setStatusFilter(filterVal)}
                className={`group text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer w-full ${
                  isActive ? style.activeClass : style.inactiveClass
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#665578]">{label}</p>
                  <Icon className={`w-4 h-4 transition-all duration-300 group-hover:scale-110 ${isActive ? "animate-pulse" : ""}`} style={{ color: style.accentColor }} />
                </div>
                <p className="text-2xl font-extrabold text-[#241830]">{value}</p>
              </button>
              <span className="uiverse-tooltip">{tooltipText}</span>
            </div>
          );
        })}
      </div>

      {/* Overdue warning banner */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl border border-l-4 border-l-[#CC3355] border-[#F5BEC6] bg-gradient-to-r from-[#FFE3E8] to-white/70 animate-fade-in shadow-xs">
          <AlertCircle className="w-4 h-4 text-[#CC3355] shrink-0 animate-bounce" />
          <p className="text-xs font-extrabold text-[#CC3355]">
            {overdueCount} action item{overdueCount > 1 ? "s are" : " is"} overdue — review and update their status.
          </p>
        </div>
      )}

      {/* Completion progress bar */}
      {stats.total > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-[#F5BEC6] bg-white/80 backdrop-blur-md shadow-xs">
          <TrendingUp className="w-4 h-4 text-[#8B6FBD] shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-[#665578]">Completion Rate</span>
              <span style={{ color: completionPct >= 70 ? "#8B6FBD" : "#E06D83" }}>{completionPct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-[#FFF4F6] border border-[#F5BEC6]/80">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${completionPct}%`,
                  background: "linear-gradient(90deg, #C3B1E1 0%, #8B6FBD 100%)",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* MAIN CARD */}
      <Card className="apple-card hover:shadow-lg hover:shadow-[#8B6FBD]/5 transition-all duration-300">
        <CardHeader className="pb-4 pt-6 px-6 border-b border-[#F5BEC6]/60 bg-gradient-to-b from-[#FFF4F6]/50 to-transparent">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-base font-extrabold text-[#241830] flex items-center gap-2.5">
              <ListChecks className="w-5 h-5 text-[#E06D83]" />
              Action Items &amp; Commitments
              {filteredItems.length > 0 && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FCE4E8] text-[#8B6FBD] border border-[#F5BEC6]">
                  {filteredItems.length}
                </span>
              )}
            </CardTitle>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Feature 1: Add Item button */}
              <button
                onClick={() => setShowAddForm((v) => !v)}
                className="flex items-center gap-1.5 h-9 px-3.5 text-[11px] font-extrabold text-white bg-gradient-to-r from-[#8B6FBD] to-[#6E539F] rounded-xl hover:scale-105 active:scale-95 hover:shadow-md hover:shadow-[#8B6FBD]/30 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>

              {/* Feature 2: Sort by due date */}
              <button
                onClick={() => setSortMode((m) => m === "dueDate" ? "default" : "dueDate")}
                title="Sort by due date"
                className={`h-9 w-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
                  sortMode === "dueDate"
                    ? "bg-[#8B6FBD] text-white border-[#8B6FBD]"
                    : "bg-[#FFF4F6] text-[#665578] border-[#F5BEC6] hover:bg-[#FCE4E8]"
                }`}
              >
                <SortAsc className="w-3.5 h-3.5" />
              </button>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#665578] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  ref={searchRef}
                  id="commitments-search"
                  placeholder="Search action items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-52 pl-8 pr-3 text-xs font-bold text-[#241830] placeholder-[#8E7E9E] rounded-xl border border-[#F5BEC6] bg-[#FFF4F6] focus:bg-white focus:border-[#8B6FBD] focus:ring-4 focus:ring-[#8B6FBD]/10 focus:outline-none transition-all duration-300"
                />
              </div>

              {uniqueReports.length > 1 && (
                <select
                  value={reportFilter}
                  onChange={(e) => setReportFilter(e.target.value)}
                  className="h-9 px-3 text-xs font-bold text-[#241830] rounded-xl border border-[#F5BEC6] bg-[#FFF4F6] focus:bg-white focus:border-[#8B6FBD] focus:ring-4 focus:ring-[#8B6FBD]/10 focus:outline-none transition-all duration-300 cursor-pointer"
                >
                  <option value="all" className="bg-white">All Members</option>
                  {uniqueReports.map((r) => (
                    <option key={r} value={r} className="bg-white">{r}</option>
                  ))}
                </select>
              )}

              <div className="flex items-center gap-1 p-1 rounded-xl border border-[#F5BEC6]/85 bg-[#FFF4F6]/80 backdrop-blur-md">
                {FILTER_OPTIONS.map(({ value, label }) => {
                  const isActive = statusFilter === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatusFilter(value)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all duration-300 ${
                        isActive
                          ? "bg-[#8B6FBD] text-white shadow-md shadow-[#8B6FBD]/25 scale-105"
                          : "text-[#665578] hover:text-[#241830] hover:bg-[#FCE4E8]/60"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Feature 1: Inline Add Form */}
          {showAddForm && (
            <div className="mb-4">
              <AddItemForm
                sessions={sessions}
                onAdd={() => { setRefreshKey((k) => k + 1); window.location.reload(); }}
                onClose={() => setShowAddForm(false)}
              />
            </div>
          )}

          {/* Feature 7: Bulk Action Bar */}
          {filteredItems.length > 0 && (
            <div className="flex items-center justify-between mb-4 p-3 rounded-2xl bg-[#FFF4F6] border border-[#F5BEC6]">
              <label className="uiverse-checkbox-container flex items-center gap-2.5 text-xs font-extrabold text-[#241830] select-none">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length > 0 &&
                    selectedIds.length === filteredItems.length
                  }
                  onChange={toggleSelectAll}
                />
                <span className="uiverse-checkmark" />
                <span>Select All ({selectedIds.length} selected)</span>
              </label>

              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 animate-fade-in">
                  <button
                    onClick={() => handleBulkStatusChange("done")}
                    className="px-3 py-1 text-xs font-extrabold bg-[#8B6FBD] text-white rounded-xl shadow-xs hover:scale-105 transition-all"
                  >
                    Mark Done ({selectedIds.length})
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange("dropped")}
                    className="px-3 py-1 text-xs font-extrabold bg-[#FFF4F6] text-[#665578] border border-[#F5BEC6] rounded-xl hover:bg-[#FCE4E8] transition-all"
                  >
                    Mark Dropped
                  </button>
                </div>
              )}
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl flex items-center justify-center bg-[#FCE4E8] border border-[#F5BEC6] text-[#8B6FBD]">
                <ListChecks className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-[#241830]">
                  {searchQuery || statusFilter !== "all" || reportFilter !== "all"
                    ? "No commitments match your current filter"
                    : "No commitments or action items recorded yet"}
                </p>
                <p className="text-xs text-[#665578] font-semibold max-w-xs mx-auto mt-1">
                  {searchQuery || statusFilter !== "all" || reportFilter !== "all"
                    ? "Try resetting your search filters or active report selection."
                    : "Add manual action items or paste a 1:1 transcript to extract commitments automatically."}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                {(searchQuery || statusFilter !== "all" || reportFilter !== "all") ? (
                  <button
                    onClick={() => { setSearchQuery(""); setStatusFilter("all"); setReportFilter("all"); }}
                    className="px-4 py-2 text-xs font-extrabold rounded-xl border border-[#F5BEC6] text-[#8B6FBD] bg-[#FFF4F6] hover:bg-[#FCE4E8] transition-all"
                  >
                    Clear All Filters
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="px-4 py-2 text-xs font-extrabold rounded-xl bg-[#8B6FBD] text-white hover:scale-105 transition-all shadow-md shadow-[#8B6FBD]/30"
                    >
                      + Add Manual Commitment
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await fetch("/api/seed", { method: "POST" });
                          window.location.reload();
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="px-4 py-2 text-xs font-extrabold rounded-xl border border-[#F5BEC6] text-[#8B6FBD] bg-[#FFF4F6] hover:bg-[#FCE4E8] transition-all"
                    >
                      ⚡ Load Demo Data
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.open;
                const Icon = config.icon;
                const sessionDate = new Date(item.sessionDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });

                // Feature 2: due date badge
                const dueBadge = getDueDateInfo(item.dueDate ?? null, item.status);

                return (
                  <div
                    key={item.id}
                    className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-[#F5BEC6] bg-[#FFF4F6] transition-all duration-200 hover:border-[#8B6FBD] ${dueBadge?.isOverdue ? "overdue-item" : ""}`}
                    style={{
                      borderLeftWidth: "4px",
                      borderLeftColor: dueBadge?.isOverdue ? "#CC3355" : config.color,
                    }}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <label className="uiverse-checkbox-container shrink-0 mt-1 select-none">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelectId(item.id)}
                        />
                        <span className="uiverse-checkmark" />
                      </label>

                      <button
                        title={`Click to mark as ${config.next}`}
                        onClick={() => onStatusChange(item.id, config.next)}
                        className="mt-0.5 shrink-0 transition-transform hover:scale-110 active:scale-95"
                      >
                        <Icon className="w-5 h-5" style={{ color: config.color }} />
                      </button>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <p className={`text-sm leading-relaxed font-bold ${
                          item.status === "done" || item.status === "dropped"
                            ? "line-through text-[#665578] opacity-60"
                            : "text-[#241830]"
                        }`}>
                          {item.text}
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#8B6FBD]">
                            <UserCircle className="w-3.5 h-3.5" />
                            {item.reportName}
                          </span>
                          <span className="flex items-center gap-1.5 text-[11px] text-[#665578]">
                            <Clock className="w-3 h-3" />
                            {sessionDate}
                          </span>
                          {/* Feature 2: due hint chip (original) */}
                          {item.dueHint && !dueBadge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#FCE4E8] text-[#8B6FBD] border border-[#F5BEC6]">
                              {item.dueHint}
                            </span>
                          )}
                          {/* Feature 2: computed due date badge */}
                          {dueBadge && (
                            <span
                              className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg border"
                              style={{
                                color: dueBadge.color,
                                background: dueBadge.bg,
                                borderColor: "#F5BEC6",
                              }}
                            >
                              {dueBadge.isOverdue ? "⚠️ " : "📅 "}{dueBadge.label}
                            </span>
                          )}

                          {/* Not accurate flag button */}
                          <button
                            onClick={() => handleToggleFlagged(item)}
                            className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#665578]/60 hover:text-[#E06D83] transition-all ml-auto focus:outline-none cursor-pointer"
                            title="Flag as inaccurate AI extraction"
                          >
                            <Flag className={`w-3.5 h-3.5 ${item.flaggedInaccurate ? "fill-[#E06D83] text-[#E06D83]" : ""}`} />
                            <span>{item.flaggedInaccurate ? "Inaccurate" : "Not accurate"}</span>
                          </button>
                        </div>

                        {/* Inline accuracy feedback input */}
                        {item.flaggedInaccurate && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-[#FFF0F2] border border-[#E06D83]/20 flex flex-col gap-1.5 animate-fade-in text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#E06D83] font-extrabold uppercase tracking-wider">AI Extraction Feedback</span>
                              <button
                                onClick={() => handleToggleFlagged(item)}
                                className="text-[9px] text-[#E06D83] hover:underline font-extrabold"
                              >
                                Clear Flag
                              </button>
                            </div>
                            <input
                              type="text"
                              placeholder="Why is this commitment inaccurate? (e.g. wrong speaker)"
                              defaultValue={item.flaggedReason || ""}
                              onBlur={(e) => handleUpdateFlaggedReason(item.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleUpdateFlaggedReason(item.id, (e.target as HTMLInputElement).value);
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              className="w-full h-7 px-2 text-xs font-bold text-[#241830] placeholder-[#E06D83]/45 rounded-lg border border-[#F5BEC6] bg-white focus:outline-none focus:ring-1 focus:ring-[#E06D83]"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 sm:ml-2">
                      <span
                        className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg border"
                        style={{
                          backgroundColor: item.owner === "manager" ? "#FFE3E8" : "#FCE4E8",
                          color: item.owner === "manager" ? "#E06D83" : "#8B6FBD",
                          borderColor: "#F5BEC6",
                        }}
                      >
                        {item.owner === "manager" ? "👤 Manager" : "👥 Report"}
                      </span>

                      <button
                        onClick={() => onStatusChange(item.id, config.next)}
                        className="text-[11px] font-extrabold px-3 py-1.5 rounded-xl border transition-all duration-200 hover:scale-105"
                        style={{
                          color: config.color,
                          backgroundColor: config.bg,
                          borderColor: config.border,
                        }}
                      >
                        {config.label}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
