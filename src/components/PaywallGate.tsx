"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SecurePortal from "@/components/SecurePortal";

/**
 * Gates the public site behind PayContract (timetopay).
 *
 * - Timetopay "unlocked" (admin unlock or any active paid txn for this site)
 *   → site opens publicly for every visitor, no code, no idle lock.
 * - Timetopay "locked" → Secure Portal code screen. A correct code unlocks
 *   THIS device only (localStorage is per-browser). The unlock stays alive
 *   while the visitor is active (mouse / keys / touch / scroll); after 15
 *   minutes of no activity the site auto-relocks ON THE OPEN PAGE — the
 *   portal re-appears without any refresh. Backstops (30s interval +
 *   visibilitychange) cover browsers that suspend timers in background tabs.
 * - Status fetch failure fails closed (portal shown); the code still works.
 *
 * Owner routes (/login, /dashboard, /profile, /api) are never gated.
 */
const STATUS_URL =
  "https://timetosignandpay.vercel.app/api/public/status?ref=txn_deejay_none&scope=portfolio&site=deejay";
const STORAGE_KEY = "deejay_portal_last_active";
const LEGACY_KEY = "deejay_portal_until"; // previous fixed-expiry scheme
const IDLE_MS = 15 * 60 * 1000;
const IDLE_CHECK_MS = 30 * 1000;
const SAVE_THROTTLE_MS = 5000;

const EXEMPT_PREFIXES = ["/login", "/dashboard", "/profile", "/api"];

export default function PaywallGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [publicOpen, setPublicOpen] = useState(false);
  const [codeUnlocked, setCodeUnlocked] = useState(false);
  const lastActivityRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef(0);

  const exempt = EXEMPT_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  const lockNow = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    lastActivityRef.current = 0;
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // Ignore.
    }
    setCodeUnlocked(false);
  };

  // Single idle check used by the timer, the interval, and tab refocus.
  const checkIdle = () => {
    if (lastActivityRef.current > 0 && Date.now() - lastActivityRef.current > IDLE_MS) {
      lockNow();
    }
  };

  const noteActivity = (persist = true) => {
    const now = Date.now();
    lastActivityRef.current = now;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(checkIdle, IDLE_MS + 1000);
    if (persist && now - lastSavedRef.current > SAVE_THROTTLE_MS) {
      lastSavedRef.current = now;
      try {
        localStorage.setItem(STORAGE_KEY, String(now));
      } catch {
        // Ignore — unlock still lives in memory for this session.
      }
    }
  };

  // Re-check timetopay + restore a still-valid device unlock on each nav.
  useEffect(() => {
    if (exempt) return;

    let cancelled = false;

    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // Ignore.
    }

    // Code unlock from a previous visit on THIS device, if the visitor was
    // active within the idle window.
    let lastActive = 0;
    try {
      lastActive = Number(localStorage.getItem(STORAGE_KEY) || 0);
      if (lastActive && Date.now() - lastActive > IDLE_MS) {
        localStorage.removeItem(STORAGE_KEY);
        lastActive = 0;
      }
    } catch {
      lastActive = 0;
    }

    if (lastActive > 0) {
      // Opening the page counts as activity; the idle window restarts.
      noteActivity();
      setCodeUnlocked(true);
    } else {
      setCodeUnlocked(false);
    }

    (async () => {
      try {
        const res = await fetch(STATUS_URL, { cache: "no-store" });
        const data = (await res.json()) as { unlocked?: boolean };
        if (!cancelled) setPublicOpen(data.unlocked === true);
      } catch {
        // Fail closed — public open stays false; the code still unlocks.
        if (!cancelled) setPublicOpen(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exempt, pathname]);

  // While code-unlocked (and not publicly open): sense activity and
  // auto-relock on the open page after IDLE_MS of silence.
  useEffect(() => {
    if (exempt || publicOpen || !codeUnlocked) return;

    const onActivity = () => noteActivity();

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];
    for (const ev of events) {
      window.addEventListener(ev, onActivity, { passive: true });
    }

    // Backstops: background tabs can suspend setTimeout — re-check on an
    // interval and the moment the tab becomes visible again.
    const interval = setInterval(checkIdle, IDLE_CHECK_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") checkIdle();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      for (const ev of events) {
        window.removeEventListener(ev, onActivity);
      }
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exempt, publicOpen, codeUnlocked]);

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  if (exempt || publicOpen || codeUnlocked) return <>{children}</>;

  return (
    <>
      {children}
      <SecurePortal
        onUnlock={() => {
          lastSavedRef.current = Date.now();
          noteActivity();
          setCodeUnlocked(true);
        }}
      />
    </>
  );
}
