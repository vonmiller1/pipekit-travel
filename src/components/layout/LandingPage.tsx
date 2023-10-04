"use client";

import { useState, useEffect } from "react";
import {
  Scale,
  Sparkles,
  ArrowUpRight,
  ChevronDown,
  Star,
  Shield,
  Lock,
  Zap,
  TrendingUp,
  Activity,
  Target,
  Brain,
  Users,
  BarChart3,
  ListChecks,
  CheckCircle,
  ArrowRight,
  Play,
} from "lucide-react";

const FEATURES = [
  {
    icon: Activity,
    color: "#CBFF00",
    bg: "rgba(203,255,0,0.1)",
    border: "rgba(203,255,0,0.25)",
    title: "AI Talk-Time Analysis",
    desc: "Gemini AI precisely diarizes every 1:1 transcript and calculates exact speaker ratios — revealing who truly dominates the conversation.",
  },
  {
    icon: Target,
    color: "#CBFF00",
    bg: "rgba(203,255,0,0.1)",
    border: "rgba(203,255,0,0.25)",
    title: "Commitment Extraction",
    desc: "Automatically surfaces action items, owner assignments, and due hints from every conversation so nothing falls through the cracks.",
  },
  {
    icon: TrendingUp,
    color: "#CBFF00",
    bg: "rgba(203,255,0,0.1)",
    border: "rgba(203,255,0,0.25)",
    title: "Historical Trend Charts",
    desc: "Multi-week trend lines track behavioral evolution across all your direct reports over time with Recharts analytics.",
  },
  {
    icon: Brain,
    color: "#CBFF00",
    bg: "rgba(203,255,0,0.1)",
    border: "rgba(203,255,0,0.25)",
    title: "Self-Correction Engine",
    desc: "Custom thresholds flag sessions where your talk-time exceeds healthy 1:1 balance targets — nudging you toward better habits.",
  },
  {
    icon: Shield,
    color: "#CBFF00",
    bg: "rgba(203,255,0,0.1)",
    border: "rgba(203,255,0,0.25)",
    title: "AES-256 Private Vault",
    desc: "Every raw transcript is encrypted at rest. No HR dashboards. No cross-team aggregation. Zero external data sharing. Ever.",
  },
  {
    icon: Users,
    color: "#CBFF00",
    bg: "rgba(203,255,0,0.1)",
    border: "rgba(203,255,0,0.25)",
    title: "Project Workspaces",
    desc: "Organize 1:1 sessions by team, squad, or initiative. Different projects contain their own distinct sessions and action items.",
  },
];

const TRUST_LOGOS = [
  { name: "Gemini AI", symbol: "✦" },
  { name: "Next.js", symbol: "▲" },
  { name: "Prisma", symbol: "◈" },
  { name: "AES-256", symbol: "⬡" },
  { name: "Open Source", symbol: "⊕" },
];

const AVATARS = ["JR", "SP", "AM", "KL", "RT"];

