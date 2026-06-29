"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
    >
      Sign Out
    </button>
  );
}
