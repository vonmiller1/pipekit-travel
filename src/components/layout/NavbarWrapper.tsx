"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Navbar from "./Navbar";

const SEEN_LANDING_KEY = "balance_seen_landing";

export default function NavbarWrapper() {
  const pathname = usePathname();
  const [showNavbar, setShowNavbar] = useState(false);

  useEffect(() => {
    // Always show navbar on non-root pages
    if (pathname !== "/") {
      setShowNavbar(true);
      return;
    }

    // On root path, show navbar only if user has already seen the landing page
    try {
      const seen = localStorage.getItem(SEEN_LANDING_KEY);
      setShowNavbar(seen === "true");
    } catch {
      setShowNavbar(true);
    }

    // Listen for when user enters app from landing
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SEEN_LANDING_KEY && e.newValue === "true") {
        setShowNavbar(true);
      }
    };

    window.addEventListener("storage", handleStorage);

    // Poll localStorage for landing→dashboard transition (same tab)
    const interval = setInterval(() => {
      try {
        const seen = localStorage.getItem(SEEN_LANDING_KEY);
        if (seen === "true") {
          setShowNavbar(true);
          clearInterval(interval);
        }
      } catch {}
    }, 200);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [pathname]);

  if (!showNavbar) return null;

  return <Navbar />;
}
