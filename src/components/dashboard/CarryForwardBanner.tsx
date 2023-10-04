"use client";

import { useState, useEffect } from "react";
import { AlertCircle, ChevronDown, ChevronUp, CheckCircle2, Calendar, Clock } from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";

interface OpenItem {
  id: string;
  text: string;
  speakerName: string;
  speakerRole: "manager" | "report";
  dueHint: string | null;
  dueDate: string | null;
  staleSince: string | null;
  staleSessionCount: number;
  createdAt: string;
}

interface CarryForwardBannerProps {
  reportId: string;
  reportName: string;
  managerId: string;
}

/** Word-boundary safe truncation */
function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice) + "…";
}

export default function CarryForwardBanner({
  reportId,
  reportName,
  managerId,
}: CarryForwardBannerProps) {
  const [openItems, setOpenItems] = useState<OpenItem[]>([]);
  const [count, setCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSessionLabel, setLastSessionLabel] = useState<string | null>(null);
  const [lastSessionDate, setLastSessionDate] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId || !managerId) return;
    setIsLoading(true);
    fetch(`/api/reports/${reportId}/open-items?managerId=${managerId}`)
      .then((r) => r.json())
      .then((data) => {
        setCount(data.count || 0);
        setOpenItems(data.items || []);
        setLastSessionLabel(data.lastSessionLabel || null);
        setLastSessionDate(data.lastSessionDate || null);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [reportId, managerId]);

  if (isLoading || count === 0) return null;

  return (
    <div className="rounded-2xl border border-[#F5BEC6] bg-[#FFF4F6] overflow-hidden shadow-sm mb-4 animate-fade-in-up">
      {/* Banner Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#FCE4E8] transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FFE3E8] border border-[#F5BEC6] flex items-center justify-center shrink-0">
            <AlertCircle className="w-4.5 h-4.5 text-[#E06D83]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-extrabold text-[#241830]">
              {count} open item{count !== 1 ? "s" : ""} from last session with {reportName}
            </p>
            {lastSessionDate && (
              <p className="text-[11px] text-[#665578] font-semibold mt-0.5">
                {lastSessionLabel ? `"${lastSessionLabel}" · ` : ""}
                {formatDistanceToNow(parseISO(lastSessionDate), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold text-[#E06D83] bg-[#FFE3E8] border border-[#F5BEC6] px-2.5 py-1 rounded-full uppercase tracking-wider">
            Review
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[#665578] group-hover:text-[#241830]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#665578] group-hover:text-[#241830]" />
          )}
        </div>
      </button>

      {/* Expanded Item List */}
      {isExpanded && (
        <div className="border-t border-[#F5BEC6] divide-y divide-[#F5BEC6]">
          {openItems.map((item) => {
            const isStale = item.staleSessionCount >= 2;
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 px-4 py-3 ${
                  isStale ? "bg-[#FFF0F3] border-l-2 border-l-[#E06D83]" : "bg-white"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-[#E06D83] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#241830] leading-relaxed">
                    {truncate(item.text, 120)}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {/* Speaker badge */}
                    <span
                      className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg border-0"
                      style={{
                        backgroundColor: item.speakerRole === "manager" ? "#FFE3E8" : "#EDE9F6",
                        color: item.speakerRole === "manager" ? "#E06D83" : "#8B6FBD",
                      }}
                    >
                      {item.speakerName} · {item.speakerRole === "manager" ? "Manager" : "Report"}
                    </span>
                    {/* Due date */}
                    {item.dueDate && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#665578] bg-[#FCE4E8] px-2 py-0.5 rounded-lg">
                        <Calendar className="w-3 h-3 text-[#8B6FBD]" />
                        {format(parseISO(item.dueDate), "MMM d")}
                      </span>
                    )}
                    {item.dueHint && !item.dueDate && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#665578] bg-[#FCE4E8] px-2 py-0.5 rounded-lg">
                        <Clock className="w-3 h-3 text-[#8B6FBD]" />
                        {item.dueHint}
                      </span>
                    )}
                    {/* Stale flag */}
                    {isStale && (
                      <span className="text-[10px] font-extrabold text-[#E06D83] bg-[#FFE3E8] px-2 py-0.5 rounded-lg border border-[#F5BEC6] uppercase tracking-wider">
                        Stale · {item.staleSessionCount} sessions
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
