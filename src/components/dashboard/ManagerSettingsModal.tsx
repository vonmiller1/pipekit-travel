"use client";

import { useState, useEffect } from "react";
import {
  X,
  SlidersHorizontal,
  Shield,
  Trash2,
  CheckCircle2,
  Lock,
  Loader2,
  Zap,
  Info,
  Bell,
  Eye,
  UserCog,
  Palette,
  Database,
  AlertTriangle,
  Clock,
  Download,
  RefreshCw,
} from "lucide-react";

interface ManagerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  managerId: string;
  currentThreshold: number;
  currentRetention: number;
  onSettingsSaved: (newThreshold: number, newRetention: number) => void;
  onTriggerPrune: () => void;
}

type TabId = "analysis" | "privacy" | "display" | "notifications" | "account";

const TABS: { id: TabId; label: string; icon: typeof SlidersHorizontal }[] = [
  { id: "analysis", label: "Analysis", icon: SlidersHorizontal },
  { id: "privacy", label: "Privacy & Data", icon: Shield },
  { id: "display", label: "Display", icon: Palette },
  { id: "notifications", label: "Alerts", icon: Bell },
  { id: "account", label: "Account", icon: UserCog },
];

const RETENTION_OPTIONS = [
  { days: 30, label: "30 Days", desc: "Short-term" },
  { days: 90, label: "90 Days", desc: "Quarterly" },
  { days: 180, label: "180 Days", desc: "Bi-annual" },
  { days: 365, label: "1 Year", desc: "Annual" },
];

function getRisk(pct: number) {
  if (pct <= 50) return { label: "Healthy", color: "#8B6FBD", bg: "#FCE4E8" };
  if (pct <= 60) return { label: "Caution", color: "#F59E0B", bg: "#FFF4F6" };
  if (pct <= 68) return { label: "Warning", color: "#E06D83", bg: "#FFE3E8" };
  return { label: "Critical", color: "#E06D83", bg: "#FFE3E8" };
}

const PREFS_KEY = "balance_ui_prefs";
interface UIPrefs {
  compactMode: boolean;
  showQuestionsCount: boolean;
  showTopicsCount: boolean;
  emailDigest: boolean;
  flagAlerts: boolean;
  weeklyReport: boolean;
  soundFeedback: boolean;
  defaultView: "dashboard" | "commitments" | "trends";
  accentColor: string;
}
const DEFAULT_PREFS: UIPrefs = {
  compactMode: false,
  showQuestionsCount: true,
  showTopicsCount: true,
  emailDigest: false,
  flagAlerts: true,
  weeklyReport: false,
  soundFeedback: false,
  defaultView: "dashboard",
  accentColor: "#8B6FBD",
};

function loadPrefs(): UIPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PREFS;
}
function savePrefs(p: UIPrefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch {}
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="w-10 h-5.5 rounded-full relative flex-shrink-0 transition-all duration-300 border border-[#F5BEC6]"
      style={{
        background: checked ? "#8B6FBD" : "#FCE4E8",
      }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300"
        style={{ left: checked ? "calc(100% - 18px)" : "2px" }}
      />
    </button>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#F5BEC6] bg-white overflow-hidden shadow-xs">
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, color = "#8B6FBD" }: { icon: typeof Shield; title: string; color?: string }) {
  return (
    <div className="px-5 py-3.5 border-b border-[#F5BEC6] flex items-center gap-2.5 text-[11px] font-extrabold text-[#665578] uppercase tracking-wider bg-[#FFF4F6]">
      <Icon className="w-3.5 h-3.5" style={{ color }} />
      {title}
    </div>
  );
}

