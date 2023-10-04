"use client";

import { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import Logo from "@/components/common/Logo";
import { secureStorage } from "@/lib/secureStorage";
import ReportHealthCard from "@/components/dashboard/ReportHealthCard";
import SessionList from "@/components/dashboard/SessionList";
import TrendChart from "@/components/dashboard/TrendChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  UserCircle,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Printer,
  TrendingDown,
  Scale,
  ListChecks,
} from "lucide-react";
import type { SessionResponse, ReportResponse, TrendDataPoint } from "@/lib/types";

const MANAGER_ID_KEY = "balance_manager_id";

export default function DirectReportProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const reportId = resolvedParams.id;

  const [managerId, setManagerId] = useState("");
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [threshold, setThreshold] = useState(60);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
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
              if (data?.talkPctThreshold) setThreshold(data.talkPctThreshold);
            })
            .catch(console.error);

          // Fetch Reports
          const reportsRes = await fetch(`/api/reports?managerId=${mId}`);
          const reportsData = await reportsRes.json();
          if (Array.isArray(reportsData)) setReports(reportsData);

          // Fetch Sessions for this report
          const sessionsRes = await fetch(`/api/reports/${reportId}/sessions`);
          const sessionsData = await sessionsRes.json();
          if (Array.isArray(sessionsData)) setSessions(sessionsData);

          // Fetch Trend
          const trendRes = await fetch(`/api/reports/${reportId}/trend`);
          const trendDataRes = await trendRes.json();
          if (Array.isArray(trendDataRes)) setTrendData(trendDataRes);
        }
      } catch (e) {
        console.error("Profile page init error:", e);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [reportId]);

  const report = useMemo(
    () => reports.find((r) => r.id === reportId),
    [reports, reportId]
  );

  const reportName = report?.displayName || "Direct Report";

  const allActionItems = useMemo(
    () => sessions.flatMap((s) => s.actionItems || []),
    [sessions]
  );

  const openActionItems = useMemo(
    () => allActionItems.filter((item) => item.status === "open"),
    [allActionItems]
  );

  const completedActionItems = useMemo(
    () => allActionItems.filter((item) => item.status === "done"),
    [allActionItems]
  );

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF4F6] text-[#241830]">
        <div className="text-center space-y-3">
          <UserCircle className="w-10 h-10 mx-auto text-[#8B6FBD] animate-pulse" />
          <p className="text-xs font-extrabold text-[#665578]">Loading Direct Report Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up print:p-0 print:m-0 print:max-w-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between print:hidden">
        <Logo size="md" />
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold text-[#8B6FBD] bg-white border border-[#F5BEC6] hover:bg-[#FCE4E8] transition-all"
          >
            <Printer className="w-4 h-4" />
            Print Executive Report
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold text-[#241830] bg-[#FFF4F6] border border-[#F5BEC6] hover:bg-[#FCE4E8] transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-[#8B6FBD]" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Profile Hero Header Tile */}
      <div className="apple-hero-tile p-8 sm:p-10 relative overflow-hidden border border-[#F5BEC6]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-[#FCE4E8] border border-[#F5BEC6] flex items-center justify-center text-[#8B6FBD] shadow-md">
              <UserCircle className="w-10 h-10" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFF4F6] border border-[#F5BEC6] text-[#8B6FBD] text-[10px] font-extrabold uppercase tracking-wider mb-1">
                Direct Report Profile
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#241830]">
                {reportName}
              </h1>
              <p className="text-xs text-[#665578] font-semibold mt-0.5">
                Member since {report?.createdAt ? new Date(report.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Recent"}
              </p>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white border border-[#F5BEC6] px-4 py-3 rounded-2xl text-center min-w-[110px] shadow-xs">
              <p className="text-[10px] font-extrabold text-[#665578] uppercase">Sessions</p>
              <p className="text-xl font-extrabold text-[#241830] mt-0.5">{sessions.length}</p>
            </div>
            <div className="bg-white border border-[#F5BEC6] px-4 py-3 rounded-2xl text-center min-w-[110px] shadow-xs">
              <p className="text-[10px] font-extrabold text-[#665578] uppercase">Open Items</p>
              <p className="text-xl font-extrabold text-[#E06D83] mt-0.5">{openActionItems.length}</p>
            </div>
            <div className="bg-white border border-[#F5BEC6] px-4 py-3 rounded-2xl text-center min-w-[110px] shadow-xs">
              <p className="text-[10px] font-extrabold text-[#665578] uppercase">Completed</p>
              <p className="text-xl font-extrabold text-[#8B6FBD] mt-0.5">{completedActionItems.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Health Card (Left 4) + Trend Chart (Right 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6">
          <ReportHealthCard
            sessions={sessions}
            threshold={threshold}
            reportName={reportName}
          />
        </div>

        <div className="lg:col-span-8">
          <Card className="apple-card">
            <CardHeader className="pb-4 pt-6 px-6 border-b border-[#F5BEC6]">
              <CardTitle className="text-base font-extrabold text-[#241830] flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-[#8B6FBD]" />
                Talk-Time & Question Ratios — {reportName}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <TrendChart data={trendData} threshold={threshold} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Session History & Action Items Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Session List */}
        <div className="lg:col-span-6">
          <Card className="apple-card">
            <CardHeader className="pb-4 pt-6 px-6 border-b border-[#F5BEC6]">
              <CardTitle className="text-base font-extrabold text-[#241830] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#8B6FBD]" />
                Session History ({sessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <SessionList
                sessions={sessions}
                selectedSessionId={null}
                onSelectSession={() => {}}
                selectedReportId={reportId}
                reportNameFilter={reportName}
              />
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        <div className="lg:col-span-6">
          <Card className="apple-card">
            <CardHeader className="pb-4 pt-6 px-6 border-b border-[#F5BEC6]">
              <CardTitle className="text-base font-extrabold text-[#241830] flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-[#E06D83]" />
                Commitments & Action Items ({allActionItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3 max-h-[420px] overflow-y-auto">
              {allActionItems.length === 0 ? (
                <p className="text-xs text-[#665578] font-semibold text-center py-8">
                  No action items recorded yet for {reportName}.
                </p>
              ) : (
                allActionItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-[#F5BEC6] bg-[#FFF4F6] space-y-1"
                  >
                    <p className={`text-xs font-bold ${item.status === "done" ? "line-through text-[#665578]" : "text-[#241830]"}`}>
                      {item.text}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-extrabold text-[#665578]">
                      <span className="px-2 py-0.5 rounded-md bg-[#FCE4E8] text-[#8B6FBD]">
                        {item.speakerRole === "manager" ? "Manager" : reportName}
                      </span>
                      {item.dueHint && <span>Due: {item.dueHint}</span>}
                      <span className="capitalize ml-auto text-[#E06D83]">{item.status}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
