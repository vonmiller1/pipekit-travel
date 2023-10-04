"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Logo from "@/components/common/Logo";
import { secureStorage } from "@/lib/secureStorage";
import TrendChart from "@/components/dashboard/TrendChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingDown,
  Users,
  Scale,
  BarChart3,
  ArrowLeft,
  MessageSquare,
  HelpCircle,
  AlertTriangle,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import type { SessionResponse, ReportResponse, TrendDataPoint } from "@/lib/types";

const MANAGER_ID_KEY = "balance_manager_id";

export default function AnalyticsPage() {
  const [managerId, setManagerId] = useState("");
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [selectedReportId, setSelectedReportId] = useState("");
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [threshold, setThreshold] = useState(60);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize: load or seed manager ID
  useEffect(() => {
    async function initManager() {
      try {
        let mId = secureStorage.getItem(MANAGER_ID_KEY) || "";

        if (!mId) {
          const seedRes = await fetch("/api/seed", { method: "POST" });
          const seedData = await seedRes.json();
          if (seedData.data?.managerId) {
            mId = seedData.data.managerId;
            secureStorage.setItem(MANAGER_ID_KEY, mId);
          }
        }

        if (mId) {
          setManagerId(mId);

          // Fetch Settings
          fetch(`/api/manager-settings?managerId=${mId}`)
            .then((r) => r.json())
            .then((data) => {
              if (data && data.talkPctThreshold) setThreshold(data.talkPctThreshold);
            })
            .catch(console.error);

          // Fetch Reports
          const reportsRes = await fetch(`/api/reports?managerId=${mId}`);
          const reportsData = await reportsRes.json();
          if (Array.isArray(reportsData)) {
            setReports(reportsData);
            if (reportsData.length > 0) {
              setSelectedReportId(reportsData[0].id);
            }
          }

          // Fetch Sessions
          const sessionsRes = await fetch(`/api/sessions?managerId=${mId}`);
          const sessionsData = await sessionsRes.json();
          if (Array.isArray(sessionsData)) {
            setSessions(sessionsData);
          }
        }
      } catch (err) {
        console.error("Analytics init error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    initManager();
  }, []);

  // Fetch trend data whenever selectedReportId changes
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

  const activeReport = useMemo(
    () => reports.find((r) => r.id === selectedReportId),
    [reports, selectedReportId]
  );

  const reportSessions = useMemo(
    () => sessions.filter((s) => s.reportId === selectedReportId && s.metrics),
    [sessions, selectedReportId]
  );

  const avgManagerTalk = useMemo(() => {
    if (reportSessions.length === 0) return 50;
    const sum = reportSessions.reduce(
      (acc, s) => acc + (s.metrics?.managerTalkPct || 0),
      0
    );
    return Math.round(sum / reportSessions.length);
  }, [reportSessions]);

  const avgQuestions = useMemo(() => {
    if (reportSessions.length === 0) return { mgr: 0, rpt: 0 };
    const mgrSum = reportSessions.reduce((acc, s) => acc + (s.metrics?.managerQuestions || 0), 0);
    const rptSum = reportSessions.reduce((acc, s) => acc + (s.metrics?.reportQuestions || 0), 0);
    return {
      mgr: (mgrSum / reportSessions.length).toFixed(1),
      rpt: (rptSum / reportSessions.length).toFixed(1),
    };
  }, [reportSessions]);

  const flaggedCount = useMemo(() => {
    return reportSessions.filter((s) => s.metrics?.flagged).length;
  }, [reportSessions]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Logo size="md" />
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold text-[#1d1d1f] bg-white/5 border border-[#e0e0e0] hover:border-white/20 hover:text-white transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 text-[#0066cc]" />
          Back to Dashboard
        </Link>
      </div>

      {/* Analytics Hero Canvas */}
      <div
        className="p-6 sm:p-8 rounded-3xl border border-[#e0e0e0] relative overflow-hidden space-y-6"
        style={{
          background: "linear-gradient(160deg, #0C1524 0%, #070D18 100%)",
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.8)",
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0066cc]/15 border border-[#0066cc]/30 text-[#0066cc] text-xs font-extrabold mb-3">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Team Behavioral Analytics & Trends</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              1:1 Talk-Time & Question Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl mt-1">
              Analyze multi-week talk ratios, monitor agenda balance, and track question trends for each of your direct reports over time.
            </p>
          </div>

          {/* Team Member Selector */}
          <div className="space-y-1.5 w-full md:w-72 shrink-0">
            <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#C3B1E1]" />
              Select Direct Report
            </label>
            <div className="relative">
              <select
                value={selectedReportId}
                onChange={(e) => setSelectedReportId(e.target.value)}
                className="w-full h-11 pl-4 pr-10 text-xs font-bold text-white rounded-2xl border border-white/10 appearance-none focus:outline-none focus:ring-2 focus:ring-[#8B6FBD] transition-all cursor-pointer"
                style={{ background: "rgba(255, 255, 255, 0.08)" }}
              >
                {reports.length === 0 && (
                  <option value="" disabled className="text-slate-400">
                    Loading direct reports...
                  </option>
                )}
                {reports.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[#241830] text-white">
                    {r.displayName}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="glass-panel glass-panel-hover rounded-3xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-extrabold text-[#665578] uppercase tracking-wider">Avg Manager Talk</p>
              <p className="text-3xl font-extrabold mt-1" style={{ color: avgManagerTalk > threshold ? "#E06D83" : "#8B6FBD" }}>
                {avgManagerTalk}%
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#FF6B35]/15 text-[#FF6B35]">
              <Scale className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel glass-panel-hover rounded-3xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-extrabold text-[#665578] uppercase tracking-wider">Analyzed Sessions</p>
              <p className="text-3xl font-extrabold text-[#8B6FBD] mt-1">{reportSessions.length}</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#8B6FBD]/10 text-[#8B6FBD]">
              <BarChart3 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel glass-panel-hover rounded-3xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-extrabold text-[#665578] uppercase tracking-wider">Avg Questions / Sync</p>
              <p className="text-2xl font-extrabold text-[#241830] mt-1">
                {avgQuestions.mgr} <span className="text-xs text-[#665578] font-semibold">Mgr</span> / {avgQuestions.rpt} <span className="text-xs text-[#665578] font-semibold">Rpt</span>
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
              <HelpCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel glass-panel-hover rounded-3xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-extrabold text-[#665578] uppercase tracking-wider">Target Threshold</p>
              <p className="text-3xl font-extrabold text-[#241830] mt-1">{threshold}% Max</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#8B6FBD]/10 text-[#8B6FBD]">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recharts Historical Trend Line Chart */}
      <Card className="glass-panel glass-panel-hover rounded-3xl overflow-hidden">
        <CardHeader className="pb-4 pt-6 px-8 border-b border-[#F5BEC6] flex flex-row items-center justify-between">
          <CardTitle className="text-base font-extrabold text-[#241830] flex items-center gap-2.5">
            <TrendingDown className="w-5 h-5 text-[#8B6FBD]" />
            Historical Talk-Time & Question Ratio Trends — {activeReport?.displayName || "Direct Report"}
          </CardTitle>
          {flaggedCount > 0 && (
            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#FFE3E8] border border-[#F5BEC6] text-[#E06D83]">
              ⚠️ {flaggedCount} Session(s) Flagged
            </span>
          )}
        </CardHeader>
        <CardContent className="p-8">
          <TrendChart data={trendData} threshold={threshold} />
        </CardContent>
      </Card>
    </div>
  );
}
