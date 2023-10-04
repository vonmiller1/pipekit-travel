"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, Pause, CheckCircle2, AlertCircle } from "lucide-react";

interface BalanceBarProps {
  managerPct: number;
  reportPct: number;
  animated?: boolean;
}

function generateBarHeights(count: number, seed: number): number[] {
  const heights: number[] = [];
  let x = seed;
  for (let i = 0; i < count; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    const normalized = (x % 1000) / 1000;
    const wave = Math.sin((i / count) * Math.PI * 3) * 0.3;
    const height = 0.3 + normalized * 0.5 + wave * 0.2;
    heights.push(Math.max(0.18, Math.min(1, height)));
  }
  return heights;
}

export default function BalanceBar({
  managerPct,
  reportPct,
  animated = true,
}: BalanceBarProps) {
  const totalBars = 44;
  const [isVisible, setIsVisible] = useState(!animated);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animated]);

  const managerBars = Math.round((managerPct / 100) * totalBars);

  const barHeights = useMemo(
    () => generateBarHeights(totalBars, Math.round(managerPct * 100)),
    [managerPct]
  );

  const isHealthyBalance = managerPct <= 60;

  return (
    <div className="space-y-5">
      {/* Legend & Health Status Pill */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-xl bg-[#FCE4E8] hover:bg-[#F5BEC6] border border-[#F5BEC6] flex items-center justify-center text-[#8B6FBD] transition-all"
            title={isPlaying ? "Pause Waveform Animation" : "Play Waveform Animation"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: "#E06D83" }} />
            <span className="text-xs font-extrabold text-[#241830]">
              Manager <span className="text-[#E06D83]">{managerPct}%</span>
            </span>
          </div>

          <span className="text-[#F5BEC6]">|</span>

          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: "#8B6FBD" }} />
            <span className="text-xs font-extrabold text-[#241830]">
              Report <span className="text-[#8B6FBD]">{reportPct}%</span>
            </span>
          </div>
        </div>

        {/* Health Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold border ${
            isHealthyBalance
              ? "bg-[#FCE4E8] text-[#8B6FBD] border-[#F5BEC6]"
              : "bg-[#FFE3E8] text-[#E06D83] border-[#F5BEC6]"
          }`}
        >
          {isHealthyBalance ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#8B6FBD]" />
              <span>Optimal Balance (50/50 Target)</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-[#E06D83]" />
              <span>Manager Dominant (&gt;60%)</span>
            </>
          )}
        </div>
      </div>

      {/* Waveform Bar Visualizer */}
      <div className="balance-bar-container justify-center relative group py-2">
        {barHeights.map((height, i) => {
          const isManager = i < managerBars;
          const color = isManager ? "#E06D83" : "#8B6FBD";
          const dynamicHeight = isPlaying
            ? `${Math.max(20, Math.sin((i + Date.now() / 200) * 0.5) * 40 + height * 80)}%`
            : isVisible
            ? `${height * 100}%`
            : "0%";

          const isHovered = hoveredBarIndex === i;

          return (
            <div
              key={i}
              onMouseEnter={() => setHoveredBarIndex(i)}
              onMouseLeave={() => setHoveredBarIndex(null)}
              className={`balance-bar cursor-pointer transition-all ${isVisible ? "" : "opacity-0"} ${
                isHovered ? "scale-y-125 z-10 brightness-110 shadow-md" : ""
              }`}
              style={{
                backgroundColor: color,
                height: dynamicHeight,
                animationDelay: animated ? `${i * 0.015}s` : "0s",
                opacity: isVisible ? (isHovered ? 1 : 0.85 + height * 0.15) : 0,
              }}
            >
              {isHovered && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#241830] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap pointer-events-none z-30 border border-[#F5BEC6]">
                  {isManager ? "Manager Turn" : "Report Turn"} ({Math.round(height * 45)}s)
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dual Progress Indicator Bar */}
      <div className="relative h-3 bg-[#FFF4F6] rounded-full overflow-hidden flex border border-[#F5BEC6] shadow-xs">
        <div
          className="h-full rounded-l-full transition-all duration-700 ease-out flex items-center justify-end pr-1 text-[9px] font-extrabold text-white"
          style={{
            width: `${managerPct}%`,
            backgroundColor: "#E06D83",
          }}
        />
        <div
          className="h-full rounded-r-full transition-all duration-700 ease-out flex items-center justify-start pl-1 text-[9px] font-extrabold text-white"
          style={{
            width: `${reportPct}%`,
            backgroundColor: "#8B6FBD",
          }}
        />
      </div>
    </div>
  );
}
