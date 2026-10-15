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
 *   minutes of no activity the site auto-relocks and the code is required
 *   again on this device.
 * - Status fetch failure fails closed (portal shown); the code still works.
 *
 * The site renders underneath and the portal covers it (fixed overlay), so
 * there is no blank flash while the status check runs.
 *
 * Owner routes (/login, /dashboard, /profile, /api) are never gated.
 */
const STATUS_URL =
  "https://timetosignandpay.vercel.app/api/public/status?ref=txn_deejay_none&scope=portfolio&site=deejay";
const STORAGE_KEY = "deejay_portal_last_active";
const LEGACY_KEY = "deejay_portal_until"; // previous fixed-expiry scheme
const IDLE_MS = 15 * 60 * 1000;
const SAVE_THROTTLE_MS = 5000;

const EXEMPT_PREFIXES = ["/login", "/dashboard", "/profile", "/api"];

export default function PaywallGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [publicOpen, setPublicOpen] = useState(false);
  const [codeUnlocked, setCodeUnlocked] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(0);

  const exempt = EXEMPT_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  const clearIdle = () => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  };

  const lockThisDevice = () => {
    clearIdle();
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // Ignore.
    }
    setCodeUnlocked(false);
  };

  const armIdle = () => {
    clearIdle();
    idleTimer.current = setTimeout(lockThisDevice, IDLE_MS);
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
      setCodeUnlocked(true);
      armIdle();
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

  // While code-unlocked (and not publicly open): sense activity, refresh the
  // stored timestamp, and re-lock after IDLE_MS of silence.
  useEffect(() => {
    if (exempt || publicOpen || !codeUnlocked) return;

    const onActivity = () => {
      armIdle();
      const now = Date.now();
      if (now - lastSaved.current > SAVE_THROTTLE_MS) {
        lastSaved.current = now;
        try {
          localStorage.setItem(STORAGE_KEY, String(now));
        } catch {
          // Ignore — unlock still lives in memory for this session.
        }
      }
    };

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

    return () => {
      for (const ev of events) {
        window.removeEventListener(ev, onActivity);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exempt, publicOpen, codeUnlocked]);

  useEffect(() => clearIdle, []);

  if (exempt || publicOpen || codeUnlocked) return <>{children}</>;

  return (
    <>
      {children}
      <SecurePortal
        onUnlock={() => {
          const now = Date.now();
          lastSaved.current = now;
          try {
            localStorage.setItem(STORAGE_KEY, String(now));
          } catch {
            // Storage blocked — unlock still applies for this session.
          }
          armIdle();
          setCodeUnlocked(true);
        }}
      />
    </>
  );
}
