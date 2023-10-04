"use client";

import React, { useState } from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  showTagline?: boolean;
  showBadge?: boolean;
  className?: string;
}

export default function Logo({
  size = "md",
  showTagline = true,
  showBadge = true,
  className = "",
}: LogoProps) {
  const [imgError, setImgError] = useState(false);

  // Dimensions per size variant
  const iconSizes = {
    sm: "w-8 h-8 rounded-full",
    md: "w-11 h-11 rounded-full",
    lg: "w-13 h-13 rounded-full",
    xl: "w-15 h-15 rounded-full",
    hero: "w-18 h-18 rounded-full",
  };

  const titleSizes = {
    sm: "text-base tracking-tight font-semibold",
    md: "text-xl tracking-tight font-semibold",
    lg: "text-2xl sm:text-3xl tracking-tight font-semibold",
    xl: "text-3xl sm:text-4xl tracking-tight font-semibold",
    hero: "text-4xl sm:text-5xl tracking-tight font-semibold",
  };

  const tagSizes = {
    sm: "text-[10px]",
    md: "text-[12px]",
    lg: "text-xs sm:text-sm",
    xl: "text-xs sm:text-sm",
    hero: "text-sm",
  };

  return (
    <div className={`flex items-center gap-3.5 group select-none ${className}`}>
      {/* ── EMBLEM CONTAINER (Gemini Circular Control Chip) ── */}
      <div className="relative shrink-0">
        <div
          className={`${iconSizes[size]} relative overflow-hidden flex items-center justify-center bg-slate-950 border border-white/10 group-hover:border-teal-400 shadow-sm transition-all duration-300 group-hover:scale-105`}
        >
          {!imgError ? (
            <img
              src="/app-logo.png"
              alt="1:1 Balance Logo"
              className="w-full h-full object-cover rounded-full apple-product-shadow"
              onError={() => setImgError(true)}
            />
          ) : (
            /* Gemini Sparkles & Balance Vector Fallback */
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-3/5 h-3/5"
            >
              <path d="M24 12 V38 M20 38 H28" stroke="#2ec4b6" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M10 20 H38" stroke="#2ec4b6" strokeWidth="2" strokeLinecap="round" />
              <path d="M10 20 L6 28 C6 31 14 31 14 28 Z" fill="#8b5cf6" fillOpacity="0.25" stroke="#8b5cf6" strokeWidth="1.5" />
              <path d="M38 20 L34 28 C34 31 42 31 42 28 Z" fill="#8b5cf6" fillOpacity="0.25" stroke="#8b5cf6" strokeWidth="1.5" />
              <path d="M24 2 L26 7 L31 9 L26 11 L24 16 L22 11 L17 9 L22 7 Z" fill="#2ec4b6" />
            </svg>
          )}
        </div>
      </div>

      {/* ── TYPOGRAPHY & BADGE (SF Pro Display Tight) ── */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2.5">
          <span
            className={`${titleSizes[size]} text-[#241830] dark:text-white leading-none`}
            style={{ letterSpacing: "-0.374px" }}
          >
            1:1{" "}
            <span className="text-teal-400 bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Balance
            </span>
          </span>

          {showBadge && (
            <span
              className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full tracking-wider shrink-0 transition-all duration-300 text-teal-300 bg-gradient-to-r from-teal-500/20 to-purple-500/20 border border-teal-500/30"
            >
              Gemini Power
            </span>
          )}
        </div>

        {showTagline && (
          <span
            className={`${tagSizes[size]} font-normal text-[#665578] dark:text-slate-400 mt-1 tracking-normal`}
            style={{ letterSpacing: "-0.224px" }}
          >
            Executive Self-Correction Studio
          </span>
        )}
      </div>
    </div>
  );
}
