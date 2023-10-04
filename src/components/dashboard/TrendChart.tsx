"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { TrendDataPoint, ReportResponse } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { Users } from "lucide-react";

interface TrendChartProps {
  data: TrendDataPoint[];
  threshold: number;
  // Per-report drill-down (Feature #4)
  reports?: ReportResponse[];
  selectedReportId?: string;
  onSelectReport?: (reportId: string) => void;
}

// Custom tooltip for chart
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #F5BEC6",
        borderRadius: "16px",
        boxShadow: "0 10px 25px rgba(139,111,189,0.15)",
        padding: "12px 16px",
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 800, color: "#241830", marginBottom: 6 }}>{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ fontSize: 12, fontWeight: 700, color: entry.color }}>
          {entry.dataKey === "managerTalkPct" ? "Manager Talk" : "Report Talk"}: {entry.value}%
        </p>
      ))}
    </div>
  );
}

export default function TrendChart({
  data,
  threshold,
  reports,
  selectedReportId,
  onSelectReport,
}: TrendChartProps) {
  if (!data || data.length === 0) {
    const SAMPLE_PREVIEW_DATA = [
      { date: "Sync 1", managerTalkPct: 62, reportTalkPct: 38 },
      { date: "Sync 2", managerTalkPct: 54, reportTalkPct: 46 },
      { date: "Sync 3", managerTalkPct: 48, reportTalkPct: 52 },
      { date: "Sync 4", managerTalkPct: 45, reportTalkPct: 55 },
    ];

    return (
      <div className="relative w-full h-72 rounded-3xl bg-gradient-to-b from-[#FFF4F6]/80 to-white border border-[#F5BEC6] overflow-hidden p-6 flex items-center justify-center">
        {/* Ghost background line chart preview */}
        <div className="absolute inset-0 opacity-20 pointer-events-none p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SAMPLE_PREVIEW_DATA}>
              <Line type="monotone" dataKey="managerTalkPct" stroke="#E06D83" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="reportTalkPct" stroke="#8B6FBD" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Floating Glassmorphism Action Card */}
        <div className="relative z-10 text-center max-w-md p-6 rounded-2xl bg-white/90 border border-[#F5BEC6] shadow-xl backdrop-blur-md space-y-3 animate-scale-up">
          <div className="w-10 h-10 rounded-2xl mx-auto flex items-center justify-center bg-[#FCE4E8] border border-[#F5BEC6] text-[#8B6FBD]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-[#241830]">
              Talk-Time &amp; Question Trend Intelligence
            </p>
            <p className="text-xs text-[#665578] font-semibold mt-1 leading-relaxed">
              No sessions analyzed yet for this member. Paste a transcript above or load demo sessions to see multi-week ratios.
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-[#8B6FBD] hover:scale-105 transition-all shadow-md shadow-[#8B6FBD]/30"
          >
            <span>⚡ Load Demo Sessions &amp; Trends</span>
          </button>
        </div>
      </div>
    );
  }

  // Bug 1.3 fix: map BOTH managerTalkPct and reportTalkPct from occurredAt
  // Bug 1.4 fix: always use occurredAt for dates, not createdAt
  const chartData = data.map((d) => {
    let formattedDate = d.occurredAt;
    try {
      formattedDate = format(parseISO(d.occurredAt), "MMM d");
    } catch {}
    return {
      ...d,
      date: formattedDate,
      // Ensure both values are always numbers (not undefined) so the Line renders
      managerTalkPct: typeof d.managerTalkPct === "number" ? d.managerTalkPct : 0,
      reportTalkPct: typeof d.reportTalkPct === "number" ? d.reportTalkPct : 0,
    };
  });

  return (
    <div className="space-y-4">
      {/* Per-report dropdown (Feature #4) */}
      {reports && reports.length > 1 && onSelectReport && (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#8B6FBD] shrink-0" />
          <select
            value={selectedReportId || ""}
            onChange={(e) => onSelectReport(e.target.value)}
            className="text-xs font-bold text-[#241830] bg-[#FFF4F6] border border-[#F5BEC6] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8B6FBD] transition-all cursor-pointer"
          >
            {reports.map((r) => (
              <option key={r.id} value={r.id}>
                {r.displayName}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-[#665578] font-semibold">
            Showing trends for selected report only
          </span>
        </div>
      )}

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F5BEC6" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#665578", fontWeight: 600 }}
              axisLine={{ stroke: "#F5BEC6" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#665578", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value: string) => (
                <span className="text-xs font-bold text-[#241830] ml-1">
                  {value === "managerTalkPct" ? "Manager Talk %" : "Report Talk %"}
                </span>
              )}
              iconType="circle"
              iconSize={8}
            />
            {/* Bug 1.3 fix: ReferenceLine threshold */}
            <ReferenceLine
              y={threshold}
              stroke="#E06D83"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{
                value: `Max ${threshold}%`,
                position: "insideTopRight",
                fill: "#E06D83",
                fontSize: 10,
                fontWeight: 700,
              }}
            />
            {/* Bug 1.3 fix: BOTH Lines must be present and use correct dataKey */}
            <Line
              type="monotone"
              dataKey="managerTalkPct"
              name="managerTalkPct"
              stroke="#E06D83"
              strokeWidth={3}
              dot={{ fill: "#E06D83", r: 5, strokeWidth: 2, stroke: "#FFFFFF" }}
              activeDot={{ r: 7, strokeWidth: 2, stroke: "#FFFFFF" }}
              connectNulls={true}
              isAnimationActive={true}
            />
            <Line
              type="monotone"
              dataKey="reportTalkPct"
              name="reportTalkPct"
              stroke="#8B6FBD"
              strokeWidth={3}
              dot={{ fill: "#8B6FBD", r: 5, strokeWidth: 2, stroke: "#FFFFFF" }}
              activeDot={{ r: 7, strokeWidth: 2, stroke: "#FFFFFF" }}
              connectNulls={true}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
