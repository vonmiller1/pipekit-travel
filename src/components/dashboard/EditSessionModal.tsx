"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftRight, Trash2, UserCircle, Tag, Calendar, StickyNote } from "lucide-react";
import type { SessionResponse, ReportResponse } from "@/lib/types";

interface EditSessionModalProps {
  session: SessionResponse | null;
  reports: ReportResponse[];
  isOpen: boolean;
  onClose: () => void;
  onSessionUpdated: (updatedSession: SessionResponse) => void;
  onSessionDeleted: (sessionId: string) => void;
}

const CATEGORIES = [
  "Weekly 1:1 Sync",
  "Performance Review",
  "Career Growth Sync",
  "Sprint Retrospective",
  "Project Check-in",
];

export default function EditSessionModal({
  session,
  reports,
  isOpen,
  onClose,
  onSessionUpdated,
  onSessionDeleted,
}: EditSessionModalProps) {
  const [selectedReportId, setSelectedReportId] = useState("");
  const [label, setLabel] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (session) {
      setSelectedReportId(session.reportId);
      setLabel(session.label || "Weekly 1:1 Sync");
      setOccurredAt(new Date(session.occurredAt).toISOString().split("T")[0]);
      setNotes(session.notes || "");
    }
  }, [session]);

  if (!session) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: selectedReportId,
          label,
          occurredAt,
          notes: notes.trim() || null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        onSessionUpdated(updated);
        onClose();
      }
    } catch (error) {
      console.error("Update session error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this meeting session?")) {
      setIsDeleting(true);
      try {
        const res = await fetch(`/api/sessions/${session.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          onSessionDeleted(session.id);
          onClose();
        }
      } catch (error) {
        console.error("Delete session error:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white border-[#F5BEC6] text-[#241830] sm:max-w-md rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="space-y-2 pb-4 border-b border-[#F5BEC6]">
          <DialogTitle className="text-base font-extrabold flex items-center gap-2 text-[#241830]">
            <ArrowLeftRight className="w-5 h-5 text-[#8B6FBD]" />
            Move / Reassign Conversation
          </DialogTitle>
          <p className="text-xs font-semibold text-[#665578]">
            Reassign this 1:1 conversation to another team member or update meeting category details.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-extrabold text-[#241830] uppercase tracking-wider flex items-center gap-1.5">
              <UserCircle className="w-3.5 h-3.5 text-[#8B6FBD]" />
              Assigned Direct Report
            </Label>
            <Select value={selectedReportId} onValueChange={(v) => setSelectedReportId(v ?? "")}>
              <SelectTrigger className="bg-[#FFF4F6] border-[#F5BEC6] h-10 text-xs font-bold text-[#241830] rounded-xl">
                <SelectValue placeholder="Select team member..." />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#F5BEC6] text-[#241830]">
                {reports.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="text-xs font-bold focus:bg-[#FCE4E8]">
                    {r.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-extrabold text-[#241830] uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#E06D83]" />
              Meeting Category / Title
            </Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Weekly 1:1 Sync"
              className="bg-[#FFF4F6] border-[#F5BEC6] h-10 text-xs font-bold text-[#241830] rounded-xl"
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setLabel(cat)}
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border transition-all ${
                    label === cat
                      ? "bg-[#8B6FBD] text-white border-[#8B6FBD]"
                      : "bg-[#FFF4F6] text-[#665578] border-[#F5BEC6] hover:bg-[#FCE4E8]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-extrabold text-[#241830] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#8B6FBD]" />
              Meeting Date
            </Label>
            <Input
              type="date"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="bg-[#FFF4F6] border-[#F5BEC6] h-10 text-xs font-bold text-[#241830] rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-extrabold text-[#241830] uppercase tracking-wider flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5 text-[#8B6FBD]" />
              Session Notes
            </Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Pre/post-meeting notes, agenda items, reflections..."
              rows={3}
              className="w-full px-3.5 py-2.5 text-xs font-semibold text-[#241830] placeholder-[#8E7E9E] rounded-xl border border-[#F5BEC6] bg-[#FFF4F6] focus:outline-none focus:ring-2 focus:ring-[#8B6FBD] transition-all resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 pt-4 border-t border-[#F5BEC6]">
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isDeleting}
            className="border-[#F5BEC6] text-[#E06D83] bg-[#FFE3E8] hover:bg-[#E06D83] hover:text-white text-xs font-bold rounded-xl h-10"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete Session
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="text-xs font-bold text-[#665578] border-[#F5BEC6] hover:bg-[#FCE4E8] rounded-xl h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#8B6FBD] text-white font-extrabold text-xs px-5 rounded-xl h-10 hover:scale-105 shadow-md shadow-[#8B6FBD]/30"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
