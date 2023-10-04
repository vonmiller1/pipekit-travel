"use client";

// ============================================================
// Feature 4: Session Heatmap
// GitHub-style contribution graph for sessions & completion rate
// ============================================================

import { useMemo } from "react";
import type { SessionResponse } from "@/lib/types";

interface SessionHeatmapProps {
  sessions: SessionResponse[];
}

function getWeeksForLastNMonths(n: number) {
  const weeks: Date[][] = [];
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - n);
  start.setDate(1);

  // Start from Sunday of that week
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() - cursor.getDay());

  while (cursor <= today) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

function dateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getIntensity(
  hasSession: boolean,
  completionPct: number
): { bg: string; title: string } {
  if (!hasSession) return { bg: "#F5BEC6", title: "No session" };
  if (completionPct === 0) return { bg: "#E06D83", title: "Session — no items done" };
  if (completionPct < 50) return { bg: "#C3B1E1", title: `${completionPct}% completed` };
  if (completionPct < 80) return { bg: "#8B6FBD", title: `${completionPct}% completed` };
  return { bg: "#5B3FA0", title: `${completionPct}% completed ✓` };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function SessionHeatmap({ sessions }: SessionHeatmapProps) {
  const sessionMap = useMemo(() => {
    const map: Record<string, { count: number; done: number; total: number }> = {};

    for (const s of sessions) {
      if (s.status !== "processed") continue;
      const key = new Date(s.occurredAt).toISOString().split("T")[0];
      const done = s.actionItems.filter((a) => a.status === "done").length;
      const total = s.actionItems.length;

      if (!map[key]) map[key] = { count: 0, done: 0, total: 0 };
      map[key].count++;
      map[key].done += done;
      map[key].total += total;
    }

    return map;
  }, [sessions]);

  const weeks = useMemo(() => getWeeksForLastNMonths(4), []);

  // Month label positions
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, colIdx) => {
    const firstDay = week.find((d) => d <= new Date());
    if (!firstDay) return;
    const m = firstDay.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ label: MONTHS[m], col: colIdx });
      lastMonth = m;
    }
  });

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[360px]">
        {/* Month labels */}
        <div className="flex gap-1 mb-1 pl-6">
          {weeks.map((_, i) => {
            const ml = monthLabels.find((m) => m.col === i);
            return (
              <div key={i} className="w-3 shrink-0 text-[9px] font-bold text-[#665578]">
                {ml?.label || ""}
              </div>
            );
          })}
        </div>

        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1">
            {DAYS.map((d, i) => (
              <div
                key={i}
                className="w-4 h-3 text-[9px] font-bold text-[#8E7E9E] flex items-center justify-center"
              >
                {i % 2 === 1 ? d : ""}
              </div>
            ))}
          </div>

          {/* Grid */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => {
                const key = dateKey(day);
                const data = sessionMap[key];
                const isFuture = day > new Date();

                if (isFuture) {
                  return (
                    <div
                      key={di}
                      className="w-3 h-3 rounded-sm"
                      style={{ background: "transparent" }}
                    />
                  );
                }

                const completionPct =
                  data && data.total > 0
                    ? Math.round((data.done / data.total) * 100)
                    : 0;
                const { bg, title } = getIntensity(!!data, completionPct);

                return (
                  <div
                    key={di}
                    title={`${key}: ${title}${data ? ` (${data.count} session${data.count > 1 ? "s" : ""})` : ""}`}
                    className="w-3 h-3 rounded-sm cursor-default transition-transform hover:scale-125"
                    style={{ background: bg }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 pl-6">
          <span className="text-[9px] font-bold text-[#8E7E9E]">Less</span>
          {["#F5BEC6", "#E06D83", "#C3B1E1", "#8B6FBD", "#5B3FA0"].map((c) => (
            <div key={c} className="w-3 h-3 rounded-sm" style={{ background: c }} />
          ))}
          <span className="text-[9px] font-bold text-[#8E7E9E]">More</span>
        </div>
      </div>
    </div>
  );
}
