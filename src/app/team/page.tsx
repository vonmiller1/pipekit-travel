"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/common/Logo";
import { secureStorage } from "@/lib/secureStorage";
import {
  Users,
  AlertTriangle,
  Calendar,
  ListChecks,
  Scale,
  ArrowRight,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import type { ReportResponse } from "@/lib/types";

const MANAGER_ID_KEY = "balance_manager_id";

interface TeamReportOverview {
  id: string;
  name: string;
  lastSessionDate: string | null;
  currentTalkRatio: number | null;
  openItemCount: number;
  hasStaleItems: boolean;
  maxStaleSince: string | null;
  sparkline: number[];
  needsAttention: boolean;
  isThresholdBreached: boolean;
}

// Custom Pure SVG Sparkline component comparing a report to themselves over time
function Sparkline({
  data,
  threshold,
  isBreached,
}: {
  data: number[];
  threshold: number;
  isBreached: boolean;
}) {
  if (data.length < 2) {
    return <span className="text-[10px] text-[#665578] font-bold italic">No trend data yet</span>;
  }

  const width = 110;
  const height = 30;
  const padding = 2;
  const minVal = 0;
  const maxVal = 100;

  const points = data
    .map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * (width - 2 * padding);
      // Invert Y coordinates
      const y = height - (padding + ((val - minVal) / (maxVal - minVal)) * (height - 2 * padding));
      return `${x},${y}`;
    })
    .join(" ");

  const lineColor = isBreached ? "#E06D83" : "#8B6FBD";

  // Position of threshold line
  const thresholdY = height - (padding + ((threshold - minVal) / (maxVal - minVal)) * (height - 2 * padding));

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={width} height={height} className="overflow-visible" style={{ minWidth: width }}>
        {/* Draw threshold dashed line */}
        <line
          x1={0}
          y1={thresholdY}
          x2={width}
          y2={thresholdY}
          stroke="#F5BEC6"
          strokeDasharray="2,2"
          strokeWidth={1}
        />
        {/* Draw sparkline path */}
        <polyline
          fill="none"
          stroke={lineColor}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {/* Draw final value dot */}
        {data.length > 0 && (
          <circle
            cx={padding + (width - 2 * padding)}
            cy={height - (padding + ((data[data.length - 1] - minVal) / (maxVal - minVal)) * (height - 2 * padding))}
            r={3}
            fill={lineColor}
          />
        )}
      </svg>
    </div>
  );
}

