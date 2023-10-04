"use client";

import { FileText, AlertTriangle } from "lucide-react";

interface AnalysisSummaryProps {
  summary: string | null;
  flagged: boolean;
  flagReason: string | null;
}

export default function AnalysisSummary({
  summary,
  flagged,
  flagReason,
}: AnalysisSummaryProps) {
  if (!summary) {
    return null;
  }

  return (
    <div className="space-y-3">
      {flagged && flagReason && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FFE3E8] border border-[#F5BEC6] text-xs animate-fade-in-up">
          <AlertTriangle className="w-4 h-4 text-[#E06D83] shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold text-[#E06D83] uppercase tracking-wider text-[10px]">Threshold Alert</p>
            <p className="font-bold text-[#E06D83] mt-0.5">
              {flagReason}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 p-4 bg-[#FFF4F6] border border-[#F5BEC6] rounded-2xl">
        <FileText className="w-4.5 h-4.5 text-[#8B6FBD] mt-0.5 shrink-0" />
        <p className="text-xs sm:text-sm text-[#241830] leading-relaxed font-medium">{summary}</p>
      </div>
    </div>
  );
}
