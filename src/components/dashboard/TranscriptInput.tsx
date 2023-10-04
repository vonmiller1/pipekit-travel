"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Send,
  UserCheck,
  Calendar,
  Lock,
  Plus,
  UserPlus,
  ChevronDown,
  Loader2,
  FlaskConical,
  Tag,
  User,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { ReportResponse } from "@/lib/types";

interface TranscriptInputProps {
  reports: ReportResponse[];
  selectedReportId?: string;
  selectedProjectId?: string | null;
  onSelectReport?: (reportId: string) => void;
  onSubmit: (data: {
    transcript: string;
    reportId: string;
    projectId?: string | null;
    managerSpeakerName: string;
    occurredAt: string;
    label?: string;
    notes?: string;
  }) => void;
  isSubmitting: boolean;
  onCreateReport: (displayName: string) => void;
}

const SESSION_TYPES = [
  "Weekly 1:1 Sync",
  "Performance Review",
  "Career Growth Sync",
  "Sprint Retrospective",
  "Project Check-in",
];

const DEMO_TRANSCRIPTS = [
  {
    label: "Demo 1 — Balanced (50/50)",
    manager: "Alex",
    sessionType: "Weekly 1:1 Sync",
    transcript: `Alex: Thanks for making time today, Jordan. How are things feeling on the Q3 roadmap?
Jordan: Pretty good overall. The team wrapped up the database migration ahead of schedule.
Alex: That's great news! Were there any unexpected bottlenecks during the cutover?
Jordan: Not during cutover, but we did notice higher latency on the read replicas during peak load.
Alex: Good callout. Do we need to schedule a performance audit before launching the new feature?
Jordan: Yes, I think allocating two days next week for replica indexing would solve it.
Alex: Sounds good. I will approve the sprint scope adjustment for indexing. Can you send the tech spec to the team by Friday?
Jordan: Absolutely, I'll complete the spec draft and share it with everyone by Friday afternoon.`,
  },
  {
    label: "Demo 2 — Manager Dominated (75/25)",
    manager: "Alex",
    sessionType: "Performance Review",
    transcript: `Alex: Hi Sam, let's dive right in. I reviewed your PR for the auth service refactor and I have a bunch of notes.
Sam: Okay, cool.
Alex: First off, we need to stick strictly to the OAuth2 PKCE flow. I saw you used standard implicit flow in two endpoints, which is a security risk. Also, the error logging should route through our Datadog middleware, not console.error.
Sam: Makes sense, I can fix that.
Alex: Great. Also, regarding next sprint's roadmap, I've already assigned you the migration tasks for the billing service and the legacy API deprecation. I want both done by end of month.
Sam: Alright, I'll take a look.
Alex: Perfect. Make sure you update Jira ticket SEC-402 by tomorrow morning so product has visibility.`,
  },
];

function detectSpeakers(text: string): string[] {
  const lines = text.split("\n");
  const speakers = new Set<string>();
  for (const line of lines) {
    const match = line.match(/^([A-Z][a-zA-Z0-9_\s]{1,20}):/);
    if (match) speakers.add(match[1].trim());
  }
  return Array.from(speakers);
}

