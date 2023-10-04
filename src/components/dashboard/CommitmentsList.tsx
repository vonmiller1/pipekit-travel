"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, XCircle, ArrowRightCircle, ChevronDown, ChevronUp, Calendar, Clock, AlertTriangle, Flag } from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import type { ActionItemResponse, ActionItemStatus } from "@/lib/types";

interface CommitmentsListProps {
  actionItems: ActionItemResponse[];
  onStatusChange?: (id: string, status: ActionItemStatus) => void;
}

const statusConfig: Record<
  ActionItemStatus,
  { icon: typeof Circle; color: string; label: string }
> = {
  open: { icon: Circle, color: "#E06D83", label: "Open" },
  done: { icon: CheckCircle2, color: "#8B6FBD", label: "Done" },
  dropped: { icon: XCircle, color: "#665578", label: "Dropped" },
  carried_over: { icon: ArrowRightCircle, color: "#665578", label: "Carried" },
};

/** Word-boundary safe truncation — Bug 1.2 fix */
function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  const truncated = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return truncated + "…";
}

const TRUNCATE_LIMIT = 100;

export default function CommitmentsList({
  actionItems,
  onStatusChange,
}: CommitmentsListProps) {
  const [localItems, setLocalItems] = useState<ActionItemResponse[]>(actionItems);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLocalItems(actionItems);
  }, [actionItems]);

  if (localItems.length === 0) {
    return (
      <div className="text-center py-6 text-[#665578] text-xs font-bold">
        No action items extracted yet.
      </div>
    );
  }

  const handleCycleStatus = (item: ActionItemResponse) => {
    const cycle: ActionItemStatus[] = ["open", "done", "dropped"];
    const currentIdx = cycle.indexOf(item.status);
    const nextStatus = cycle[(currentIdx + 1) % cycle.length];
    setLocalItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i))
    );
    onStatusChange?.(item.id, nextStatus);
  };

  const handleToggleFlagged = async (item: ActionItemResponse) => {
    const nextFlagged = !item.flaggedInaccurate;
    const defaultReason = nextFlagged ? (item.flaggedReason || "AI mis-extracted") : null;

    setLocalItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              flaggedInaccurate: nextFlagged,
              flaggedReason: defaultReason,
            }
          : i
      )
    );

    try {
      await fetch(`/api/action-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flaggedInaccurate: nextFlagged,
          flaggedReason: defaultReason,
        }),
      });
    } catch (e) {
      console.error("Error toggling flag status:", e);
    }
  };

  const handleUpdateFlaggedReason = async (id: string, reason: string) => {
    setLocalItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, flaggedReason: reason } : i))
    );

    try {
      await fetch(`/api/action-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flaggedReason: reason,
        }),
      });
    } catch (e) {
      console.error("Error saving inaccuracy reason:", e);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-2.5">
      {localItems.map((item) => {
        const config = statusConfig[item.status] || statusConfig.open;
        const Icon = config.icon;
        const isExpanded = expandedIds.has(item.id);
        const needsTruncation = item.text.length > TRUNCATE_LIMIT;
        const displayText = isExpanded || !needsTruncation
          ? item.text
          : truncateText(item.text, TRUNCATE_LIMIT);

        // Bug 1.1 fix: use speakerName and speakerRole directly, not infer from owner
        const speakerName = item.speakerName || (item.owner === "manager" ? "Manager" : "Report");
        const speakerRole = item.speakerRole || item.owner;

        // Staleness indicator
        const isStale = (item.staleSessionCount ?? 0) >= 2 || !!item.staleSince;

        // Due date display
        const hasDueDate = !!item.dueDate;
        const hasDueHint = !!item.dueHint && !hasDueDate;

        return (
          <div
            key={item.id}
            className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all group shadow-xs ${
              isStale
                ? "bg-[#FFF0F3] border-[#E06D83]/30 border-l-2 border-l-[#E06D83]"
                : "bg-[#FFF4F6] border-[#F5BEC6] hover:border-[#8B6FBD]"
            }`}
          >
            <button
              onClick={() => handleCycleStatus(item)}
              className="mt-0.5 shrink-0 transition-transform hover:scale-115 focus:outline-none"
              title={`Click to mark as ${
                item.status === "open" ? "Done" : item.status === "done" ? "Dropped" : "Open"
              }`}
            >
              <Icon className="w-4.5 h-4.5" style={{ color: config.color }} />
            </button>

            <div className="flex-1 min-w-0 space-y-1">
              {/* Text — Bug 1.2 fix: word-boundary truncation with expand */}
              <p
                className={`text-xs sm:text-sm leading-relaxed transition-all ${
                  item.status === "done"
                    ? "line-through text-[#665578] font-medium"
                    : item.status === "dropped"
                    ? "line-through text-[#665578] opacity-60"
                    : "text-[#241830] font-bold"
                }`}
              >
                {displayText}
              </p>

              {/* Expand/collapse toggle */}
              {needsTruncation && (
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="flex items-center gap-1 text-[10px] font-extrabold text-[#8B6FBD] hover:underline mt-0.5"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Show more
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                {/* Bug 1.1 fix: Speaker badge uses speakerName + speakerRole, not inferred */}
                <Badge
                  variant="outline"
                  className="text-[10px] px-2.5 py-0.5 font-extrabold border-0 rounded-lg"
                  style={{
                    backgroundColor: speakerRole === "manager" ? "#FFE3E8" : "#EDE9F6",
                    color: speakerRole === "manager" ? "#E06D83" : "#8B6FBD",
                  }}
                >
                  {speakerName} · {speakerRole === "manager" ? "Manager" : "Report"}
                </Badge>

                {/* Bug 7 fix: resolved due_date shown as real date */}
                {hasDueDate && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[#665578] bg-[#FCE4E8] px-2 py-0.5 rounded-lg border border-[#F5BEC6]">
                    <Calendar className="w-3 h-3 text-[#8B6FBD]" />
                    {format(parseISO(item.dueDate!), "MMM d")}
                  </span>
                )}
                {hasDueHint && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[#665578] bg-[#FCE4E8] px-2 py-0.5 rounded-lg border border-[#F5BEC6]">
                    <Clock className="w-3 h-3 text-[#8B6FBD]" />
                    {item.dueHint}
                  </span>
                )}

                {/* Staleness flag */}
                {isStale && (
                  <span className="flex items-center gap-1 text-[10px] font-extrabold text-[#E06D83] bg-[#FFE3E8] px-2 py-0.5 rounded-lg border border-[#F5BEC6] uppercase tracking-wider">
                    <AlertTriangle className="w-3 h-3" />
                    Stale
                  </span>
                )}

                {/* Bug 1.6 fix: relative timestamp */}
                {item.createdAt && (
                  <span className="text-[10px] text-[#665578] font-semibold" title={item.createdAt}>
                    {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}
                  </span>
                )}

                <span
                  className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md"
                  style={{ color: config.color, backgroundColor: `${config.color}15` }}
                >
                  {config.label}
                </span>

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
        );
      })}
    </div>
  );
}
