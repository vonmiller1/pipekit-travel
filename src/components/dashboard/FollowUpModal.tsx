"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, Copy, Check, Sparkles, Send, Calendar } from "lucide-react";
import type { SessionResponse } from "@/lib/types";

interface FollowUpModalProps {
  session: SessionResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function FollowUpModal({ session, isOpen, onClose }: FollowUpModalProps) {
  const [copiedType, setCopiedType] = useState<"email" | "slack" | null>(null);

  if (!session) return null;

  const reportName = session.report?.displayName || "Team Member";
  const dateStr = new Date(session.occurredAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const openItems = (session.actionItems || []).filter((i) => i.status === "open");
  const completedItems = (session.actionItems || []).filter((i) => i.status === "done");

  // Email format generator
  const emailSubject = `Follow-up: 1:1 Sync — ${reportName} (${dateStr})`;
  const emailBody = `Hi ${reportName},

Thanks for our 1:1 sync today (${dateStr}). Here is a quick summary of what we discussed and our agreed action items:

${session.metrics?.summary ? `📝 Summary:\n${session.metrics.summary}\n` : ""}${
    session.notes ? `📌 Meeting Notes:\n${session.notes}\n` : ""
  }
✅ Action Items & Commitments:
${
  openItems.length > 0
    ? openItems
        .map(
          (item) =>
            `- [ ] ${item.text} (${item.speakerRole === "manager" ? "Manager" : reportName}${
              item.dueHint ? ` — due ${item.dueHint}` : ""
            })`
        )
        .join("\n")
    : "- No open action items recorded."
}

${
  completedItems.length > 0
    ? `\n✔️ Completed During Session:\n${completedItems
        .map((item) => `- ${item.text}`)
        .join("\n")}\n`
    : ""
}
Looking forward to our next sync! Let me know if anything needs adjustment.

Best,
Manager`;

  // Slack markdown format generator
  const slackText = `*1:1 Sync Follow-up — ${reportName}* (${dateStr})

${session.metrics?.summary ? `> *Summary:* ${session.metrics.summary}\n` : ""}${
    openItems.length > 0
      ? `*Action Items:*
${openItems
  .map(
    (item) =>
      `• *${item.text}* — _${item.speakerRole === "manager" ? "Manager" : reportName}_${
        item.dueHint ? ` (due ${item.dueHint})` : ""
      }`
  )
  .join("\n")}`
      : "• _No open action items_"
}

_Sent via 1:1 Balance Studio_`;

  const handleCopy = (text: string, type: "email" | "slack") => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white border-[#F5BEC6] text-[#241830] sm:max-w-lg rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="space-y-2 pb-4 border-b border-[#F5BEC6]">
          <DialogTitle className="text-base font-extrabold flex items-center gap-2 text-[#241830]">
            <Mail className="w-5 h-5 text-[#8B6FBD]" />
            Generate Follow-up Message
          </DialogTitle>
          <p className="text-xs font-semibold text-[#665578]">
            One-click summary formatted for Email or Slack to send to {reportName}.
          </p>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Email Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#241830] flex items-center gap-1.5 uppercase tracking-wider">
                <Mail className="w-3.5 h-3.5 text-[#E06D83]" />
                Email Format
              </span>
              <button
                onClick={() => handleCopy(`Subject: ${emailSubject}\n\n${emailBody}`, "email")}
                className="text-[11px] font-extrabold px-3 py-1 rounded-xl bg-[#FCE4E8] text-[#8B6FBD] hover:bg-[#8B6FBD] hover:text-white transition-all flex items-center gap-1"
              >
                {copiedType === "email" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Copied Email!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Email Text
                  </>
                )}
              </button>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FFF4F6] border border-[#F5BEC6] text-[11px] font-mono text-[#241830] space-y-1.5 max-h-36 overflow-y-auto">
              <p className="font-bold text-[#8B6FBD]">Subject: {emailSubject}</p>
              <p className="whitespace-pre-wrap text-[#665578]">{emailBody}</p>
            </div>
          </div>

          {/* Slack Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#241830] flex items-center gap-1.5 uppercase tracking-wider">
                <MessageSquare className="w-3.5 h-3.5 text-[#8B6FBD]" />
                Slack Format
              </span>
              <button
                onClick={() => handleCopy(slackText, "slack")}
                className="text-[11px] font-extrabold px-3 py-1 rounded-xl bg-[#FCE4E8] text-[#8B6FBD] hover:bg-[#8B6FBD] hover:text-white transition-all flex items-center gap-1"
              >
                {copiedType === "slack" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Copied Slack!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Slack Text
                  </>
                )}
              </button>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#FFF4F6] border border-[#F5BEC6] text-[11px] font-mono text-[#241830] max-h-28 overflow-y-auto whitespace-pre-wrap">
              {slackText}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between pt-4 border-t border-[#F5BEC6]">
          <div className="flex items-center gap-1.5 text-[11px] text-[#665578] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#8B6FBD]" />
            <span>Ready to send</span>
          </div>
          <Button
            onClick={onClose}
            className="bg-[#8B6FBD] text-white font-extrabold text-xs px-5 rounded-xl h-10 hover:scale-105 shadow-md shadow-[#8B6FBD]/30"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
