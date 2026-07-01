"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function LogoutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <LoadingOverlay show={loggingOut} message="Signing out securely..." />
      <button
        onClick={handleLogout}
        className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
      >
        Sign Out
      </button>
    </>
  );
}
