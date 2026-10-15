"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SecurePortal from "@/components/SecurePortal";

/**
 * Gates the public site behind PayContract (timetopay).
 *
 * - Timetopay "unlocked" (admin unlock or any active paid txn for this site)
 *   → site opens directly, no code required.
 * - Timetopay "locked" → Secure Portal code screen. A correct code unlocks
 *   the site for 15 minutes (stored as an expiry timestamp), then it
 *   auto-relocks and the code is required again.
 * - Status fetch failure fails closed (portal shown); the code still works.
 *
 * The site renders underneath and the portal covers it (fixed overlay), so
 * there is no blank flash while the status check runs.
 *
 * Owner routes (/login, /dashboard, /profile, /api) are never gated.
 */
const STATUS_URL =
  "https://timetosignandpay.vercel.app/api/public/status?ref=txn_deejay_none&scope=portfolio&site=deejay";
const STORAGE_KEY = "deejay_portal_until";
const UNLOCK_MS = 15 * 60 * 1000;

const EXEMPT_PREFIXES = ["/login", "/dashboard", "/profile", "/api"];

export default function PaywallGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [unlocked, setUnlocked] = useState(false);
  const relockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const exempt = EXEMPT_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  // Flip back to locked when the 15-minute window runs out (even mid-session).
  const armRelock = (until: number) => {
    if (relockTimer.current) clearTimeout(relockTimer.current);
    const delay = until - Date.now();
    if (delay <= 0) {
      setUnlocked(false);
      return;
    }
    relockTimer.current = setTimeout(() => setUnlocked(false), delay);
  };

  useEffect(() => {
    if (exempt) return;

    let cancelled = false;

    // Valid code-unlock from the last 15 minutes?
    let rememberedUntil = 0;
    try {
      rememberedUntil = Number(localStorage.getItem(STORAGE_KEY) || 0);
      if (rememberedUntil && rememberedUntil <= Date.now()) {
        localStorage.removeItem(STORAGE_KEY);
        rememberedUntil = 0;
      }
    } catch {
      rememberedUntil = 0;
    }

    if (rememberedUntil > Date.now()) {
      setUnlocked(true);
      armRelock(rememberedUntil);
      return;
    }

    (async () => {
      try {
        const res = await fetch(STATUS_URL, { cache: "no-store" });
        const data = (await res.json()) as { unlocked?: boolean };
        if (cancelled) return;
        // Timetopay unlocked opens it; otherwise keep (or re-show) the portal.
        if (data.unlocked === true) {
          setUnlocked(true);
          if (relockTimer.current) clearTimeout(relockTimer.current);
        } else {
          setUnlocked(false);
        }
      } catch {
        // Fail closed — portal stays; the static code still unlocks.
        if (!cancelled) setUnlocked(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [exempt, pathname]);

  useEffect(() => {
    return () => {
      if (relockTimer.current) clearTimeout(relockTimer.current);
    };
  }, []);

  if (exempt || unlocked) return <>{children}</>;

  return (
    <>
      {children}
      <SecurePortal
        onUnlock={() => {
          const until = Date.now() + UNLOCK_MS;
          try {
            localStorage.setItem(STORAGE_KEY, String(until));
          } catch {
            // Storage blocked — unlock still applies for this session's timer.
          }
          armRelock(until);
          setUnlocked(true);
        }}
      />
    </>
  );
}
