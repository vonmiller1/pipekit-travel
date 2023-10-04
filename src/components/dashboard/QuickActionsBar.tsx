"use client";

import { useState } from "react";
import { Zap, Plus, Search, Scale, Sparkles, X, ListChecks, Keyboard } from "lucide-react";

interface QuickActionsBarProps {
  onOpenPrep: () => void;
  onOpenCommand: () => void;
  onFocusTranscript: () => void;
  onSwitchTab: (tab: "dashboard" | "commitments" | "trends") => void;
}

export default function QuickActionsBar({
  onOpenPrep,
  onOpenCommand,
  onFocusTranscript,
  onSwitchTab,
}: QuickActionsBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-40">
      {/* Expanded Menu Actions */}
      {isOpen && (
        <div className="mb-3 space-y-2 animate-fade-in-up">
          <button
            onClick={() => {
              onOpenPrep();
              setIsOpen(false);
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-[#F5BEC6] text-xs font-extrabold text-[#241830] hover:bg-[#FFF4F6] shadow-xl transition-all hover:scale-105 w-48 justify-start"
          >
            <Zap className="w-4 h-4 text-[#8B6FBD]" />
            Meeting Prep Assistant
          </button>

          <button
            onClick={() => {
              onOpenCommand();
              setIsOpen(false);
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-[#F5BEC6] text-xs font-extrabold text-[#241830] hover:bg-[#FFF4F6] shadow-xl transition-all hover:scale-105 w-48 justify-start"
          >
            <Search className="w-4 h-4 text-[#E06D83]" />
            Search Palette (⌘K)
          </button>

          <button
            onClick={() => {
              onFocusTranscript();
              setIsOpen(false);
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-[#F5BEC6] text-xs font-extrabold text-[#241830] hover:bg-[#FFF4F6] shadow-xl transition-all hover:scale-105 w-48 justify-start"
          >
            <Sparkles className="w-4 h-4 text-[#8B6FBD]" />
            Analyze Transcript
          </button>

          <button
            onClick={() => {
              onSwitchTab("commitments");
              setIsOpen(false);
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-[#F5BEC6] text-xs font-extrabold text-[#241830] hover:bg-[#FFF4F6] shadow-xl transition-all hover:scale-105 w-48 justify-start"
          >
            <ListChecks className="w-4 h-4 text-[#E06D83]" />
            Action Commitments
          </button>
        </div>
      )}

      {/* Main Speed Dial Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-[#8B6FBD] text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all shadow-[#8B6FBD]/40 border-2 border-white"
        title="Quick Executive Actions"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
      </button>
    </div>
  );
}
