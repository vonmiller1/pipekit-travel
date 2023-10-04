"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, LayoutDashboard, ListChecks, TrendingDown, Sliders, Lock, Sparkles, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { secureStorage } from "@/lib/secureStorage";
import ManagerSettingsModal from "@/components/dashboard/ManagerSettingsModal";

const MANAGER_ID_KEY = "balance_manager_id";

export default function Navbar() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [managerId, setManagerId] = useState("");
  const [threshold, setThreshold] = useState(60);
  const [retentionDays, setRetentionDays] = useState(180);

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
  }, []);

  const navItems = [
    { name: "Team", href: "/team", icon: Users },
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Commitments", href: "/commitments", icon: ListChecks },
    { name: "Analytics", href: "/analytics", icon: TrendingDown },
    { name: "Settings", href: "/settings", icon: Sliders },
  ];

  return (
    <>
      <header className="sticky top-3 z-40 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#FFFFFF]/90 backdrop-blur-xl border border-[#F5BEC6] p-3 sm:p-4 rounded-3xl shadow-xl shadow-[#8B6FBD]/10 flex flex-col md:flex-row items-center justify-between gap-4 transition-all">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C3B1E1] via-[#8B6FBD] to-[#6E539F] flex items-center justify-center text-white shadow-md shadow-[#8B6FBD]/30 transition-transform group-hover:scale-105">
              <Scale className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-[#241830] tracking-tight flex items-center gap-2">
                1:1 Balance
                <span className="text-[10px] bg-[#FCE4E8] text-[#8B6FBD] border border-[#F5BEC6] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  AI Studio
                </span>
              </h1>
              <p className="text-[11px] text-[#665578] font-medium hidden sm:block">Executive Communication & Focus</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1.5 bg-[#FFF4F6] p-1.5 rounded-2xl border border-[#F5BEC6]">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-[#8B6FBD] text-white shadow-md shadow-[#8B6FBD]/25 scale-105"
                      : "text-[#665578] hover:text-[#241830] hover:bg-[#FCE4E8]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Lock & Privacy Pill */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-[#241830] bg-[#FCE4E8] border border-[#F5BEC6] px-3.5 py-2 rounded-xl">
              <Lock className="w-3.5 h-3.5 text-[#8B6FBD]" />
              <span>Private & Local</span>
            </div>
          </div>
        </div>
      </header>

      <ManagerSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        managerId={managerId}
        currentThreshold={threshold}
        currentRetention={retentionDays}
        onSettingsSaved={(th, ret) => {
          setThreshold(th);
          setRetentionDays(ret);
        }}
        onTriggerPrune={() => {}}
      />
    </>
  );
}
