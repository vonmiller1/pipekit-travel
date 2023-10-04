"use client";

import { useMemo } from "react";
import { Flame, Award, ShieldCheck, Target, Sparkles, CheckCircle2 } from "lucide-react";
import type { SessionResponse } from "@/lib/types";

interface StreaksWidgetProps {
  sessions: SessionResponse[];
  threshold: number;
}

export default function StreaksWidget({ sessions, threshold }: StreaksWidgetProps) {
  const processedSessions = useMemo(
    () => sessions.filter((s) => s.status === "processed" && s.metrics),
    [sessions]
  );

  const balancedCount = useMemo(
    () => processedSessions.filter((s) => (s.metrics?.managerTalkPct || 0) <= threshold).length,
    [processedSessions, threshold]
  );

  const totalActionItems = useMemo(
    () => sessions.flatMap((s) => s.actionItems || []),
    [sessions]
  );

  const completedItemsCount = useMemo(
    () => totalActionItems.filter((item) => item.status === "done").length,
    [totalActionItems]
  );

  const streakWeeks = Math.min(processedSessions.length, 12);

  const badges = [
    {
      title: `${streakWeeks} Sync Streak`,
      subtitle: `${processedSessions.length} total 1:1s logged`,
      icon: Flame,
      color: "#E06D83",
      bg: "#FFE3E8",
      active: streakWeeks >= 1,
    },
    {
      title: "Master Listener",
      subtitle: `${balancedCount} balanced syncs`,
      icon: ShieldCheck,
      color: "#8B6FBD",
      bg: "#FCE4E8",
      active: balancedCount >= 1,
    },
    {
      title: "Execution Leader",
      subtitle: `${completedItemsCount} commitments done`,
      icon: Target,
      color: "#059669",
      bg: "#ECFDF5",
      active: completedItemsCount >= 1,
    },
    {
      title: "Equal Partner",
      subtitle: "High report engagement",
      icon: Award,
      color: "#D97706",
      bg: "#FFFBEB",
      active: processedSessions.length >= 2,
    },
  ];

  return (
    <div className="p-5 rounded-3xl border border-[#F5BEC6] bg-white/80 backdrop-blur-md space-y-3.5 shadow-md shadow-[#8B6FBD]/5 hover:border-[#8B6FBD]/40 hover:shadow-lg hover:shadow-[#8B6FBD]/10 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#8B6FBD] animate-pulse" />
          <p className="text-xs font-extrabold text-[#241830] uppercase tracking-wider">
            Management Consistency &amp; Achievement Badges
          </p>
        </div>
        <span className="text-[10px] font-extrabold text-[#8B6FBD] bg-[#FCE4E8] px-2.5 py-0.5 rounded-full border border-[#F5BEC6] shadow-xs">
          {balancedCount}/{processedSessions.length} Balanced Sessions
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {badges.map((b) => {
          const Icon = b.icon;
          return (
            <div
              key={b.title}
              className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all duration-300 ${
                b.active
                  ? "bg-white border-[#F5BEC6]/80 shadow-xs hover:border-[#8B6FBD] hover:shadow-md hover:shadow-[#8B6FBD]/10 hover:-translate-y-0.5"
                  : "bg-[#FFF4F6]/20 border-[#F5BEC6]/30 opacity-40 hover:opacity-70"
              }`}
            >
              <div
                className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${b.active && b.title.includes("Streak") ? "animate-bounce" : ""}`}
                style={{ backgroundColor: b.bg, color: b.color }}
              >
                <Icon className="w-5.5 h-5.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-[#241830] truncate">{b.title}</p>
                <p className="text-[10px] text-[#665578] font-bold truncate">{b.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
