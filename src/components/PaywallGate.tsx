"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SecurePortal from "@/components/SecurePortal";

/**
 * Gates the public site behind PayContract (timetopay).
 *
 * - Timetopay "unlocked" (admin unlock or any active paid txn for this site)
 *   → site opens directly, no code required.
 * - Timetopay "locked" → Secure Portal code screen; correct code unlocks and
 *   is remembered in localStorage for this browser.
 * - Status fetch failure fails closed (portal shown); the code still works.
 *
 * The site renders underneath and the portal covers it (fixed overlay), so
 * there is no blank flash while the status check runs.
 *
 * Owner routes (/login, /dashboard, /profile, /api) are never gated.
 */
const STATUS_URL =
  "https://timetosignandpay.vercel.app/api/public/status?ref=txn_deejay_none&scope=portfolio&site=deejay";
const STORAGE_KEY = "deejay_portal_ok";

const EXEMPT_PREFIXES = ["/login", "/dashboard", "/profile", "/api"];

export default function PaywallGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [unlocked, setUnlocked] = useState(false);

  const exempt = EXEMPT_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  useEffect(() => {
    if (exempt) return;

    let cancelled = false;

    // Remembered unlock from a previous visit in this browser.
    let remembered = false;
    try {
      remembered = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // localStorage unavailable — always re-check / require code.
    }

    if (remembered) {
      setUnlocked(true);
      return;
    }

    (async () => {
      try {
        const res = await fetch(STATUS_URL, { cache: "no-store" });
        const data = (await res.json()) as { unlocked?: boolean };
        if (!cancelled && data.unlocked === true) setUnlocked(true);
      } catch {
        // Fail closed — portal stays; the static code still unlocks.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [exempt, pathname]);

  if (exempt || unlocked) return <>{children}</>;

  return (
    <>
      {children}
      <SecurePortal
        onUnlock={() => {
          try {
            localStorage.setItem(STORAGE_KEY, "1");
          } catch {
            // Ignore — session-only unlock if storage is blocked.
          }
          setUnlocked(true);
        }}
      />
    </>
  );
}
