"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SessionResponse } from "@/lib/types";

export function useSessionPolling(sessionId: string | null) {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const fetchSession = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/sessions/${id}`);
        if (!res.ok) return;
        const data: SessionResponse = await res.json();
        setSession(data);

        if (data.status !== "queued") {
          stopPolling();
        }
      } catch (error) {
        console.error("[Polling] Error:", error);
      }
    },
    [stopPolling]
  );

  useEffect(() => {
    if (!sessionId) {
      stopPolling();
      return;
    }

    // Initial fetch
    fetchSession(sessionId);
    setIsPolling(true);

    // Poll every 2 seconds
    intervalRef.current = setInterval(() => {
      fetchSession(sessionId);
    }, 2000);

    return () => {
      stopPolling();
    };
  }, [sessionId, fetchSession, stopPolling]);

  return { session, isPolling };
}