export default function TeamOverviewPage() {
  const [managerId, setManagerId] = useState("");
  const [reports, setReports] = useState<TeamReportOverview[]>([]);
  const [threshold, setThreshold] = useState(60);
  const [isLoading, setIsLoading] = useState(true);
  const [newReportName, setNewReportName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    async function loadData() {
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
          const response = await fetch(`/api/team-overview?managerId=${mId}`);
          if (response.ok) {
            const data = await response.json();
            setReports(data.reports || []);
            setThreshold(data.threshold || 60);
          }
        }
      } catch (err) {
        console.error("Team overview load error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportName.trim() || !managerId) return;

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId, displayName: newReportName.trim() }),
      });
      if (res.ok) {
        // Reload overview
        const response = await fetch(`/api/team-overview?managerId=${managerId}`);
        if (response.ok) {
          const data = await response.json();
          setReports(data.reports || []);
        }
        setNewReportName("");
        setShowAddForm(false);
      }
    } catch (err) {
      console.error("Add report error:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF4F6] text-[#241830]">
        <div className="text-center space-y-3">
          <Users className="w-10 h-10 mx-auto text-[#8B6FBD] animate-pulse" />
          <p className="text-xs font-extrabold text-[#665578]">Loading Team Overview...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalReports = reports.length;
  const attentionCount = reports.filter((r) => r.needsAttention).length;
  const staleCount = reports.filter((r) => r.hasStaleItems).length;
  const breachCount = reports.filter((r) => r.isThresholdBreached).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <Logo size="md" />
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#8B6FBD] hover:scale-105 transition-all shadow-md shadow-[#8B6FBD]/35"
        >
          <UserPlus className="w-4 h-4" />
          Add Team Member
        </button>
      </div>

      {/* Profile Hero Header Tile */}
      <div className="apple-hero-tile p-8 sm:p-10 relative overflow-hidden border border-[#F5BEC6]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFF4F6] border border-[#F5BEC6] text-[#8B6FBD] text-[10px] font-extrabold uppercase tracking-wider mb-2.5">
              Attention Check &amp; Triage
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#241830]">
              Who needs your attention this week?
            </h1>
            <p className="text-xs text-[#665578] font-bold mt-1 max-w-xl">
              Surfacing direct reports who need communication rebalancing or have open commitments carry over for multiple sessions.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white border border-[#F5BEC6] px-4 py-3 rounded-2xl text-center min-w-[100px] shadow-xs">
              <p className="text-[10px] font-extrabold text-[#665578] uppercase">Direct Reports</p>
              <p className="text-xl font-extrabold text-[#241830] mt-0.5">{totalReports}</p>
            </div>
            <div className="bg-white border border-[#E06D83]/30 px-4 py-3 rounded-2xl text-center min-w-[100px] shadow-xs bg-[#FFF0F2]">
              <p className="text-[10px] font-extrabold text-[#E06D83] uppercase">Needs Attention</p>
              <p className="text-xl font-extrabold text-[#E06D83] mt-0.5">{attentionCount}</p>
            </div>
            <div className="bg-white border border-[#F5BEC6] px-4 py-3 rounded-2xl text-center min-w-[100px] shadow-xs">
              <p className="text-[10px] font-extrabold text-[#8B6FBD] uppercase">Stale Items</p>
              <p className="text-xl font-extrabold text-[#8B6FBD] mt-0.5">{staleCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Add Report Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddReport}
          className="p-5 rounded-2xl border border-[#8B6FBD] bg-white space-y-3 max-w-md animate-fade-in-up"
        >
          <h3 className="text-xs font-extrabold text-[#241830] uppercase tracking-wider">➕ Add New Direct Report</h3>
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="E.g. Jane Doe"
              value={newReportName}
              onChange={(e) => setNewReportName(e.target.value)}
              className="flex-1 h-9 px-3 text-xs font-bold text-[#241830] placeholder-[#8E7E9E] rounded-xl border border-[#F5BEC6] bg-white focus:outline-none focus:ring-2 focus:ring-[#8B6FBD]"
            />
            <button
              type="submit"
              className="px-4 h-9 text-xs font-extrabold text-white bg-[#8B6FBD] rounded-xl hover:scale-105 transition-all"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 h-9 text-xs font-bold text-[#665578] border border-[#F5BEC6] rounded-xl hover:bg-[#FFF4F6]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Main Overview Dashboard Table */}
      {totalReports === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#F5BEC6] p-8 space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-3xl flex items-center justify-center bg-[#FCE4E8] border border-[#F5BEC6] text-[#8B6FBD] mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#241830]">No direct reports configured</h3>
            <p className="text-xs text-[#665578] mt-1 font-semibold">
              Add your first team member to start recording and analyzing your 1:1 check-in meetings.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 text-xs font-extrabold text-white bg-[#8B6FBD] rounded-xl hover:scale-105 transition-all"
          >
            Add Team Member
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#F5BEC6] overflow-hidden shadow-xs">
          {/* Table Header Row (Hidden on mobile) */}
          <div className="hidden md:grid grid-cols-12 gap-4 p-5 bg-[#FFF4F6] border-b border-[#F5BEC6] text-xs font-extrabold text-[#665578] uppercase tracking-wider">
            <div className="col-span-3">Direct Report</div>
            <div className="col-span-2 text-center">Attention Status</div>
            <div className="col-span-2 text-center">Last Session</div>
            <div className="col-span-2 text-center">Talk Balance</div>
            <div className="col-span-2 text-center">Commitments</div>
            <div className="col-span-1 text-right">View</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#F5BEC6]/60">
            {reports.map((report) => {
              const formattedDate = report.lastSessionDate
                ? new Date(report.lastSessionDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "No sessions logged";

              return (
                <Link
                  href={`/reports/${report.id}`}
                  key={report.id}
                  className="block group transition-all"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-center hover:bg-[#FFF4F6]/40 transition-colors cursor-pointer group-hover:scale-[1.005]">
                    {/* Column 1: Profile/Name */}
                    <div className="col-span-3 flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                          report.needsAttention
                            ? "bg-[#FFF0F2] border-[#E06D83]/40 text-[#E06D83]"
                            : "bg-[#FFF4F6] border-[#F5BEC6] text-[#8B6FBD]"
                        }`}
                      >
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm font-extrabold text-[#241830] truncate group-hover:text-[#8B6FBD] transition-colors">
                          {report.name}
                        </h2>
                        <span className="text-[10px] text-[#665578] font-bold md:hidden block">
                          Last session: {formattedDate}
                        </span>
                      </div>
                    </div>

                    {/* Column 2: Attention Badges */}
                    <div className="col-span-2 flex justify-start md:justify-center flex-wrap gap-1.5">
                      {report.needsAttention ? (
                        <>
                          {report.hasStaleItems && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold bg-[#FFE3E8] text-[#E06D83] border border-[#F5BEC6] uppercase tracking-wider">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Stale
                            </span>
                          )}
                          {report.isThresholdBreached && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold bg-[#FFE3E8] text-[#E06D83] border border-[#F5BEC6] uppercase tracking-wider">
                              <Scale className="w-2.5 h-2.5" />
                              Talk Ratio
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold bg-[#FCE4E8] text-[#8B6FBD] border border-[#F5BEC6] uppercase tracking-wider">
                          Healthy
                        </span>
                      )}
                    </div>

                    {/* Column 3: Last session date */}
                    <div className="col-span-2 text-left md:text-center text-xs font-bold text-[#665578] hidden md:block">
                      {formattedDate}
                    </div>

                    {/* Column 4: Talk Ratio (Most Recent) & Sparkline */}
                    <div className="col-span-2 flex flex-col items-start md:items-center gap-2">
                      {report.currentTalkRatio !== null ? (
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${
                              report.isThresholdBreached
                                ? "bg-[#FFE3E8] text-[#E06D83] border border-[#E06D83]/20"
                                : "bg-[#FCE4E8] text-[#8B6FBD] border border-[#F5BEC6]"
                            }`}
                          >
                            {report.currentTalkRatio}% manager
                          </span>
                          <Sparkline
                            data={report.sparkline}
                            threshold={threshold}
                            isBreached={report.isThresholdBreached}
                          />
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#665578] font-semibold italic">N/A</span>
                      )}
                    </div>

                    {/* Column 5: Action items count */}
                    <div className="col-span-2 flex items-center md:justify-center gap-1.5">
                      <ListChecks className="w-4 h-4 text-[#8B6FBD]" />
                      <span className="text-xs font-extrabold text-[#241830]">
                        {report.openItemCount} open item{report.openItemCount !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Column 6: Link Router */}
                    <div className="col-span-1 text-right hidden md:block">
                      <ArrowRight className="w-4 h-4 text-[#665578] group-hover:text-[#8B6FBD] group-hover:translate-x-1 transition-all inline-block" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