export default function TranscriptInput({
  reports,
  selectedReportId: controlledReportId = "",
  selectedProjectId,
  onSelectReport,
  onSubmit,
  isSubmitting,
  onCreateReport,
}: TranscriptInputProps) {
  const [transcript, setTranscript] = useState("");
  const [managerSpeakerName, setManagerSpeakerName] = useState("");
  const [sessionLabel, setSessionLabel] = useState(SESSION_TYPES[0]);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const detectedSpeakers = useMemo(() => detectSpeakers(transcript), [transcript]);

  const activeReportId =
    controlledReportId || (reports.length > 0 ? reports[0].id : "");

  useEffect(() => {
    if (managerSpeakerName && detectedSpeakers.length > 0 && !detectedSpeakers.includes(managerSpeakerName)) {
      setManagerSpeakerName(detectedSpeakers[0]);
    }
  }, [detectedSpeakers, managerSpeakerName]);

  const effectiveManagerName =
    managerSpeakerName || (detectedSpeakers.length > 0 ? detectedSpeakers[0] : "");

  const isReady =
    transcript.trim().length > 10 &&
    activeReportId.length > 0 &&
    (effectiveManagerName || detectedSpeakers.length === 0);

  const handleSubmit = () => {
    if (!isReady || isSubmitting) return;
    onSubmit({
      transcript,
      reportId: activeReportId,
      projectId: selectedProjectId,
      managerSpeakerName: effectiveManagerName || "Manager",
      occurredAt,
      label: sessionLabel,
      notes: notes.trim() || undefined,
    });
  };

  const handleLoadDemo = (demo: (typeof DEMO_TRANSCRIPTS)[0]) => {
    setTranscript(demo.transcript);
    setManagerSpeakerName(demo.manager);
    setSessionLabel(demo.sessionType);
    if (!controlledReportId && reports.length > 0) {
      onSelectReport?.(reports[0].id);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim() || !agreedToPrivacy) return;
    setIsAddingMember(true);
    await new Promise((r) => setTimeout(r, 200));
    onCreateReport(newMemberName.trim());
    setNewMemberName("");
    setAgreedToPrivacy(false);
    setIsAddingMember(false);
    setShowAddMember(false);
  };

  const charCount = transcript.length;
  const lineCount = transcript.split("\n").filter((l) => l.trim()).length;

  return (
    <div className="space-y-5">
      {/* SAMPLE TRANSCRIPTS ROW */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#665578] uppercase tracking-wider">
          <FlaskConical className="w-3.5 h-3.5 text-[#8B6FBD]" />
          Sample Transcripts
        </div>
        <div className="flex gap-2">
          {DEMO_TRANSCRIPTS.map((demo, idx) => (
            <button
              key={idx}
              onClick={() => handleLoadDemo(demo)}
              title={demo.label}
              className="text-[11px] font-extrabold px-3 py-1.5 rounded-xl border border-[#F5BEC6] bg-[#FCE4E8] text-[#8B6FBD] transition-all hover:scale-105 active:scale-95"
            >
              Demo {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* MEETING TYPE PILLS */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#241830] uppercase tracking-wider">
          <Tag className="w-3 h-3 text-[#8B6FBD]" />
          Meeting Type / Category
        </label>
        <div className="flex flex-wrap gap-2">
          {SESSION_TYPES.map((type) => {
            const active = sessionLabel === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSessionLabel(type)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all duration-200 border ${
                  active
                    ? "bg-[#8B6FBD] text-white border-[#8B6FBD] shadow-md shadow-[#8B6FBD]/25"
                    : "bg-[#FFF4F6] text-[#665578] border-[#F5BEC6] hover:bg-[#FCE4E8]"
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* TEAM MEMBER + DATE ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Team Member */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#241830] uppercase tracking-wider">
            <User className="w-3 h-3 text-[#8B6FBD]" />
            Team Member
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={activeReportId}
                onChange={(e) => onSelectReport?.(e.target.value)}
                className="w-full h-10 pl-3.5 pr-8 text-xs font-bold text-[#241830] rounded-xl border border-[#F5BEC6] bg-[#FFF4F6] appearance-none focus:outline-none focus:ring-2 focus:ring-[#8B6FBD] transition-all cursor-pointer"
              >
                {reports.length === 0 && (
                  <option value="" disabled>
                    No team members yet...
                  </option>
                )}
                {reports.map((r) => (
                  <option key={r.id} value={r.id} className="bg-white">
                    {r.displayName}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#665578] absolute right-3 top-3 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={() => {
                setNewMemberName("");
                setAgreedToPrivacy(false);
                setShowAddMember(true);
              }}
              title="Add Team Member"
              className="h-10 w-10 rounded-xl border border-[#F5BEC6] bg-[#FCE4E8] flex items-center justify-center text-[#8B6FBD] hover:bg-[#8B6FBD] hover:text-white transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Meeting Date */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#241830] uppercase tracking-wider">
            <Calendar className="w-3 h-3 text-[#8B6FBD]" />
            Meeting Date
          </label>
          <input
            type="date"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="w-full h-10 px-3.5 text-xs font-bold text-[#241830] rounded-xl border border-[#F5BEC6] bg-[#FFF4F6] focus:outline-none focus:ring-2 focus:ring-[#8B6FBD] transition-all"
          />
        </div>
      </div>

      {/* TRANSCRIPT TEXTAREA */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#241830] uppercase tracking-wider">
            Transcript Content
          </label>
          {transcript.length > 0 && (
            <span className="text-[11px] text-[#665578] font-semibold">
              {lineCount} lines · {charCount} chars
            </span>
          )}
        </div>

        {transcript.trim().length > 20 && detectedSpeakers.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FCE4E8] border border-[#F5BEC6] text-[#E06D83] text-[11px] font-bold animate-fade-in-up">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>No speaker prefixes detected</strong> (e.g. &quot;Alex: ...&quot;). Adding speaker labels before each line ensures exact talk-time &amp; question ratio tracking.
            </span>
          </div>
        )}
        <div className="relative">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={`Paste your 1:1 transcript here...\n\nExample format:\nAlex: How's the sprint going?\nJordan: Pretty well. We hit the milestone early.`}
            rows={7}
            className="w-full px-4 py-3.5 text-xs text-[#241830] placeholder-[#8E7E9E] rounded-2xl border border-[#F5BEC6] bg-[#FFF4F6] focus:outline-none focus:ring-2 focus:ring-[#8B6FBD] transition-all resize-none transcript-textarea"
          />
          {transcript.length > 0 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
              <div
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(60, charCount / 10)}px`,
                  background:
                    charCount > 100 ? "#8B6FBD" : charCount > 30 ? "#E06D83" : "#F5BEC6",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* SESSION NOTES (collapsible) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            className="flex items-center gap-2 text-[11px] font-extrabold text-[#665578] hover:text-[#241830] transition-colors"
          >
            <span className={`transition-transform duration-200 ${showNotes ? "rotate-90" : ""}`}>▶</span>
            Pre/Post-Meeting Notes
            <span className="text-[10px] font-semibold text-[#8E7E9E] ml-1">(optional agenda, reflections)</span>
            {notes.trim() && (
              <span className="w-2 h-2 rounded-full bg-[#8B6FBD] shrink-0" />
            )}
          </button>

          {showNotes && (
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val === "weekly") {
                  setNotes("📋 Weekly Sync Agenda:\n- OKR progress & weekly priorities\n- Top blockers & dependencies\n- Shoutouts / wins\n- Open action items review");
                } else if (val === "career") {
                  setNotes("🌱 Career Growth Sync:\n- Long-term career aspirations\n- Current skill development areas\n- Feedback on recent projects\n- Upcoming growth opportunities");
                } else if (val === "retro") {
                  setNotes("🔄 Sprint Retrospective 1:1:\n- What went well this sprint?\n- What could have gone better?\n- Process or tool improvements\n- Action items for next iteration");
                }
              }}
              defaultValue=""
              className="text-[10px] font-extrabold text-[#8B6FBD] bg-[#FCE4E8] border border-[#F5BEC6] rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer"
            >
              <option value="" disabled className="bg-white text-[#241830] font-bold">📋 Load Agenda Template...</option>
              <option value="weekly" className="bg-white text-[#241830] font-bold">Weekly Sync Agenda</option>
              <option value="career" className="bg-white text-[#241830] font-bold">Career Growth Sync</option>
              <option value="retro" className="bg-white text-[#241830] font-bold">Sprint Retro 1:1</option>
            </select>
          )}
        </div>
        {showNotes && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`Agenda, talking points, or post-meeting reflections...\n\nExample:\n- Review Q3 OKRs\n- Discuss career growth path\n- Action item follow-ups`}
            rows={4}
            className="w-full px-4 py-3 text-xs text-[#241830] placeholder-[#8E7E9E] rounded-2xl border border-[#F5BEC6] bg-[#FFF4F6] focus:outline-none focus:ring-2 focus:ring-[#8B6FBD] transition-all resize-none animate-fade-in-up"
          />
        )}
      </div>

      {/* SPEAKER DETECTION PILLS */}
      {detectedSpeakers.length > 0 && (
        <div className="p-4 rounded-2xl border border-[#F5BEC6] bg-[#FCE4E8] space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#241830] uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5 text-[#8B6FBD]" />
            Select Your Speaker (Manager)
          </div>
          <div className="flex flex-wrap gap-2">
            {detectedSpeakers.map((speaker) => {
              const active = managerSpeakerName === speaker;
              return (
                <button
                  key={speaker}
                  type="button"
                  onClick={() => setManagerSpeakerName(active ? "" : speaker)}
                  className={`flex items-center gap-2 text-xs font-extrabold px-3.5 py-2 rounded-xl border transition-all duration-200 ${
                    active
                      ? "bg-[#8B6FBD] text-white border-[#8B6FBD] shadow-md shadow-[#8B6FBD]/30"
                      : "bg-[#FFF4F6] text-[#665578] border-[#F5BEC6] hover:bg-[#FFFFFF]"
                  }`}
                >
                  <User className="w-3 h-3" />
                  {speaker}
                  {active && (
                    <span className="text-[10px] font-extrabold bg-[#E06D83] text-white px-1.5 py-0.5 rounded-md">
                      MGR
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ANALYZE BUTTON */}
      <button
        onClick={handleSubmit}
        disabled={!isReady || isSubmitting}
        className={`w-full h-11 flex items-center justify-center gap-2.5 rounded-full font-bold text-sm transition-all duration-200 relative overflow-hidden group ${
          isReady && !isSubmitting
            ? "apple-btn-primary"
            : "bg-[#FCE4E8] text-[#8E7E9E] border border-[#F5BEC6] cursor-not-allowed opacity-60"
        }`}
      >
        <div className="relative flex items-center gap-2.5">
          {isSubmitting ? (
            <>
              <div className="uiverse-loader shrink-0">
                <span className="uiverse-loader-dot" />
                <span className="uiverse-loader-dot" />
                <span className="uiverse-loader-dot" />
              </div>
              <span>Analyzing with AI Studio...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Analyze Conversation</span>
            </>
          )}
        </div>

        {!isReady && !isSubmitting && (
          <span className="absolute right-4 text-[10px] font-bold text-[#8E7E9E]">
            {!transcript.trim()
              ? "Add transcript"
              : !activeReportId
              ? "Select member"
              : "Ready"}
          </span>
        )}
      </button>

      {/* ADD TEAM MEMBER MODAL */}
      {showAddMember && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(36, 24, 48, 0.6)", backdropFilter: "blur(12px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddMember(false);
          }}
        >
          <div className="w-full max-w-md rounded-3xl border border-[#F5BEC6] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#F5BEC6]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FCE4E8] border border-[#F5BEC6] flex items-center justify-center text-[#8B6FBD]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#241830]">Add Direct Report</h3>
                  <p className="text-[11px] text-[#665578]">Create a 1:1 tracking workspace</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddMember(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#665578] hover:text-[#241830] hover:bg-[#FCE4E8] transition-all"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold text-[#241830] uppercase tracking-wider">
                  Team Member Name
                </label>
                <input
                  autoFocus
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                  placeholder="e.g. Sarah Connor"
                  className="w-full h-10 px-3.5 text-xs font-bold text-[#241830] placeholder-[#8E7E9E] rounded-xl border border-[#F5BEC6] bg-[#FFF4F6] focus:outline-none focus:ring-2 focus:ring-[#8B6FBD] transition-all"
                />
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-[#F5BEC6] bg-[#FCE4E8]">
                <Lock className="w-4 h-4 text-[#8B6FBD] shrink-0 mt-0.5" />
                <div className="text-[11px] text-[#241830] space-y-1">
                  <p className="font-extrabold">Private Self-Correction Policy</p>
                  <p className="text-[#665578] leading-relaxed">
                    This data is stored locally for your self-improvement only.
                  </p>
                </div>
              </div>

              <label className="uiverse-checkbox-container flex items-start gap-3 select-none">
                <input
                  type="checkbox"
                  checked={agreedToPrivacy}
                  onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                />
                <span className="uiverse-checkmark mt-0.5" />
                <span className="text-xs font-semibold text-[#241830]">
                  I understand this data is stored privately for manager self-correction.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#F5BEC6]">
              <button
                onClick={() => setShowAddMember(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#665578] hover:text-[#241830] border border-[#F5BEC6] hover:bg-[#FCE4E8] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={!newMemberName.trim() || !agreedToPrivacy || isAddingMember}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#8B6FBD] transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-md shadow-[#8B6FBD]/30"
              >
                {isAddingMember ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
