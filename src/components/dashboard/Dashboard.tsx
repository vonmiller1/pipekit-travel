"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Scale,
  TrendingDown,
  BarChart3,
  ListChecks,
  Users,
  Sliders,
  Share2,
  Sparkles,
  Zap,
  Lock,
  BellRing,
  Pencil,
  Check,
  Moon,
  Sun,
  Keyboard,
  Mail,
  Bell,
} from "lucide-react";

import Logo from "@/components/common/Logo";
import TranscriptInput from "./TranscriptInput";
import SessionList from "./SessionList";
import BalanceBar from "./BalanceBar";
import StatCards from "./StatCards";
import CommitmentsList from "./CommitmentsList";
import CommitmentsHub from "./CommitmentsHub";
import TrendChart from "./TrendChart";
import AnalysisSummary from "./AnalysisSummary";
import ManagerSettingsModal from "./ManagerSettingsModal";
import ShareModal from "./ShareModal";
import EditSessionModal from "./EditSessionModal";
import ProjectSwitcher from "./ProjectSwitcher";
import CarryForwardBanner from "./CarryForwardBanner";
import RadarBalanceChart from "./RadarBalanceChart";
import SessionHeatmap from "./SessionHeatmap";
import ReportHealthCard from "./ReportHealthCard";
import CommandPalette from "./CommandPalette";
import FollowUpModal from "./FollowUpModal";
import MeetingPrepModal from "./MeetingPrepModal";
import AudioUploadWidget from "./AudioUploadWidget";
import QuickActionsBar from "./QuickActionsBar";
import StreaksWidget from "./StreaksWidget";
import ActivityFeedDrawer from "./ActivityFeedDrawer";
import { computeToneTag } from "@/lib/toneTag";
import { useSessionPolling } from "@/lib/hooks/useSessionPolling";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { secureStorage } from "@/lib/secureStorage";
import type {
  SessionResponse,
  ReportResponse,
  TrendDataPoint,
  ActionItemStatus,
} from "@/lib/types";

const MANAGER_ID_KEY = "balance_manager_id";

