"use client";

// ============================================================
// Feature 5: Report Health Score Card
// Computes a 0-100 health score per direct report
// ============================================================

import { useMemo } from "react";
import { Heart, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import type { SessionResponse } from "@/lib/types";

interface ReportHealthCardProps {
  sessions: SessionResponse[];
  threshold: number;
  reportName?: string;
}

interface HealthBreakdown {
  label: string;
  score: number;
  max: number;
  description: string;
  color: string;
}

function computeHealth(
  sessions: SessionResponse[],
  threshold: number
): {
  total: number;
  grade: "Excellent" | "Good" | "Needs Attention" | "At Risk";
  gradeColor: string;
  breakdown: HealthBreakdown[];
} {
  const processed = sessions.filter((s) => s.metrics);

  if (processed.length === 0) {
    return {
      total: 0,
      grade: "At Risk",
      gradeColor: "#E06D83",
      breakdown: [],
    };
  }

  // 1. Talk Ratio (0–40 pts): how close to threshold on average
  const avgTalkPct =
    processed.reduce((a, s) => a + (s.metrics?.managerTalkPct || 0), 0) / processed.length;
  const talkDeviation = Math.abs(avgTalkPct - threshold);
  const talkScore = Math.max(0, 40 - talkDeviation * 1.5);

  // 2. Question balance (0–25 pts)
  const avgMgrQ =
    processed.reduce((a, s) => a + (s.metrics?.managerQuestions || 0), 0) / processed.length;
  const avgRptQ =
    processed.reduce((a, s) => a + (s.metrics?.reportQuestions || 0), 0) / processed.length;
  const totalQ = avgMgrQ + avgRptQ;
  const reportQPct = totalQ > 0 ? avgRptQ / totalQ : 0;
  // Ideal: report asks 40–60% of questions
  const qDeviation = Math.abs(reportQPct - 0.5);
  const qScore = Math.max(0, 25 - qDeviation * 50);

  // 3. Commitment completion rate (0–25 pts)
  const allItems = processed.flatMap((s) => s.actionItems);
  const doneItems = allItems.filter((a) => a.status === "done").length;
  const totalItems = allItems.filter((a) => a.status !== "dropped").length;
  const completionRate = totalItems > 0 ? doneItems / totalItems : 0.5;
  const completionScore = Math.round(completionRate * 25);

  // 4. Session frequency (0–10 pts): at least 2 sessions/month = good
  const daysSince =
    processed.length > 0
      ? (Date.now() - new Date(processed[0].occurredAt).getTime()) / (1000 * 60 * 60 * 24)
      : 999;
  const freq = processed.length / Math.max((daysSince || 1) / 30, 1); // sessions per month
  const freqScore = Math.min(10, Math.round(freq * 5));

  const total = Math.round(talkScore + qScore + completionScore + freqScore);

  let grade: "Excellent" | "Good" | "Needs Attention" | "At Risk";
  let gradeColor: string;
  if (total >= 80) {
    grade = "Excellent";
    gradeColor = "#5B3FA0";
  } else if (total >= 60) {
    grade = "Good";
    gradeColor = "#8B6FBD";
  } else if (total >= 40) {
    grade = "Needs Attention";
    gradeColor = "#E06D83";
  } else {
    grade = "At Risk";
    gradeColor = "#CC3355";
  }

  return {
    total,
    grade,
    gradeColor,
    breakdown: [
      {
        label: "Talk Balance",
        score: Math.round(talkScore),
        max: 40,
        description: `Avg ${Math.round(avgTalkPct)}% manager talk (target ≤${threshold}%)`,
        color: "#E06D83",
      },
      {
        label: "Question Balance",
        score: Math.round(qScore),
        max: 25,
        description: `Report asks ${Math.round(reportQPct * 100)}% of questions`,
        color: "#8B6FBD",
      },
      {
        label: "Commitment Rate",
        score: completionScore,
        max: 25,
        description: `${Math.round(completionRate * 100)}% of items completed`,
        color: "#C3B1E1",
      },
      {
        label: "Meeting Cadence",
        score: freqScore,
        max: 10,
        description: `${processed.length} sessions tracked`,
        color: "#665578",
      },
    ],
  };
}

export default function ReportHealthCard({
  sessions,
  threshold,
  reportName = "Report",
}: ReportHealthCardProps) {
  const health = useMemo(() => computeHealth(sessions, threshold), [sessions, threshold]);

  const TrendIcon =
    health.total >= 70 ? TrendingUp : health.total >= 45 ? Minus : TrendingDown;

  if (sessions.length === 0) {
    return (
      <div className="p-6 rounded-3xl border border-[#F5BEC6] bg-white flex flex-col items-center justify-center gap-3 text-center min-h-[200px]">
        <Heart className="w-8 h-8 text-[#F5BEC6]" />
        <p className="text-xs font-extrabold text-[#241830]">No sessions yet</p>
        <p className="text-[11px] text-[#665578]">Health score will appear once you analyze your first 1:1</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl border border-[#F5BEC6] bg-white space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
            style={{ background: `${health.gradeColor}20`, border: `1.5px solid ${health.gradeColor}40` }}
          >
            <Heart className="w-5 h-5" style={{ color: health.gradeColor }} />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-[#665578] uppercase tracking-wider">
              Relationship Health
            </p>
            <p className="text-xs font-bold text-[#241830]">{reportName}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <TrendIcon className="w-4 h-4" style={{ color: health.gradeColor }} />
            <span
              className="text-2xl font-extrabold"
              style={{ color: health.gradeColor }}
            >
              {health.total}
            </span>
            <span className="text-sm font-bold text-[#8E7E9E]">/100</span>
          </div>
          <span
            className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border"
            style={{
              color: health.gradeColor,
              borderColor: `${health.gradeColor}40`,
              background: `${health.gradeColor}15`,
            }}
          >
            {health.grade}
          </span>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="space-y-1">
        <div className="h-2.5 rounded-full overflow-hidden bg-[#FFF4F6] border border-[#F5BEC6]">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${health.total}%`,
              background: `linear-gradient(90deg, ${health.gradeColor}99, ${health.gradeColor})`,
            }}
          />
        </div>
      </div>

      {/* Breakdown */}
      {health.breakdown.length > 0 && (
        <div className="space-y-3">
          {health.breakdown.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#241830]">{item.label}</span>
                <span className="text-[11px] font-bold text-[#665578]">
                  {item.score}/{item.max}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden bg-[#FFF4F6]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.score / item.max) * 100}%`,
                    background: item.color,
                  }}
                />
              </div>
              <p className="text-[10px] text-[#8E7E9E] font-semibold">{item.description}</p>
            </div>
          ))}
        </div>
      )}

      {health.grade === "At Risk" && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#FFE3E8] border border-[#F5BEC6]">
          <AlertTriangle className="w-4 h-4 text-[#E06D83] shrink-0" />
          <p className="text-[11px] font-bold text-[#E06D83]">
            Schedule more 1:1s and focus on asking more questions to improve this score.
          </p>
        </div>
      )}
    </div>
  );
}
