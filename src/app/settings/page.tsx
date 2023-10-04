"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/common/Logo";
import { secureStorage } from "@/lib/secureStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sliders,
  Shield,
  Trash2,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Loader2,
  Sparkles,
  Zap,
  Clock,
  Eye,
  UserCog,
  AlertTriangle,
  Info,
} from "lucide-react";

const MANAGER_ID_KEY = "balance_manager_id";

const RETENTION_OPTIONS = [
  { days: 30, label: "30 Days", desc: "Short-term" },
  { days: 90, label: "90 Days", desc: "Quarterly" },
  { days: 180, label: "180 Days", desc: "Bi-annual" },
  { days: 365, label: "1 Year", desc: "Annual" },
];

function getRisk(pct: number) {
  if (pct <= 50) return { label: "Healthy Ratio", color: "#0066cc", bg: "rgba(46,196,182,0.12)" };
  if (pct <= 60) return { label: "Caution", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" };
  if (pct <= 68) return { label: "Warning", color: "#FF6B35", bg: "rgba(255,107,53,0.12)" };
  return { label: "Critical Talk-Time", color: "#E63946", bg: "rgba(230,57,70,0.12)" };
}

export default function SettingsPage() {
  const [managerId, setManagerId] = useState("");
  const [threshold, setThreshold] = useState(60);
  const [retentionDays, setRetentionDays] = useState(180);
  const [autoShare, setAutoShare] = useState(false);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPruning, setIsPruning] = useState(false);
  const [pruneResult, setPruneResult] = useState<string | null>(null);
  const [showPruneConfirm, setShowPruneConfirm] = useState(false);

  useEffect(() => {
    const mId = secureStorage.getItem(MANAGER_ID_KEY) || "";
    if (mId) {
      setManagerId(mId);
      fetch(`/api/manager-settings?managerId=${mId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.talkPctThreshold) setThreshold(data.talkPctThreshold);
          if (data.retentionDays) setRetentionDays(data.retentionDays);
        })
        .catch(console.error);
    }
    setAutoShare(secureStorage.getItem("settings_auto_share") === "true");
    setEnableNotifications(secureStorage.getItem("settings_enable_notifications") !== "false");
  }, []);

  const handleSave = async () => {
    if (!managerId) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/manager-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerId,
          talkPctThreshold: threshold,
          retentionDays,
        }),
      });

      if (res.ok) {
        secureStorage.setItem("settings_auto_share", String(autoShare));
        secureStorage.setItem("settings_enable_notifications", String(enableNotifications));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Save settings error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrune = async () => {
    if (!managerId) return;
    setIsPruning(true);
    setPruneResult(null);
    setShowPruneConfirm(false);
    try {
      const res = await fetch("/api/admin/prune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId }),
      });
      if (res.ok) {
        const data = await res.json();
        setPruneResult(`✓ Pruned ${data.prunedCount ?? 0} old raw transcript file(s).`);
        setTimeout(() => setPruneResult(null), 4000);
      }
    } catch (error) {
      console.error("Prune error:", error);
    } finally {
      setIsPruning(false);
    }
  };

  const risk = getRisk(threshold);
  const sliderFill = ((threshold - 40) / (75 - 40)) * 100;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
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

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold text-[#0066cc] bg-[#0066cc]/10 border border-[#0066cc]/30 animate-fade-in-up">
              <CheckCircle2 className="w-4 h-4" />
              Settings Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #8B6FBD, #6E539F)",
              boxShadow: "0 0 20px rgba(139,111,189,0.3)",
            }}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <div
        className="p-8 rounded-3xl border border-[#e0e0e0] relative overflow-hidden space-y-3"
        style={{
          background: "linear-gradient(160deg, #0C1524 0%, #070D18 100%)",
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.8)",
        }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px style-glow"
          style={{ background: "linear-gradient(90deg, transparent, rgba(46,196,182,0.6), transparent)" }} />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold text-[#E06D83] bg-[#E06D83]/10 border border-[#E06D83]/25">
          <Sliders className="w-3.5 h-3.5" />
          <span>Manager Self-Correction Controls</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Manager Settings & Privacy Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
          Customize talk-time alert thresholds, manage encrypted raw transcript retention, and inspect your private data policy.
        </p>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Settings Cards (2 cols on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Talk-Time Threshold Card */}
          <Card className="glass-panel glass-panel-hover rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 pt-6 px-7 border-b border-[#e0e0e0] flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-extrabold text-[#241830] flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-[#E06D83]" />
                Talk-Time Warning Threshold
              </CardTitle>
              <span
                className="text-[11px] font-extrabold px-3 py-1 rounded-full"
                style={{
                  background: risk.bg,
                  color: risk.color,
                  border: `1px solid ${risk.color}35`,
                }}
              >
                {risk.label}
              </span>
            </CardHeader>

            <CardContent className="p-7 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1d1d1f]">Warning Trigger Level</p>
                  <p className="text-[11px] text-[#7a7a7a] mt-0.5">Sessions exceeding this talk time are flagged</p>
                </div>
                <div
                  className="flex items-baseline gap-1 px-4 py-2 rounded-2xl font-extrabold"
                  style={{
                    background: risk.bg,
                    border: `1px solid ${risk.color}30`,
                    color: risk.color,
                  }}
                >
                  <span className="text-2xl">{threshold}</span>
                  <span className="text-sm">%</span>
                </div>
              </div>

              {/* Custom Slider */}
              <div className="space-y-2">
                <div className="relative h-6 flex items-center">
                  <div className="absolute inset-x-0 h-2 rounded-full bg-[#fafafc]" />
                  <div
                    className="absolute left-0 h-2 rounded-full pointer-events-none transition-all duration-150"
                    style={{
                      width: `${sliderFill}%`,
                      background: `linear-gradient(90deg, #0066cc, ${risk.color})`,
                    }}
                  />
                  <input
                    type="range"
                    min={40}
                    max={75}
                    step={1}
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full appearance-none bg-transparent cursor-pointer relative z-10"
                    style={{ accentColor: risk.color, height: "24px" }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-[#7a7a7a] px-0.5">
                  <span>40%</span>
                  <span>50%</span>
                  <span>60%</span>
                  <span>75%</span>
                </div>
              </div>

              <div
                className="flex items-start gap-3 p-3.5 rounded-2xl border"
                style={{ background: "rgba(46,196,182,0.05)", borderColor: "rgba(46,196,182,0.15)" }}
              >
                <Info className="w-4 h-4 text-[#0066cc] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#665578] leading-relaxed">
                  Sessions where Manager talk-time exceeds <strong className="text-[#241830]">{threshold}%</strong> are automatically flagged. Target healthy ratio is <strong className="text-[#8B6FBD]">40–50%</strong>.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Retention Policy Card */}
          <Card className="glass-panel glass-panel-hover rounded-3xl overflow-hidden">
            <CardHeader className="pb-4 pt-6 px-7 border-b border-[#e0e0e0]">
              <CardTitle className="text-sm font-extrabold text-[#241830] flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-[#8B6FBD]" />
                Raw Transcript Retention Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-7 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {RETENTION_OPTIONS.map(({ days, label, desc }) => {
                  const active = retentionDays === days;
                  return (
                    <button
                      key={days}
                      onClick={() => setRetentionDays(days)}
                      className="flex flex-col items-center gap-1 py-3.5 px-2 rounded-2xl border transition-all duration-200 hover:scale-105 active:scale-95"
                      style={
                        active
                          ? {
                              background: "rgba(46,196,182,0.12)",
                              borderColor: "#0066cc",
                              boxShadow: "0 0 18px rgba(46,196,182,0.2)",
                            }
                          : {
                              background: "rgba(0, 0, 0, 0.03)",
                              borderColor: "rgba(0, 0, 0, 0.08)",
                            }
                      }
                    >
                      <Clock className="w-4 h-4" style={{ color: active ? "#0066cc" : "#475569" }} />
                      <span className="text-xs font-extrabold" style={{ color: active ? "#8B6FBD" : "#665578" }}>
                        {label}
                      </span>
                      <span className="text-[10px] font-semibold" style={{ color: active ? "#8B6FBD" : "#8E7E9E" }}>
                        {desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-[#665578] leading-relaxed">
                Raw encrypted text transcripts older than <strong className="text-[#241830]">{retentionDays} days</strong> are permanently pruned while aggregated metrics remain intact for analytics.
              </p>
            </CardContent>
          </Card>

          {/* Preferences Card */}
          <Card className="glass-panel glass-panel-hover rounded-3xl overflow-hidden shadow-sm">
            <CardHeader className="pb-4 pt-6 px-7 border-b border-[#e0e0e0]">
              <CardTitle className="text-sm font-extrabold text-[#241830] flex items-center gap-2.5">
                <UserCog className="w-4 h-4 text-[#8B6FBD]" />
                Summary &amp; Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-7 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-[#1d1d1f]">Auto-share Action Items</p>
                  <p className="text-[11px] text-[#7a7a7a] mt-0.5">Automatically share generated commitments with report after processing</p>
                </div>
                <label className="uiverse-switch shrink-0 select-none">
                  <input
                    type="checkbox"
                    checked={autoShare}
                    onChange={(e) => setAutoShare(e.target.checked)}
                  />
                  <span className="uiverse-switch-slider" />
                </label>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-[#1d1d1f]">Overdue Follow-up Alerts</p>
                  <p className="text-[11px] text-[#7a7a7a] mt-0.5">Receive email or browser alerts when report commitments become stale</p>
                </div>
                <label className="uiverse-switch shrink-0 select-none">
                  <input
                    type="checkbox"
                    checked={enableNotifications}
                    onChange={(e) => setEnableNotifications(e.target.checked)}
                  />
                  <span className="uiverse-switch-slider" />
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Manual Pruning Card */}
          <Card className="glass-panel rounded-3xl overflow-hidden border-rose-500/20">
            <CardHeader className="pb-4 pt-6 px-7 border-b border-[#e0e0e0]">
              <CardTitle className="text-sm font-extrabold text-rose-400 flex items-center gap-2.5">
                <Trash2 className="w-4 h-4 text-rose-400" />
                Manual Transcript Pruning
              </CardTitle>
            </CardHeader>
            <CardContent className="p-7 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-[#1d1d1f]">Immediate Retention Prune</p>
                  <p className="text-[11px] text-[#7a7a7a] mt-0.5">Delete raw encrypted transcripts exceeding retention</p>
                </div>

                {showPruneConfirm ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowPruneConfirm(false)}
                      className="px-3 py-1.5 text-[11px] font-bold text-[#7a7a7a] hover:text-white rounded-lg border border-[#e0e0e0] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePrune}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-extrabold text-white rounded-lg transition-all"
                      style={{ background: "rgba(230,57,70,0.2)", border: "1px solid rgba(230,57,70,0.4)" }}
                    >
                      {isPruning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      Confirm
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPruneConfirm(true)}
                    disabled={isPruning}
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                    style={{
                      color: "#F87171",
                      background: "rgba(230,57,70,0.08)",
                      borderColor: "rgba(230,57,70,0.25)",
                    }}
                  >
                    {isPruning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    {isPruning ? "Pruning..." : "Prune Old Transcripts Now"}
                  </button>
                )}
              </div>

              {pruneResult && (
                <div
                  className="px-4 py-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-2"
                  style={{
                    background: "rgba(46,196,182,0.08)",
                    border: "1px solid rgba(46,196,182,0.2)",
                    color: "#0066cc",
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  {pruneResult}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Security Policy Sidebar */}
        <div className="space-y-6">
          <Card className="glass-panel rounded-3xl overflow-hidden sticky top-8">
            <CardHeader className="pb-4 pt-6 px-6 border-b border-[#e0e0e0]">
              <CardTitle className="text-xs font-extrabold text-[#1d1d1f] uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#0066cc]" />
                Security & Privacy Guarantee
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[
                { icon: Lock, label: "AES-256 Encryption at Rest", desc: "Transcripts encrypted locally before storage" },
                { icon: Shield, label: "No HR Dashboard Access", desc: "Data stays exclusively on your private manager profile" },
                { icon: Eye, label: "Zero Cross-Team Auditing", desc: "No skip-level views or executive roll-ups" },
                { icon: UserCog, label: "Self-Correction Focus", desc: "Designed purely for your personal coaching & reflection" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "rgba(46,196,182,0.1)", border: "1px solid rgba(46,196,182,0.2)" }}
                  >
                    <Icon className="w-3.5 h-3.5 text-[#0066cc]" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#241830]">{label}</p>
                    <p className="text-[11px] text-[#665578] leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}

              <div
                className="pt-4 mt-2 border-t flex items-center justify-between"
                style={{ borderColor: "rgba(0, 0, 0, 0.07)" }}
              >
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-3 rounded-xl text-xs font-extrabold text-white transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #8B6FBD, #6E539F)",
                    boxShadow: "0 0 20px rgba(139,111,189,0.3)",
                  }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      Save Preferences
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