export default function Dashboard() {
  const [managerId, setManagerId] = useState<string>("");
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionResponse | null>(null);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pollingSessionId, setPollingSessionId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<"dashboard" | "commitments" | "trends">("dashboard");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionResponse | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [threshold, setThreshold] = useState(60);
  const [retentionDays, setRetentionDays] = useState(180);
  // Inline threshold editing (Bug 1.7 fix)
  const [isEditingThreshold, setIsEditingThreshold] = useState(false);
  const [thresholdInput, setThresholdInput] = useState("60");
  const [showShortcutsHint, setShowShortcutsHint] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [isPrepOpen, setIsPrepOpen] = useState(false);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  const [showAudioWidget, setShowAudioWidget] = useState(false);
  const thresholdInputRef = useRef<HTMLInputElement>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Feature 6: Keyboard shortcuts
  useKeyboardShortcuts({
    onTab1: () => setActiveTab("dashboard"),
    onTab2: () => setActiveTab("commitments"),
    onTab3: () => setActiveTab("trends"),
    onEscape: () => {
      setIsSettingsOpen(false);
      setIsShareOpen(false);
      setIsEditModalOpen(false);
      setIsCommandPaletteOpen(false);
    },
    onSearch: () => {
      setIsCommandPaletteOpen(true);
    },
    onNewEntry: () => {
      setActiveTab("dashboard");
      document.querySelector<HTMLTextAreaElement>(".transcript-textarea")?.focus();
    },
  });

  const { session: polledSession, isPolling } = useSessionPolling(pollingSessionId);

  // Initialize: seed if needed, then load data & settings
  useEffect(() => {
    async function init() {
      try {
        const seedRes = await fetch("/api/seed", { method: "POST" });
        const seedData = await seedRes.json();

        let mId = secureStorage.getItem(MANAGER_ID_KEY);

        if (seedData.data?.managerId) {
          mId = seedData.data.managerId;
          secureStorage.setItem(MANAGER_ID_KEY, mId!);
        }

        if (mId) {
          setManagerId(mId);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error("Init error:", error);
        setIsInitialized(true);
      }
    }
    init();
  }, []);

  // Load manager settings
  useEffect(() => {
    if (!managerId) return;
    fetch(`/api/manager-settings?managerId=${managerId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.talkPctThreshold) {
          setThreshold(data.talkPctThreshold);
          setThresholdInput(String(data.talkPctThreshold));
        }
        if (data.retentionDays) setRetentionDays(data.retentionDays);
      })
      .catch(console.error);
  }, [managerId]);

  // Inline threshold save (Bug 1.7 fix)
  const handleSaveThreshold = async () => {
    const val = parseInt(thresholdInput, 10);
    if (isNaN(val) || val < 1 || val > 100) return;
    try {
      await fetch("/api/manager-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId, talkPctThreshold: val }),
      });
      setThreshold(val);
      setIsEditingThreshold(false);
      triggerToast(`Threshold updated to ${val}%`);
    } catch (e) {
      console.error("Threshold save error:", e);
    }
  };

  // Load reports
  useEffect(() => {
    if (!managerId) return;
    fetch(`/api/reports?managerId=${managerId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReports(data);
          if (data.length > 0 && !selectedReportId) {
            setSelectedReportId(data[0].id);
          }
        }
      })
      .catch(console.error);
  }, [managerId, selectedReportId]);

  // Load sessions
  const loadSessions = useCallback(() => {
    if (!managerId) return;
    fetch(`/api/sessions?managerId=${managerId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSessions(data);
          if (!selectedSession) {
            const latest = data.find((s: SessionResponse) => s.status === "processed");
            if (latest) {
              setSelectedSession(latest);
              setSelectedReportId(latest.reportId);
            }
          }
        }
      })
      .catch(console.error);
  }, [managerId, selectedSession]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Active report object
  const activeReport = useMemo(
    () => reports.find((r) => r.id === selectedReportId),
    [reports, selectedReportId]
  );

  // Load trend data
  useEffect(() => {
    if (!selectedReportId) return;
    fetch(`/api/reports/${selectedReportId}/trend`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTrendData(data);
        }
      })
      .catch(console.error);
  }, [selectedReportId]);

  const handleReportSelect = (reportId: string) => {
    setSelectedReportId(reportId);
    const latestForReport = sessions.find(
      (s) => s.reportId === reportId && s.status === "processed"
    );
    if (latestForReport) {
      setSelectedSession(latestForReport);
    }
  };

  // Handle polled session updates
  useEffect(() => {
    if (polledSession && polledSession.status !== "queued") {
      setPollingSessionId(null);
      setSelectedSession(polledSession);
      setSelectedReportId(polledSession.reportId);
      loadSessions();
      triggerToast("Transcript analysis complete!");
    }
  }, [polledSession, loadSessions]);

  // Submit transcript
  const handleSubmit = async (data: {
    transcript: string;
    reportId: string;
    projectId?: string | null;
    managerSpeakerName: string;
    occurredAt: string;
    label?: string;
  }) => {
    if (!managerId) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerId,
          reportId: data.reportId,
          projectId: data.projectId || undefined,
          occurredAt: data.occurredAt,
          transcript: data.transcript,
          managerSpeakerName: data.managerSpeakerName,
          label: data.label,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setPollingSessionId(result.id);
        setSelectedReportId(data.reportId);
        loadSessions();
        triggerToast("Transcript queued for AI analysis...");
      }
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateReport = async (displayName: string) => {
    if (!managerId) return;
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId, displayName }),
      });
      if (res.ok) {
        const newReport = await res.json();
        setReports((prev) => [...prev, newReport]);
        setSelectedReportId(newReport.id);
        triggerToast(`Added team member "${displayName}"`);
      }
    } catch (error) {
      console.error("Create report error:", error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        triggerToast("Session deleted successfully");
        setSessions((prev) => {
          const remaining = prev.filter((s) => s.id !== sessionId);
          if (selectedSession?.id === sessionId) {
            const nextMatch = remaining.find((s) => s.reportId === selectedReportId) || remaining[0] || null;
            setSelectedSession(nextMatch);
          }
          return remaining;
        });

        if (selectedReportId) {
          fetch(`/api/reports/${selectedReportId}/trend`)
            .then((r) => r.json())
            .then((data) => {
              if (Array.isArray(data)) setTrendData(data);
            })
            .catch(console.error);
        }
      }
    } catch (error) {
      console.error("Delete session error:", error);
    }
  };

  const handleSessionUpdated = (updatedSession: SessionResponse) => {
    triggerToast("Conversation updated!");
    setSessions((prev) => prev.map((s) => (s.id === updatedSession.id ? updatedSession : s)));
    if (selectedSession?.id === updatedSession.id) {
      setSelectedSession(updatedSession);
    }
    loadSessions();
  };

  const handleActionItemStatusChange = async (id: string, status: ActionItemStatus) => {
    try {
      await fetch(`/api/action-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      loadSessions();
      if (selectedSession) {
        const res = await fetch(`/api/sessions/${selectedSession.id}`);
        if (res.ok) {
          const updated = await res.json();
          setSelectedSession(updated);
        }
      }
      triggerToast(`Commitment marked as ${status}`);
    } catch (error) {
      console.error("Update action item error:", error);
    }
  };

  const filteredProjectSessions = useMemo(() => {
    if (!selectedProjectId) return sessions;
    return sessions.filter((s) => s.projectId === selectedProjectId);
  }, [sessions, selectedProjectId]);

  const metrics = selectedSession?.metrics;
  const actionItems = selectedSession?.actionItems || [];
  const toneTag = metrics ? computeToneTag(metrics) : null;

  const averageTalkPct = useMemo(() => {
    const processed = sessions.filter((s) => s.metrics);
    if (processed.length === 0) return 50;
    const sum = processed.reduce((acc, s) => acc + (s.metrics?.managerTalkPct || 0), 0);
    return Math.round(sum / processed.length);
  }, [sessions]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF4F6] text-[#241830]">
        <div className="text-center space-y-4">
          <Scale className="w-12 h-12 mx-auto text-[#8B6FBD] animate-pulse" />
          <p className="text-base font-semibold text-[#665578]">Loading 1:1 Balance Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#FFF4F6] text-[#241830] font-sans antialiased pb-16"
    >
      {/* Top Black Navigation Bar */}
      <div className="apple-global-nav w-full px-6 flex items-center justify-between z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
          <span className="font-extrabold text-xs text-white tracking-wider">1:1 BALANCE STUDIO</span>
          <span className="text-xs text-[#C3B1E1] hidden sm:inline font-semibold">Executive Communication Analysis</span>
        </div>
      </div>

      {/* Frosted Sub-Nav Header */}
      <div className="apple-sub-nav sticky top-0 w-full z-40 px-4 sm:px-8 flex items-center justify-between shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Logo size="md" />

          {/* Navigation Pill Switcher */}
          <nav className="flex items-center gap-1.5 bg-[#FCE4E8] p-1.5 rounded-full border border-[#F5BEC6]">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                activeTab === "dashboard"
                  ? "bg-[#8B6FBD] text-white shadow-md shadow-[#8B6FBD]/30"
                  : "text-[#665578] hover:text-[#241830] hover:bg-[#FFFFFF]/50"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("commitments")}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                activeTab === "commitments"
                  ? "bg-[#8B6FBD] text-white shadow-md shadow-[#8B6FBD]/30"
                  : "text-[#665578] hover:text-[#241830] hover:bg-[#FFFFFF]/50"
              }`}
            >
              Commitments
            </button>
            <button
              onClick={() => setActiveTab("trends")}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                activeTab === "trends"
                  ? "bg-[#8B6FBD] text-white shadow-md shadow-[#8B6FBD]/30"
                  : "text-[#665578] hover:text-[#241830] hover:bg-[#FFFFFF]/50"
              }`}
            >
              Analytics
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden xl:flex items-center gap-1.5 text-xs font-semibold text-[#665578] bg-[#FCE4E8] border border-[#F5BEC6] px-3.5 py-1.5 rounded-full">
              <Lock className="w-3.5 h-3.5 text-[#8B6FBD]" />
              <span>Private & Encrypted</span>
            </div>

            {selectedSession && (
              <>
                <button
                  onClick={() => setIsFollowUpOpen(true)}
                  className="apple-btn-secondary text-xs py-1.5 px-3.5 h-9"
                  title="Generate Follow-up Email or Slack Summary"
                >
                  <Mail className="w-3.5 h-3.5 text-[#E06D83]" />
                  Follow-up
                </button>
                <button
                  onClick={() => setIsShareOpen(true)}
                  className="apple-btn-primary text-xs py-1.5 px-4 h-9"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </button>
              </>
            )}

            <button
              onClick={() => setIsPrepOpen(true)}
              className="apple-btn-secondary text-xs py-1.5 px-3.5 h-9"
              title="1:1 Meeting Prep Assistant"
            >
              <Zap className="w-3.5 h-3.5 text-[#8B6FBD]" />
              Prep Assistant
            </button>

            {/* Activity Feed Drawer button */}
            <button
              onClick={() => setIsActivityDrawerOpen(true)}
              title="Activity Feed & Insights"
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-[#F5BEC6] bg-[#FFF4F6] hover:bg-[#FCE4E8] text-[#8B6FBD] transition-all hover:scale-105 relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E06D83]" />
            </button>

            {/* Keyboard shortcut hint button */}
            <button
              onClick={() => setShowShortcutsHint((v) => !v)}
              title="Keyboard Shortcuts"
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-[#F5BEC6] bg-[#FFF4F6] hover:bg-[#FCE4E8] text-[#665578] transition-all hover:scale-105"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="apple-btn-secondary text-xs py-1.5 px-4 h-9"
            >
              <Sliders className="w-3.5 h-3.5" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Feature 6: Keyboard shortcuts legend */}
      {showShortcutsHint && (
        <div className="fixed top-24 right-6 z-50 w-64 bg-white border border-[#F5BEC6] rounded-2xl shadow-2xl p-4 animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-extrabold text-[#241830]">⌨️ Keyboard Shortcuts</p>
            <button onClick={() => setShowShortcutsHint(false)} className="text-[#665578] hover:text-[#241830] text-lg leading-none">×</button>
          </div>
          <div className="space-y-1.5">
            {[
              ["⌘ 1", "Dashboard"],
              ["⌘ 2", "Commitments"],
              ["⌘ 3", "Analytics"],
              ["⌘ K", "Search items"],
              ["⌘ N", "New transcript"],
              ["Esc", "Close modals"],
            ].map(([key, action]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#FCE4E8] text-[#8B6FBD] font-mono">{key}</span>
                <span className="text-[11px] font-semibold text-[#665578]">{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hero Header Tile */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="apple-hero-tile p-8 sm:p-12 relative overflow-hidden border border-[#F5BEC6]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFFFFF] border border-[#F5BEC6] text-[#8B6FBD] text-xs font-bold shadow-xs">
              <Zap className="w-3.5 h-3.5 text-[#8B6FBD]" />
              <span>1:1 Self-Correction & Intelligence Studio</span>
            </div>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="space-y-3 max-w-2xl">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#241830] leading-tight tracking-tight">
                  Balance Your 1:1 Meetings. <br />
                  <span className="text-[#8B6FBD]">Empower Your Team.</span>
                </h1>
                <p className="text-base sm:text-lg text-[#665578] font-medium leading-relaxed">
                  Track talk-time ratios, question counts, and extracted commitments seamlessly. All data is encrypted locally on your machine.
                </p>
              </div>

              {/* Floating Metric Highlights */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="bg-[#FFFFFF] border border-[#F5BEC6] px-5 py-4 rounded-2xl min-w-[140px] text-center shadow-md shadow-[#8B6FBD]/5">
                  <p className="text-xs font-bold text-[#665578] uppercase tracking-wider">Avg Manager Talk</p>
                  <p className="text-2xl font-extrabold text-[#E06D83] mt-1">{averageTalkPct}%</p>
                </div>
                <div className="bg-[#FFFFFF] border border-[#F5BEC6] px-5 py-4 rounded-2xl min-w-[140px] text-center shadow-md shadow-[#8B6FBD]/5">
                  <p className="text-xs font-bold text-[#665578] uppercase tracking-wider">Direct Reports</p>
                  <p className="text-2xl font-extrabold text-[#8B6FBD] mt-1">{reports.length}</p>
                </div>
                {/* Bug 1.7 fix: Inline editable threshold */}
                <div className="bg-[#FFFFFF] border border-[#F5BEC6] px-5 py-4 rounded-2xl min-w-[160px] text-center shadow-md shadow-[#8B6FBD]/5">
                  <p className="text-xs font-bold text-[#665578] uppercase tracking-wider">Target Threshold</p>
                  {isEditingThreshold ? (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <input
                        ref={thresholdInputRef}
                        type="number"
                        min={1}
                        max={100}
                        value={thresholdInput}
                        onChange={(e) => setThresholdInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveThreshold(); if (e.key === "Escape") setIsEditingThreshold(false); }}
                        className="w-14 text-center text-lg font-extrabold text-[#241830] border border-[#8B6FBD] rounded-lg px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#8B6FBD]"
                        autoFocus
                      />
                      <span className="text-lg font-extrabold text-[#241830]">%</span>
                      <button onClick={handleSaveThreshold} className="ml-1 p-1 rounded-lg bg-[#8B6FBD] text-white hover:scale-105 transition-all">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 mt-1 group cursor-pointer" onClick={() => { setIsEditingThreshold(true); setThresholdInput(String(threshold)); }}>
                      <span className="text-2xl font-extrabold text-[#241830]">{threshold}%</span>
                      <Pencil className="w-3.5 h-3.5 text-[#C3B1E1] group-hover:text-[#8B6FBD] transition-colors" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Workspace Switcher */}
        <ProjectSwitcher
          managerId={managerId}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
        />

        {/* Streaks & Achievement Milestone Badges */}
        <StreaksWidget sessions={filteredProjectSessions} threshold={threshold} />

        {/* Main Content View Switcher */}
        {activeTab === "commitments" ? (
          <div className="animate-fade-in-up">
            <CommitmentsHub sessions={filteredProjectSessions} onStatusChange={handleActionItemStatusChange} />
          </div>
        ) : activeTab === "trends" ? (
          <div className="space-y-6 animate-fade-in-up">
            {/* Row 1: Health Score + Trend Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Feature 5: Report Health Score */}
              <div className="lg:col-span-4">
                <ReportHealthCard
                  sessions={filteredProjectSessions.filter((s) => s.reportId === selectedReportId)}
                  threshold={threshold}
                  reportName={activeReport?.displayName || "Report"}
                />
              </div>

              {/* Trend Chart */}
              <div className="lg:col-span-8">
                <Card className="apple-card">
                  <CardHeader className="pb-4 pt-6 px-6 border-b border-[#F5BEC6]">
                    <CardTitle className="text-base font-extrabold text-[#241830] flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-[#8B6FBD]" />
                      Talk-Time &amp; Question Trends — {activeReport?.displayName || "Team"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <TrendChart data={trendData} threshold={threshold} />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Row 2: Feature 4 — Radar Chart + Session Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Balance Chart */}
              <Card className="apple-card">
                <CardHeader className="pb-4 pt-6 px-6 border-b border-[#F5BEC6]">
                  <CardTitle className="text-base font-extrabold text-[#241830] flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#8B6FBD]" />
                    Engagement Balance Radar
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {metrics ? (
                    <RadarBalanceChart
                      managerTalkPct={metrics.managerTalkPct}
                      reportTalkPct={metrics.reportTalkPct}
                      managerQuestions={metrics.managerQuestions}
                      reportQuestions={metrics.reportQuestions}
                      managerTopics={metrics.managerInitiatedTopics}
                      reportTopics={metrics.reportInitiatedTopics}
                      managerCompletions={actionItems.filter((a) => a.status === "done" && a.speakerRole === "manager").length}
                      reportCompletions={actionItems.filter((a) => a.status === "done" && a.speakerRole === "report").length}
                      reportName={selectedSession?.report?.displayName || "Report"}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-[#665578] text-xs font-semibold gap-2">
                      <Scale className="w-8 h-8 opacity-30" />
                      Select a session to see the engagement radar
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Session Heatmap */}
              <Card className="apple-card">
                <CardHeader className="pb-4 pt-6 px-6 border-b border-[#F5BEC6]">
                  <CardTitle className="text-base font-extrabold text-[#241830] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#E06D83]" />
                    Session Frequency Heatmap
                    <span className="text-[10px] font-semibold text-[#8E7E9E] ml-1">last 4 months</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <SessionHeatmap sessions={filteredProjectSessions} />
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-[#FFF4F6] border border-[#F5BEC6]">
                      <p className="text-[10px] font-extrabold text-[#665578] uppercase tracking-wider">Sessions</p>
                      <p className="text-xl font-extrabold text-[#241830]">{filteredProjectSessions.filter((s) => s.status === "processed").length}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FFF4F6] border border-[#F5BEC6]">
                      <p className="text-[10px] font-extrabold text-[#665578] uppercase tracking-wider">Open Items</p>
                      <p className="text-xl font-extrabold text-[#E06D83]">
                        {filteredProjectSessions.flatMap((s) => s.actionItems).filter((a) => a.status === "open").length}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FFF4F6] border border-[#F5BEC6]">
                      <p className="text-[10px] font-extrabold text-[#665578] uppercase tracking-wider">Done</p>
                      <p className="text-xl font-extrabold text-[#8B6FBD]">
                        {filteredProjectSessions.flatMap((s) => s.actionItems).filter((a) => a.status === "done").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Main Dashboard Layout Grid */
          <div className="space-y-8">
            {/* ROW 1: Ingestion Studio (Left 7) + Session History (Right 5) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-7">
                <Card className="apple-card h-full flex flex-col">
                  <CardHeader className="pb-4 pt-6 px-6 border-b border-[#F5BEC6] flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-extrabold text-[#241830] flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#FCE4E8] border border-[#F5BEC6] flex items-center justify-center text-[#8B6FBD]">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      1:1 Transcript Ingestion Studio
                    </CardTitle>
                    <button
                      type="button"
                      onClick={() => setShowAudioWidget((v) => !v)}
                      className="text-[11px] font-extrabold px-3 py-1 rounded-xl bg-[#FCE4E8] text-[#8B6FBD] hover:bg-[#8B6FBD] hover:text-white border border-[#F5BEC6] transition-all flex items-center gap-1"
                    >
                      🎙️ {showAudioWidget ? "Hide Audio Mode" : "Voice / Audio Mode"}
                    </button>
                  </CardHeader>
                  <CardContent className="px-6 py-6 flex-1 space-y-4">
                    {showAudioWidget && (
                      <AudioUploadWidget
                        onTranscriptGenerated={(text) => {
                          const textarea = document.querySelector<HTMLTextAreaElement>(".transcript-textarea");
                          if (textarea) {
                            textarea.value = text;
                            textarea.dispatchEvent(new Event("input", { bubbles: true }));
                          }
                          triggerToast("Voice audio transcribed into conversation editor!");
                        }}
                      />
                    )}
                    {/* Feature #1: Carry-forward banner for open items from last session */}
                    {selectedReportId && managerId && activeReport && (
                      <CarryForwardBanner
                        reportId={selectedReportId}
                        reportName={activeReport.displayName}
                        managerId={managerId}
                      />
                    )}
                    <TranscriptInput
                      reports={reports}
                      selectedReportId={selectedReportId}
                      selectedProjectId={selectedProjectId}
                      onSelectReport={handleReportSelect}
                      onSubmit={handleSubmit}
                      isSubmitting={isSubmitting || isPolling}
                      onCreateReport={handleCreateReport}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-5">
                <Card className="apple-card h-full flex flex-col">
                  <CardHeader className="pb-4 pt-6 px-6 border-b border-[#F5BEC6] flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-extrabold text-[#241830] flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#8B6FBD]" />
                      Session History
                    </CardTitle>
                    {filteredProjectSessions.length > 0 && (
                      <span className="text-xs font-bold text-[#8B6FBD] bg-[#FCE4E8] px-3 py-1 rounded-full border border-[#F5BEC6]">
                        {filteredProjectSessions.length} sessions
                      </span>
                    )}
                  </CardHeader>
                  <CardContent className="px-6 py-6 flex-1">
                    <SessionList
                      sessions={filteredProjectSessions}
                      selectedSessionId={selectedSession?.id || null}
                      onSelectSession={setSelectedSession}
                      onEditSession={(s) => {
                        setEditingSession(s);
                        setIsEditModalOpen(true);
                      }}
                      onDeleteSession={handleDeleteSession}
                      selectedReportId={selectedReportId}
                      reportNameFilter={activeReport?.displayName}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* ROW 2: Talk-Time Balance Visualizer (Left 6) + Question & Topic Split Cards (Right 6) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-6">
                <Card className="apple-card h-full flex flex-col">
                  <CardHeader className="pb-4 pt-6 px-6 border-b border-[#F5BEC6] flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-extrabold text-[#241830] flex items-center gap-2">
                      <Scale className="w-4 h-4 text-[#8B6FBD]" />
                      Talk-Time Balance Visualizer
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {toneTag && (
                        <span
                          className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1"
                          style={{
                            color: toneTag.color,
                            backgroundColor: toneTag.bg,
                            borderColor: toneTag.border,
                          }}
                          title={toneTag.description}
                        >
                          <span>{toneTag.emoji}</span>
                          <span>{toneTag.label}</span>
                        </span>
                      )}
                      {selectedSession?.report && (
                        <span className="text-xs font-bold text-[#665578] flex items-center gap-1 bg-[#FCE4E8] px-3 py-1 rounded-full border border-[#F5BEC6]">
                          <Users className="w-3.5 h-3.5 text-[#8B6FBD]" />
                          {selectedSession.report.displayName}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 py-6 flex-1 flex flex-col justify-center">
                    {metrics ? (
                      <BalanceBar
                        managerPct={metrics.managerTalkPct}
                        reportPct={metrics.reportTalkPct}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-[#665578] text-sm space-y-2">
                        {isPolling ? (
                          <div className="flex items-center gap-3">
                            <div className="uiverse-loader">
                              <span className="uiverse-loader-dot" />
                              <span className="uiverse-loader-dot" />
                              <span className="uiverse-loader-dot" />
                            </div>
                            <span className="font-bold text-[#241830]">Analyzing transcript with AI...</span>
                          </div>
                        ) : (
                          <>
                            <Scale className="w-8 h-8 opacity-40 text-[#8B6FBD]" />
                            <p className="text-xs font-semibold text-[#665578]">Select a session from history or submit a transcript</p>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-6">
                {metrics ? (
                  <StatCards
                    managerQuestions={metrics.managerQuestions}
                    reportQuestions={metrics.reportQuestions}
                    managerTopics={metrics.managerInitiatedTopics}
                    reportTopics={metrics.reportInitiatedTopics}
                    actionItemCount={actionItems.length}
                    flagged={metrics.flagged}
                  />
                ) : (
                  <Card className="apple-card h-full flex flex-col justify-center items-center p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#FCE4E8] border border-[#F5BEC6] text-[#8B6FBD]">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-[#241830]">
                        Conversation Metrics &amp; Agenda Split
                      </p>
                      <p className="text-xs text-[#665578] font-semibold mt-1 max-w-xs leading-relaxed">
                        Select a session from history on the left to inspect questions asked, agenda origins, and talk ratios.
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {/* ROW 3: AI Session Summary (Left 6) + Extracted Commitments (Right 6) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-6">
                {metrics?.summary ? (
                  <Card className="apple-card h-full flex flex-col">
                    <CardHeader className="pb-4 pt-6 px-6 border-b border-[#F5BEC6]">
                      <CardTitle className="text-base font-extrabold text-[#241830] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#8B6FBD]" />
                        AI Session Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 py-6 flex-1">
                      <AnalysisSummary
                        summary={metrics.summary}
                        flagged={metrics.flagged}
                        flagReason={metrics.flagReason}
                      />
                      {selectedSession?.notes && (
                        <div className="mt-4 p-4 rounded-2xl bg-[#FFF4F6] border border-[#F5BEC6] space-y-1.5">
                          <p className="text-[11px] font-extrabold text-[#665578] uppercase tracking-wider flex items-center gap-1.5">
                            <span>📝</span> Session Agenda &amp; Notes
                          </p>
                          <p className="text-xs font-semibold text-[#241830] whitespace-pre-wrap leading-relaxed">
                            {selectedSession.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="apple-card h-full flex flex-col justify-center items-center p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#FCE4E8] border border-[#F5BEC6] text-[#8B6FBD]">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-[#241830]">
                        AI Executive Summary Intelligence
                      </p>
                      <p className="text-xs text-[#665578] font-semibold mt-1 max-w-xs leading-relaxed">
                        Automatic multi-paragraph takeaways and key alignment points will display here once transcript analysis completes.
                      </p>
                    </div>
                  </Card>
                )}
              </div>

              <div className="lg:col-span-6">
                {actionItems.length > 0 ? (
                  <Card className="apple-card h-full flex flex-col">
                    <CardHeader className="pb-4 pt-6 px-6 border-b border-[#F5BEC6] flex flex-row items-center justify-between">
                      <CardTitle className="text-base font-extrabold text-[#241830] flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-[#E06D83]" />
                        Extracted Commitments
                      </CardTitle>
                      <span className="text-xs font-semibold text-[#665578] bg-[#FCE4E8] px-3 py-1 rounded-full">
                        {actionItems.filter((a) => a.status === "open").length} open items
                      </span>
                    </CardHeader>
                    <CardContent className="px-6 py-6 flex-1">
                      <CommitmentsList
                        actionItems={actionItems}
                        onStatusChange={handleActionItemStatusChange}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="apple-card h-full flex flex-col justify-center items-center p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#FCE4E8] border border-[#F5BEC6] text-[#E06D83]">
                      <ListChecks className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-[#241830]">
                        Extracted Action Items &amp; Commitments
                      </p>
                      <p className="text-xs text-[#665578] font-semibold mt-1 max-w-xs leading-relaxed">
                        Action items extracted from transcripts or added manually will be organized here by ownership and due date.
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {/* ROW 4: Trend Chart with per-report dropdown (Feature #4) */}
            <Card className="apple-card">
              <CardHeader className="pb-4 pt-6 px-6 border-b border-[#F5BEC6] flex flex-row items-center justify-between">
                <CardTitle className="text-base font-extrabold text-[#241830] flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-[#8B6FBD]" />
                  Talk-Time & Question Trend Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 py-6">
                <TrendChart
                  data={trendData}
                  threshold={threshold}
                  reports={reports}
                  selectedReportId={selectedReportId}
                  onSelectReport={handleReportSelect}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Toast Popup Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#FFFFFF] text-[#241830] text-xs font-extrabold px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#F5BEC6] backdrop-blur-xl animate-fade-in-up">
          <BellRing className="w-4 h-4 text-[#8B6FBD]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <ManagerSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        managerId={managerId}
        currentThreshold={threshold}
        currentRetention={retentionDays}
        onSettingsSaved={(th, ret) => {
          setThreshold(th);
          setRetentionDays(ret);
          triggerToast("Settings saved successfully!");
        }}
        onTriggerPrune={loadSessions}
      />

      <ShareModal
        session={selectedSession}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      <EditSessionModal
        session={editingSession}
        reports={reports}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSessionUpdated={handleSessionUpdated}
        onSessionDeleted={handleDeleteSession}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        sessions={sessions}
        reports={reports}
        onSelectSession={setSelectedSession}
        onSelectReport={setSelectedReportId}
      />

      <FollowUpModal
        session={selectedSession}
        isOpen={isFollowUpOpen}
        onClose={() => setIsFollowUpOpen(false)}
      />

      <MeetingPrepModal
        reports={reports}
        isOpen={isPrepOpen}
        onClose={() => setIsPrepOpen(false)}
        managerId={managerId}
        onLoadAgenda={(reportId, agendaText) => {
          setSelectedReportId(reportId);
          setActiveTab("dashboard");
          triggerToast("Agenda loaded! Paste your transcript above to begin.");
        }}
      />

      <ActivityFeedDrawer
        isOpen={isActivityDrawerOpen}
        onClose={() => setIsActivityDrawerOpen(false)}
        sessions={filteredProjectSessions}
        onSelectSession={setSelectedSession}
      />

      <QuickActionsBar
        onOpenPrep={() => setIsPrepOpen(true)}
        onOpenCommand={() => setIsCommandPaletteOpen(true)}
        onFocusTranscript={() => {
          setActiveTab("dashboard");
          document.querySelector<HTMLTextAreaElement>(".transcript-textarea")?.focus();
        }}
        onSwitchTab={(t) => setActiveTab(t)}
      />
    </div>
  );
}
