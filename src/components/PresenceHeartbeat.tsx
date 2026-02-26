"use client";

import { useEffect, useRef } from "react";

const HEARTBEAT_MS = 30_000;

async function sendPresencePing() {
  try {
    await fetch("/api/presence/ping", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
    });
  } catch {
    // ignore network hiccups
  }
}

export default function PresenceHeartbeat() {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const clearHeartbeat = () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const startHeartbeat = () => {
      clearHeartbeat();
      void sendPresencePing();
      intervalRef.current = window.setInterval(() => {
        if (document.visibilityState === "visible") {
          void sendPresencePing();
        }
      }, HEARTBEAT_MS);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        startHeartbeat();
      } else {
        clearHeartbeat();
      }
    };

    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearHeartbeat();
    };
  }, []);

  return null;
}

