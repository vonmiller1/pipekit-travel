"use client";

// ============================================================
// Feature 4: Radar Balance Chart
// Uses recharts (already installed) to show 4-axis balance
// ============================================================

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface RadarBalanceChartProps {
  managerTalkPct: number;
  reportTalkPct: number;
  managerQuestions: number;
  reportQuestions: number;
  managerTopics: number;
  reportTopics: number;
  managerCompletions: number; // done action items
  reportCompletions: number;
  reportName?: string;
}

// Normalize to 0-100 scale for radar
function normalize(val: number, max: number): number {
  return max > 0 ? Math.round((val / max) * 100) : 0;
}

export default function RadarBalanceChart({
  managerTalkPct,
  reportTalkPct,
  managerQuestions,
  reportQuestions,
  managerTopics,
  reportTopics,
  managerCompletions,
  reportCompletions,
  reportName = "Report",
}: RadarBalanceChartProps) {
  const maxQ = Math.max(managerQuestions, reportQuestions, 1);
  const maxT = Math.max(managerTopics, reportTopics, 1);
  const maxC = Math.max(managerCompletions, reportCompletions, 1);

  const data = [
    {
      axis: "Talk Time",
      Manager: managerTalkPct,
      Report: reportTalkPct,
    },
    {
      axis: "Questions",
      Manager: normalize(managerQuestions, maxQ),
      Report: normalize(reportQuestions, maxQ),
    },
    {
      axis: "Topics Led",
      Manager: normalize(managerTopics, maxT),
      Report: normalize(reportTopics, maxT),
    },
    {
      axis: "Items Done",
      Manager: normalize(managerCompletions, maxC),
      Report: normalize(reportCompletions, maxC),
    },
  ];

  return (
    <div className="w-full">
      <div className="text-center mb-2">
        <p className="text-[11px] font-extrabold text-[#665578] uppercase tracking-wider">
          Engagement Balance Radar
        </p>
        <p className="text-[10px] text-[#8E7E9E] font-semibold">
          Manager vs {reportName} — current session
        </p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#F5BEC6" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "#665578", fontSize: 11, fontWeight: 700 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "#8E7E9E", fontSize: 9 }}
            axisLine={false}
          />
          <Radar
            name="Manager"
            dataKey="Manager"
            stroke="#E06D83"
            fill="#E06D83"
            fillOpacity={0.25}
            strokeWidth={2}
            dot={{ fill: "#E06D83", r: 3 }}
          />
          <Radar
            name={reportName}
            dataKey="Report"
            stroke="#8B6FBD"
            fill="#8B6FBD"
            fillOpacity={0.2}
            strokeWidth={2}
            dot={{ fill: "#8B6FBD", r: 3 }}
          />
          <Legend
            formatter={(value) => (
              <span style={{ color: "#241830", fontWeight: 700, fontSize: 11 }}>{value}</span>
            )}
          />
          <Tooltip
            contentStyle={{
              background: "#FFFFFF",
              border: "1px solid #F5BEC6",
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 700,
            }}
            formatter={(val) => [`${Number(val ?? 0)}%`, undefined]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
