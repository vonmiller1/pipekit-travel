"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, ShieldAlert, Sparkles, Download, FileText } from "lucide-react";
import type { SessionResponse } from "@/lib/types";
import { downloadCSV, toMarkdown } from "@/lib/export";

interface ShareModalProps {
  session: SessionResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ session, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [shareData, setShareData] = useState<{
    shareUrl: string;
    summary: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !session) return null;

  const handleGenerateShare = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/share`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setShareData(data);
      }
    } catch (err) {
      console.error("Share error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareData?.shareUrl) return;
    navigator.clipboard.writeText(shareData.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(36, 24, 48, 0.6)", backdropFilter: "blur(12px)" }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-[#F5BEC6] overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="p-6 border-b border-[#F5BEC6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FCE4E8] border border-[#F5BEC6] flex items-center justify-center text-[#8B6FBD]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#241830] text-base">Share Session Summary</h3>
              <p className="text-xs text-[#665578] font-semibold">Explicit opt-in summary sharing</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-[#FFE3E8] border border-[#F5BEC6] rounded-2xl space-y-1.5">
            <h4 className="text-xs font-extrabold text-[#E06D83] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Explicit Opt-in Notice
            </h4>
            <p className="text-xs text-[#241830] leading-relaxed font-semibold">
              By default, session data is completely private. Sharing generates a unique link containing ONLY high-level summary & action items — raw transcripts remain encrypted and unshared.
            </p>
          </div>

          {/* Feature #8: explicit payload description */}
          <div className="p-4 bg-[#FFF4F6] border border-[#F5BEC6] rounded-2xl space-y-2">
            <p className="text-[11px] font-extrabold text-[#241830] uppercase tracking-wider">This link will include:</p>
            <ul className="space-y-1">
              {["Talk-time ratio (Manager % vs Report %)", "Action item titles and owners", "Session date and meeting label", "AI-generated summary (no raw text)"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs font-semibold text-[#241830]">
                  <span className="w-4 h-4 rounded-full bg-[#8B6FBD]/15 flex items-center justify-center text-[#8B6FBD] text-[10px] font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-[11px] font-extrabold text-[#E06D83] uppercase tracking-wider mt-2">This link will NOT include:</p>
            <ul className="space-y-1">
              {["Raw transcript text", "Individual verbatim quotes", "Recording or audio"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs font-semibold text-[#665578]">
                  <span className="w-4 h-4 rounded-full bg-[#FFE3E8] flex items-center justify-center text-[#E06D83] text-[10px] font-bold">✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {!shareData ? (
            <div className="py-4 text-center space-y-3">
              <p className="text-xs text-[#665578] font-semibold">
                Ready to share key takeaways with <strong className="text-[#241830]">{session.report?.displayName || "Team Member"}</strong>?
              </p>
              <Button
                onClick={handleGenerateShare}
                disabled={isLoading}
                className="w-full text-xs font-extrabold text-white bg-[#8B6FBD] hover:scale-105 h-11 rounded-2xl shadow-md shadow-[#8B6FBD]/30"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isLoading ? "Generating Secure Link..." : "Generate Shareable Link"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in-up">
              <label className="text-xs font-extrabold text-[#241830] uppercase tracking-wider">
                Shareable Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareData.shareUrl}
                  className="flex-1 bg-[#FFF4F6] border border-[#F5BEC6] rounded-xl px-3 text-xs font-mono font-bold text-[#241830]"
                />
                <Button
                  size="sm"
                  onClick={handleCopy}
                  className="text-xs font-extrabold text-white bg-[#8B6FBD] hover:scale-105 rounded-xl shrink-0 h-10 shadow-md shadow-[#8B6FBD]/30"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Export Row */}
        <div className="px-6 pb-4 space-y-2">
          <p className="text-[11px] font-extrabold text-[#241830] uppercase tracking-wider">Export Data</p>
          <div className="flex gap-2">
            <button
              onClick={() => downloadCSV(session)}
              className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl border border-[#F5BEC6] bg-[#FFF4F6] text-[11px] font-extrabold text-[#8B6FBD] hover:bg-[#FCE4E8] transition-all hover:scale-105"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={() => {
                const md = toMarkdown(session);
                navigator.clipboard.writeText(md);
                setCopiedMd(true);
                setTimeout(() => setCopiedMd(false), 2000);
              }}
              className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl border border-[#F5BEC6] bg-[#FFF4F6] text-[11px] font-extrabold text-[#665578] hover:bg-[#FCE4E8] transition-all hover:scale-105"
            >
              {copiedMd ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#8B6FBD]" />
                  <span className="text-[#8B6FBD]">Copied!</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  Copy Markdown
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-[#FFF4F6] border-t border-[#F5BEC6] flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs font-bold text-[#665578] border-[#F5BEC6] hover:bg-[#FCE4E8] rounded-xl h-10"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