function SettingRow({
  label,
  desc,
  children,
  danger = false,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#F5BEC6] last:border-0">
      <div className="min-w-0">
        <p className={`text-sm font-bold ${danger ? "text-[#E06D83]" : "text-[#241830]"}`}>{label}</p>
        {desc && <p className="text-[11px] text-[#665578] mt-0.5 leading-relaxed font-semibold">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function ManagerSettingsModal({
  isOpen,
  onClose,
  managerId,
  currentThreshold,
  currentRetention,
  onSettingsSaved,
  onTriggerPrune,
}: ManagerSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("analysis");

  const [threshold, setThreshold] = useState(currentThreshold || 60);
  const [retention, setRetention] = useState(currentRetention || 180);
  const [prefs, setPrefs] = useState<UIPrefs>(DEFAULT_PREFS);

  const [isSaving, setIsSaving] = useState(false);
  const [isPruning, setIsPruning] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [prunedMsg, setPrunedMsg] = useState<string | null>(null);
  const [showPruneConfirm, setShowPruneConfirm] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setThreshold(currentThreshold || 60);
      setRetention(currentRetention || 180);
      setPrefs(loadPrefs());
      setSavedSuccess(false);
      setSaveError("");
      setPrunedMsg(null);
      setShowPruneConfirm(false);
      setPrefsSaved(false);
    }
  }, [isOpen, currentThreshold, currentRetention]);

  if (!isOpen) return null;

  const risk = getRisk(threshold);
  const sliderFill = ((threshold - 40) / (75 - 40)) * 100;

  const updatePref = <K extends keyof UIPrefs>(key: K, value: UIPrefs[K]) => {
    setPrefs((p) => {
      const next = { ...p, [key]: value };
      savePrefs(next);
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 1500);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/manager-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId, talkPctThreshold: threshold, retentionDays: retention }),
      });
      if (res.ok) {
        onSettingsSaved(threshold, retention);
        setSavedSuccess(true);
        setTimeout(() => { setSavedSuccess(false); onClose(); }, 1400);
      } else {
        setSaveError("Failed to save.");
      }
    } catch {
      setSaveError("Network error.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrune = async () => {
    setIsPruning(true);
    setShowPruneConfirm(false);
    try {
      const res = await fetch("/api/admin/prune", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPrunedMsg(`Pruned ${data.prunedCount ?? 0} transcript files`);
        onTriggerPrune();
        setTimeout(() => setPrunedMsg(null), 4000);
      }
    } catch { console.error("Prune error"); }
    finally { setIsPruning(false); }
  };

  const renderAnalysis = () => (
    <div className="space-y-4">
      <SectionCard>
        <SectionHeader icon={SlidersHorizontal} title="Talk-Time Warning Threshold" color="#E06D83" />
        <div className="px-5 py-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#241830]">Manager Max Talk Time</p>
              <p className="text-[11px] text-[#665578] font-semibold mt-0.5">Sessions exceeding this limit are flagged</p>
            </div>
            <div
              className="flex items-baseline gap-1 px-4 py-2 rounded-2xl font-extrabold min-w-[72px] justify-center border border-[#F5BEC6]"
              style={{ background: risk.bg, color: risk.color }}
            >
              <span className="text-3xl">{threshold}</span>
              <span className="text-base">%</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative h-6 flex items-center">
              <div className="absolute inset-x-0 h-2.5 rounded-full bg-[#FFF4F6] border border-[#F5BEC6]" />
              <div className="absolute left-0 h-2.5 rounded-full pointer-events-none transition-all duration-150"
                style={{ width: `${sliderFill}%`, background: "linear-gradient(90deg, #C3B1E1, #8B6FBD)" }} />
              <input
                type="range" min="40" max="75" step="1" value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer relative z-10"
                style={{ accentColor: "#8B6FBD", height: "24px" }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-extrabold text-[#665578] px-0.5">
              <span>40%</span><span>50%</span><span>60%</span><span>75%</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded.xl bg-[#FFF4F6] border border-[#F5BEC6]">
            <Info className="w-4 h-4 text-[#8B6FBD] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#665578] font-semibold leading-relaxed">
              Research recommends keeping manager talk time under <strong className="text-[#241830]">50–60%</strong> to promote open communication.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeader icon={Eye} title="Analysis Display Options" color="#8B6FBD" />
        <SettingRow label="Show Question Count" desc="Display question metrics per speaker">
          <Toggle checked={prefs.showQuestionsCount} onChange={() => updatePref("showQuestionsCount", !prefs.showQuestionsCount)} />
        </SettingRow>
        <SettingRow label="Show Topic Initiation" desc="Display topic counts per speaker">
          <Toggle checked={prefs.showTopicsCount} onChange={() => updatePref("showTopicsCount", !prefs.showTopicsCount)} />
        </SettingRow>
      </SectionCard>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-4">
      <SectionCard>
        <SectionHeader icon={Database} title="Transcript Retention Policy" color="#8B6FBD" />
        <div className="px-5 py-5 space-y-4">
          <div className="grid grid-cols-4 gap-2.5">
            {RETENTION_OPTIONS.map(({ days, label, desc }) => {
              const active = retention === days;
              return (
                <button
                  key={days}
                  onClick={() => setRetention(days)}
                  className={`flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl border transition-all duration-200 ${
                    active
                      ? "bg-[#FCE4E8] border-[#8B6FBD] text-[#8B6FBD] shadow-sm shadow-[#8B6FBD]/20"
                      : "bg-[#FFF4F6] border-[#F5BEC6] text-[#665578] hover:bg-white"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-extrabold">{label}</span>
                  <span className="text-[10px] font-semibold">{desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeader icon={Lock} title="Privacy & Security" color="#8B6FBD" />
        <div className="px-5 py-4 space-y-3">
          {[
            { label: "AES-256 local transcript encryption", ok: true },
            { label: "No org-wide dashboards or skip-level access", ok: true },
            { label: "Manager self-correction only", ok: true },
          ].map(({ label }) => (
            <div key={label} className="flex items-center gap-3 text-[11px] font-bold text-[#241830]">
              <CheckCircle2 className="w-4 h-4 text-[#8B6FBD] shrink-0" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeader icon={Trash2} title="Data Cleanup" color="#E06D83" />
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#241830]">Manual Retention Prune</p>
              <p className="text-[11px] text-[#665578] font-semibold mt-0.5">Delete raw transcripts past retention window</p>
            </div>
            <button onClick={handlePrune} disabled={isPruning}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#FFE3E8] border border-[#F5BEC6] text-[#E06D83] hover:bg-[#E06D83] hover:text-white transition-all">
              {isPruning ? "Pruning..." : "Prune Now"}
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const renderDisplay = () => (
    <div className="space-y-4">
      <SectionCard>
        <SectionHeader icon={Palette} title="Interface Preferences" color="#8B6FBD" />
        <SettingRow label="Compact View" desc="Reduce card margins">
          <Toggle checked={prefs.compactMode} onChange={() => updatePref("compactMode", !prefs.compactMode)} />
        </SettingRow>
        <SettingRow label="Sound Feedback" desc="Play subtle tone on complete">
          <Toggle checked={prefs.soundFeedback} onChange={() => updatePref("soundFeedback", !prefs.soundFeedback)} />
        </SettingRow>
      </SectionCard>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-4">
      <SectionCard>
        <SectionHeader icon={Bell} title="In-App Alerts" color="#8B6FBD" />
        <SettingRow label="Flag Alert Badge" desc="Highlight sessions over max talk threshold">
          <Toggle checked={prefs.flagAlerts} onChange={() => updatePref("flagAlerts", !prefs.flagAlerts)} />
        </SettingRow>
      </SectionCard>
    </div>
  );

  const renderAccount = () => (
    <div className="space-y-4">
      <SectionCard>
        <SectionHeader icon={UserCog} title="Manager Account" color="#8B6FBD" />
        <div className="px-5 py-5 space-y-4">
          <div className="space-y-1.5">
            <p className="text-[11px] font-extrabold text-[#665578] uppercase tracking-wider">Manager ID</p>
            <div className="px-3.5 py-2.5 rounded-xl border border-[#F5BEC6] bg-[#FFF4F6] font-mono text-xs font-bold text-[#241830]">
              {managerId}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const CONTENT: Record<TabId, React.ReactNode> = {
    analysis: renderAnalysis(),
    privacy: renderPrivacy(),
    display: renderDisplay(),
    notifications: renderNotifications(),
    account: renderAccount(),
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(36, 24, 48, 0.6)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl rounded-3xl border border-[#F5BEC6] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-[#F5BEC6] shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FCE4E8] border border-[#F5BEC6] flex items-center justify-center text-[#8B6FBD]">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#241830]">Manager Settings</h2>
                <p className="text-xs font-semibold text-[#665578]">Configure talk thresholds, privacy, and display options</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#665578] hover:bg-[#FCE4E8] transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-1.5 mt-5 p-1 rounded-2xl border border-[#F5BEC6] bg-[#FFF4F6]">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all flex-1 justify-center ${
                    active
                      ? "bg-[#8B6FBD] text-white shadow-sm"
                      : "text-[#665578] hover:text-[#241830]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {CONTENT[activeTab]}
        </div>

        <div className="px-6 py-4 border-t border-[#F5BEC6] flex items-center justify-between bg-[#FFF4F6] shrink-0">
          <span className="text-xs text-[#665578] font-bold">
            {savedSuccess ? "✓ Settings saved!" : "Configure your 1:1 analysis preferences"}
          </span>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-[#665578] border border-[#F5BEC6] hover:bg-[#FCE4E8]">
              Close
            </button>
            <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-[#8B6FBD] shadow-md hover:scale-105 transition-all">
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