export default function LandingPage({ onEnterApp }: { onEnterApp: () => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [typedWord, setTypedWord] = useState("");
  const fullWord = "Leadership";

  // Parallax scroll
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Typewriter for italic word
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i <= fullWord.length) {
        setTypedWord(fullWord.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 90);
    return () => clearInterval(timer);
  }, []);

  const handleCTAClick = () => {
    setIsExiting(true);
    setTimeout(() => onEnterApp(), 500);
  };

  return (
    <div className={`relative min-h-screen bg-[#0A0A0A] font-sans overflow-x-hidden ${isExiting ? "landing-exit" : ""}`}>

      {/* ── ANIMATED DARK BACKGROUND ── */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {/* Deep dark base */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #0D1117 0%, #060910 50%, #0A0D15 100%)" }} />

        {/* Large ambient orbs */}
        <div className="absolute" style={{
          top: "-10%", left: "-5%",
          width: "65%", height: "70%",
          background: "radial-gradient(ellipse, rgba(203,255,0,0.06) 0%, transparent 65%)",
          animation: "orb1 16s ease-in-out infinite alternate",
        }} />
        <div className="absolute" style={{
          bottom: "-15%", right: "-10%",
          width: "60%", height: "65%",
          background: "radial-gradient(ellipse, rgba(46,196,182,0.07) 0%, transparent 65%)",
          animation: "orb2 20s ease-in-out infinite alternate",
        }} />
        <div className="absolute" style={{
          top: "30%", right: "20%",
          width: "40%", height: "40%",
          background: "radial-gradient(ellipse, rgba(168,85,247,0.05) 0%, transparent 65%)",
          animation: "orb3 24s ease-in-out infinite alternate",
        }} />

        {/* Subtle dot grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at 40% 40%, black 20%, transparent 75%)",
        }} />

        {/* Top edge glow line */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(203,255,0,0.4) 30%, rgba(46,196,182,0.4) 70%, transparent 100%)",
        }} />
      </div>

      {/* ── STICKY NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 py-5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #CBFF00, #9ABA00)" }}>
              <Scale className="w-4.5 h-4.5 text-black" />
            </div>
            <span className="text-sm font-extrabold text-white tracking-tight">1:1 Balance</span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "Privacy"].map((link) => (
              <a key={link} href={`#${link.toLowerCase().replace(" ", "-")}`}
                className="text-sm font-semibold text-white/50 hover:text-white transition-colors duration-200">
                {link}
              </a>
            ))}
          </div>

          {/* CTA */}
          <button onClick={handleCTAClick}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-extrabold text-black transition-all duration-300 hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #CBFF00, #A8D800)" }}>
            <Zap className="w-3.5 h-3.5" />
            Launch Studio
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          HERO — Full viewport, left-aligned
          ══════════════════════════════════════════ */}
      <section className="relative z-10 min-h-screen flex flex-col justify-between px-6 sm:px-14 lg:px-20 pt-28 pb-10">

        {/* Hero content — left aligned, vertically centered */}
        <div className="flex-1 flex flex-col justify-center max-w-3xl" style={{ transform: `translateY(${scrollY * -0.08}px)` }}>

          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 mb-8 w-fit">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold"
              style={{
                background: "rgba(203,255,0,0.08)",
                border: "1px solid rgba(203,255,0,0.2)",
                color: "#CBFF00",
              }}>
              <Sparkles className="w-3 h-3" />
              Powered by Gemini AI · Private by Default
            </div>
          </div>

          {/* Main headline */}
          <h1 className="text-white font-extrabold leading-none tracking-tight mb-6"
            style={{ fontSize: "clamp(3rem, 7.5vw, 6.5rem)", letterSpacing: "-0.02em" }}>
            Smarter 1:1s for
            <br />
            Better{" "}
            <em className="not-italic" style={{
              fontStyle: "italic",
              fontWeight: 300,
              fontFamily: "Georgia, 'Times New Roman', serif",
              color: "#CBFF00",
              textShadow: "0 0 60px rgba(203,255,0,0.3)",
            }}>
              {typedWord}
              <span className="cursor-blink">|</span>
            </em>
          </h1>

          {/* Subtext */}
          <p className="text-white/50 font-medium leading-relaxed mb-10 max-w-lg"
            style={{ fontSize: "clamp(0.9rem, 1.8vw, 1.05rem)" }}>
            Paste any 1:1 transcript and let Gemini AI reveal who dominates the conversation, extract committed action items, and track your behavioral growth over time.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={handleCTAClick}
              className="flex items-center gap-2.5 px-7 py-4 rounded-full font-extrabold text-black text-sm transition-all duration-300 hover:scale-105 active:scale-95 group"
              style={{
                background: "linear-gradient(135deg, #CBFF00, #A8D800)",
                boxShadow: "0 0 40px rgba(203,255,0,0.3)",
              }}>
              Analyze Transcript
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>

            <button
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-2.5 px-7 py-4 rounded-full font-bold text-white text-sm transition-all duration-300 hover:bg-white/8 border border-white/20 hover:border-white/40">
              Meet the Features
            </button>
          </div>
        </div>

        {/* ── HERO BOTTOM ROW ── */}
        <div className="flex items-end justify-between mt-16 pt-8 border-t border-white/8">
          {/* Scroll indicator */}
          <div className="flex items-center gap-3 text-white/35 text-xs font-bold uppercase tracking-widest">
            <span>Scroll</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-6">
            {/* Star rating */}
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-white font-extrabold text-sm">4.9</span>
            </div>

            {/* Avatar stack + count */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {AVATARS.map((initials, i) => (
                  <div key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#0A0A0A] flex items-center justify-center text-[10px] font-extrabold"
                    style={{
                      background: `hsl(${i * 60 + 150}, 60%, 35%)`,
                      color: "#fff",
                      zIndex: AVATARS.length - i,
                    }}>
                    {initials}
                  </div>
                ))}
              </div>
              <span className="text-white/60 text-xs font-semibold">500+ Managers</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST LOGOS BAR ── */}
      <div className="relative z-10 border-t border-b border-white/8 py-6 px-6 sm:px-14 lg:px-20"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-6 justify-between">
          <span className="text-white/30 text-xs font-semibold uppercase tracking-widest shrink-0">
            Trusted by thousands
          </span>
          <div className="flex items-center gap-8 sm:gap-14 flex-wrap justify-center">
            {TRUST_LOGOS.map(({ name, symbol }) => (
              <div key={name} className="flex items-center gap-2 text-white/25 hover:text-white/50 transition-colors duration-300">
                <span className="text-lg font-bold">{symbol}</span>
                <span className="text-sm font-bold tracking-wide uppercase">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          LIVE PRODUCT PREVIEW SECTION
          ══════════════════════════════════════════ */}
      <section className="relative z-10 px-6 sm:px-14 lg:px-20 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest mb-4 block" style={{ color: "#CBFF00" }}>
              Live Preview
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              See it in action
            </h2>
          </div>

          {/* Product mockup */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
            style={{
              background: "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(6,9,16,1) 100%)",
              boxShadow: "0 60px 120px -20px rgba(0,0,0,0.9), 0 0 80px -10px rgba(203,255,0,0.1)",
            }}>
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/6">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <div className="flex-1 text-center text-[11px] font-semibold text-white/20">
                1:1 Balance — Executive Studio · localhost:3000
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: session info */}
              <div className="lg:col-span-1 space-y-4">
                <div className="p-4 rounded-2xl border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="text-[10px] font-extrabold text-white/40 uppercase tracking-wider mb-3">Active Session</div>
                  <div className="text-sm font-extrabold text-white">Weekly 1:1 — Jordan Rivera</div>
                  <div className="text-xs text-white/40 font-medium mt-1">Jul 22, 2026 · Analyzed</div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg"
                      style={{ background: "rgba(203,255,0,0.1)", color: "#CBFF00", border: "1px solid rgba(203,255,0,0.2)" }}>
                      ⚠ Over Threshold
                    </span>
                  </div>
                </div>

                {/* Talk ratio */}
                <div className="p-4 rounded-2xl border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="text-[10px] font-extrabold text-white/40 uppercase tracking-wider mb-3">Talk-Time Ratio</div>
                  <div className="flex items-center justify-between text-xs font-extrabold mb-2">
                    <span style={{ color: "#FF6B35" }}>Manager 67%</span>
                    <span style={{ color: "#2EC4B6" }}>Report 33%</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{
                      width: "67%",
                      background: "linear-gradient(90deg, #FF6B35, #FF8C5A)",
                    }} />
                  </div>
                </div>
              </div>

              {/* Right: waveform + actions */}
              <div className="lg:col-span-2 space-y-4">
                {/* Waveform bars */}
                <div className="p-4 rounded-2xl border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="text-[10px] font-extrabold text-white/40 uppercase tracking-wider mb-4">Talk-Time Waveform</div>
                  <div className="flex items-end gap-1 h-16">
                    {Array.from({ length: 40 }).map((_, i) => {
                      const isManager = i < 27;
                      const h = Math.max(12, Math.round(20 + 50 * Math.abs(Math.sin(i * 0.65 + 0.5))));
                      return (
                        <div key={i} className="flex-1 rounded-sm wave-bar"
                          style={{
                            height: `${h}%`,
                            backgroundColor: isManager
                              ? `rgba(255,107,53,${0.4 + 0.6 * Math.abs(Math.sin(i * 0.5))})`
                              : `rgba(46,196,182,${0.4 + 0.6 * Math.abs(Math.sin(i * 0.5))})`,
                            animationDelay: `${i * 0.04}s`,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Action items */}
                <div className="p-4 rounded-2xl border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="text-[10px] font-extrabold text-white/40 uppercase tracking-wider mb-3">Extracted Action Items</div>
                  <div className="space-y-2.5">
                    {[
                      { owner: "manager", text: "Share revised Q3 roadmap priorities by Friday", done: false },
                      { owner: "report", text: "Complete performance testing on read replicas", done: true },
                      { owner: "manager", text: "Schedule alignment meeting with stakeholders", done: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl border"
                        style={{
                          background: item.done ? "rgba(46,196,182,0.05)" : "rgba(255,255,255,0.02)",
                          borderColor: item.done ? "rgba(46,196,182,0.2)" : "rgba(255,255,255,0.06)",
                        }}>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: item.done ? "rgba(46,196,182,0.2)" : "rgba(255,255,255,0.05)" }}>
                          {item.done && <CheckCircle className="w-3 h-3 text-[#2EC4B6]" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] font-semibold text-white/70 leading-snug">{item.text}</p>
                          <span className="text-[10px] font-bold mt-0.5 block"
                            style={{ color: item.owner === "manager" ? "#FF6B35" : "#2EC4B6" }}>
                            {item.owner === "manager" ? "👤 Manager" : "👥 Report"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES SECTION
          ══════════════════════════════════════════ */}
      <section id="features" className="relative z-10 px-6 sm:px-14 lg:px-20 py-24">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest mb-4 block" style={{ color: "#CBFF00" }}>
                Core Features
              </span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Built for self-aware
                <br />
                <em className="not-italic" style={{
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  color: "#CBFF00",
                }}>managers</em>
              </h2>
            </div>
            <p className="text-white/45 text-sm font-medium max-w-sm leading-relaxed lg:text-right">
              Every feature surfaces blind spots and builds better 1:1 habits — automatically, privately, and without any integrations.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i}
                  className="group p-7 rounded-3xl border transition-all duration-400 cursor-default relative overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    borderColor: "rgba(255,255,255,0.07)",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "rgba(203,255,0,0.25)";
                    el.style.background = "rgba(203,255,0,0.04)";
                    el.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "rgba(255,255,255,0.07)";
                    el.style.background = "rgba(255,255,255,0.02)";
                    el.style.transform = "";
                  }}>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: feat.bg, border: `1px solid ${feat.border}` }}>
                    <Icon className="w-5 h-5" style={{ color: feat.color }} />
                  </div>
                  <h3 className="text-base font-extrabold text-white mb-2.5">{feat.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{feat.desc}</p>

                  {/* Corner arrow */}
                  <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowUpRight className="w-4 h-4" style={{ color: "#CBFF00" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
          ══════════════════════════════════════════ */}
      <section id="how-it-works" className="relative z-10 px-6 sm:px-14 lg:px-20 py-24 border-t border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">
            {/* Left sticky heading */}
            <div className="lg:sticky lg:top-28 lg:w-80 shrink-0">
              <span className="text-xs font-extrabold uppercase tracking-widest mb-4 block" style={{ color: "#CBFF00" }}>
                How It Works
              </span>
              <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
                Three steps
                <br />
                to{" "}
                <em style={{
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  color: "#CBFF00",
                }}>clarity</em>
              </h2>
              <p className="text-white/40 text-sm font-medium mt-4 leading-relaxed">
                No setup friction. No integrations required. Works with any transcript source.
              </p>
              <button onClick={handleCTAClick}
                className="mt-8 flex items-center gap-2.5 px-6 py-3.5 rounded-full font-extrabold text-black text-sm transition-all hover:scale-105 active:scale-95"
                style={{ background: "linear-gradient(135deg, #CBFF00, #A8D800)" }}>
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right: steps */}
            <div className="flex-1 space-y-6">
              {[
                {
                  num: "01",
                  title: "Paste your 1:1 transcript",
                  desc: "Copy & paste any meeting transcript in \"Speaker: Text\" format. Works with Otter.ai, Zoom, Fireflies, or handwritten notes.",
                  tag: "Any Format",
                },
                {
                  num: "02",
                  title: "Gemini AI analyzes instantly",
                  desc: "Our multi-model AI pipeline (gemini-1.5-flash, gemini-2.0-flash) diarizes the conversation, calculates talk-time ratios, questions asked, topics initiated, and extracts all commitments.",
                  tag: "< 30 seconds",
                },
                {
                  num: "03",
                  title: "Review & self-correct",
                  desc: "See your personalized balance score, flagged sessions, historical trends across all your direct reports, and action item follow-through rates — then close the loop.",
                  tag: "Instant Insights",
                },
              ].map((step, i) => (
                <div key={i}
                  className="group flex gap-6 p-7 rounded-3xl border transition-all duration-300 hover:border-white/15 cursor-default"
                  style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                  {/* Step number */}
                  <div className="shrink-0 text-4xl font-extrabold leading-none mt-1"
                    style={{ color: "rgba(203,255,0,0.2)", fontVariantNumeric: "tabular-nums" }}>
                    {step.num}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-lg font-extrabold text-white">{step.title}</h3>
                      <span className="shrink-0 px-3 py-1 rounded-full text-[10px] font-extrabold"
                        style={{ background: "rgba(203,255,0,0.08)", color: "#CBFF00", border: "1px solid rgba(203,255,0,0.2)" }}>
                        {step.tag}
                      </span>
                    </div>
                    <p className="text-sm text-white/45 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA
          ══════════════════════════════════════════ */}
      <section className="relative z-10 px-6 sm:px-14 lg:px-20 py-32">
        <div className="max-w-4xl mx-auto relative">
          {/* Background glow */}
          <div className="absolute inset-0 rounded-3xl"
            style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(203,255,0,0.08) 0%, transparent 70%)" }} />

          <div className="relative border border-white/8 rounded-3xl p-12 sm:p-16 text-center"
            style={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(20px)" }}>

            <div className="w-16 h-16 rounded-3xl mx-auto mb-8 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #CBFF00, #9ABA00)", boxShadow: "0 0 50px rgba(203,255,0,0.3)" }}>
              <Scale className="w-8 h-8 text-black" />
            </div>

            <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight">
              Ready to become a
              <br />
              <em style={{
                fontStyle: "italic",
                fontWeight: 300,
                fontFamily: "Georgia, 'Times New Roman', serif",
                color: "#CBFF00",
              }}>better listener?</em>
            </h2>
            <p className="text-white/45 text-base font-medium mb-10 max-w-xl mx-auto leading-relaxed">
              Join managers who use 1:1 Balance to build psychological safety and high-trust relationships — one meeting at a time.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={handleCTAClick}
                className="group flex items-center gap-3 px-10 py-4 rounded-full font-extrabold text-black text-base transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #CBFF00, #A8D800)",
                  boxShadow: "0 0 50px rgba(203,255,0,0.35)",
                }}>
                <Sparkles className="w-5 h-5" />
                Enter the Studio
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            <p className="text-white/25 text-xs font-medium mt-6">
              No signup required · 100% private · Encrypted at rest · Runs locally
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/6 py-10 px-6 sm:px-14 lg:px-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #CBFF00, #9ABA00)" }}>
              <Scale className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="text-sm font-extrabold text-white/70">1:1 Balance</span>
          </div>
          <p className="text-white/25 text-xs font-medium text-center">
            Built with Gemini AI · Private by Default · AES-256 Encrypted
          </p>
          <div className="flex items-center gap-5 text-xs font-semibold text-white/25">
            <a href="#features" className="hover:text-white/50 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white/50 transition-colors">How It Works</a>
            <a href="#privacy" className="hover:text-white/50 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>

      {/* Global inline styles for this page */}
      <style>{`
        @keyframes orb1 {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(8%, 10%) scale(1.2); }
        }
        @keyframes orb2 {
          0%   { transform: translate(0, 0) scale(1.1); }
          100% { transform: translate(-8%, -8%) scale(0.9); }
        }
        @keyframes orb3 {
          0%   { transform: scale(1) rotate(0deg); }
          100% { transform: scale(1.3) rotate(15deg); }
        }
        @keyframes landingExit {
          from { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
          to   { opacity: 0; transform: scale(1.03) translateY(-24px); filter: blur(4px); }
        }
        .landing-exit {
          animation: landingExit 0.5s cubic-bezier(0.4,0,1,1) forwards;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        .cursor-blink { animation: blink 0.9s step-end infinite; }
        @keyframes waveIdle {
          0%, 100% { transform: scaleY(1); }
          50%       { transform: scaleY(1.6); }
        }
        .wave-bar { animation: waveIdle 1.6s ease-in-out infinite; transform-origin: bottom; }
      `}</style>
    </div>
  );
}
