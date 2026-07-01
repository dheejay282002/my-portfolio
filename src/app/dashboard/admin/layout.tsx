"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import LoadingOverlay from "@/components/LoadingOverlay";
import Skeleton from "@/components/Skeleton";
import {
  Users,
  FolderKanban,
  Wrench,
  BarChart3,
  Settings,
  ClipboardList,
  LogOut,
  Menu,
  Mail,
  Globe,
  ShoppingBag,
} from "lucide-react";

const navItems = [
  { label: "User Management", href: "/dashboard/admin/users", icon: Users },
  { label: "Projects", href: "/dashboard/admin/projects", icon: FolderKanban },
  { label: "Products", href: "/dashboard/admin/products", icon: ShoppingBag },
  { label: "Services", href: "/dashboard/admin/services", icon: Wrench },
  { label: "Skills", href: "/dashboard/admin/skills", icon: BarChart3 },
  { label: "Project Requests", href: "/dashboard/admin/project-requests", icon: ClipboardList },
  { label: "Email Config", href: "/dashboard/admin/email-config", icon: Mail },
  { label: "Web Settings", href: "/dashboard/admin/web-settings", icon: Globe },
  { label: "Profile Settings", href: "/dashboard/admin/profile", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string; profile_photo?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  
  interface ToastAlert {
    id: number;
    project_name: string;
    client_name: string;
    type: "new_request" | "contract_signed";
  }
  const [activeToast, setActiveToast] = useState<ToastAlert | null>(null);
  const prevRequestsCountRef = useRef<number>(-1);

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 520;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2); gain2.connect(ctx.destination);
        osc2.frequency.value = 680;
        gain2.gain.setValueAtTime(0.15, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc2.start(ctx.currentTime); osc2.stop(ctx.currentTime + 0.15);
      }, 160);
    } catch {}
  };

  const handleAcknowledge = async () => {
    if (!activeToast) return;
    if (activeToast.type === "contract_signed") {
      await fetch(`/api/project-requests/${activeToast.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contract_signed_acknowledged: true }),
      });
    }
    setActiveToast(null);
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.user || d.user.role !== "admin") router.push("/login");
        setUser(d.user);
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    if (loading || !user) return;

    const checkNewRequests = async () => {
      try {
        const res = await fetch("/api/project-requests");
        if (res.ok) {
          const data = await res.json();
          const requestsList = data.requests || [];
          const currentCount = requestsList.length;

          // 1. Check for newly signed contracts
          const unacknowledgedSigned = requestsList.find(
            (r: any) => r.contract_signed && !r.contract_signed_acknowledged
          );
          if (unacknowledgedSigned) {
            setActiveToast({
              id: unacknowledgedSigned.id,
              project_name: unacknowledgedSigned.project_name,
              client_name: unacknowledgedSigned.client_name || "A client",
              type: "contract_signed",
            });
            playNotificationSound();
          } else if (prevRequestsCountRef.current !== -1 && currentCount > prevRequestsCountRef.current) {
            // 2. Check for new project requests (only if no active signature alerts are shown)
            const newRequests = requestsList.slice(0, currentCount - prevRequestsCountRef.current);
            const latest = newRequests[0];
            if (latest && latest.status === "pending") {
              setActiveToast({
                id: latest.id,
                project_name: latest.project_name,
                client_name: latest.client_name || "A client",
                type: "new_request",
              });
              playNotificationSound();
            }
          }
          prevRequestsCountRef.current = currentCount;
        }
      } catch {}
    };

    checkNewRequests();
    const interval = setInterval(checkNewRequests, 10000);
    return () => clearInterval(interval);
  }, [loading, user]);

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      handleAcknowledge();
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  useEffect(() => {
    const handler = () => setMobileOpen((v) => !v);
    window.addEventListener("toggle-mobile-sidebar", handler);
    return () => window.removeEventListener("toggle-mobile-sidebar", handler);
  }, []);

  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handler = () => setExpanded((v) => !v);
    window.addEventListener("toggle-sidebar-expand", handler);
    return () => window.removeEventListener("toggle-sidebar-expand", handler);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const handleClick = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [expanded]);

  if (loading) {
    return (
      <div className="flex min-h-screen pt-16">
        <aside className="fixed bottom-0 left-0 top-16 z-40 w-16 border-r border-white/5 glass md:flex flex-col items-center py-4 hidden">
          <Skeleton className="h-5 w-5 rounded-lg" />
          <div className="flex flex-col gap-4 mt-6 px-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-10 rounded-xl" />
            ))}
          </div>
          <div className="mt-auto">
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
        </aside>
        <div className="flex-1 md:pl-16">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  const showExpanded = expanded || mobileOpen;
  const sidebarWidth = expanded ? "w-64" : "w-16";

  return (
    <div className="flex min-h-screen pt-16">
      <LoadingOverlay show={loggingOut} message="Signing out securely..." />
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        className={`fixed bottom-0 left-0 top-16 z-40 border-r border-white/5 glass transition-all duration-300 ${sidebarWidth} max-md:w-64 max-md:-translate-x-full max-md:data-[open]:translate-x-0`}
        data-open={mobileOpen ? "" : undefined}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <div className="flex flex-col h-full">
          <nav className="flex flex-col gap-1 px-2 pb-4 mt-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => { setMobileOpen(false); }}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                    showExpanded ? "justify-start" : "justify-center"
                  } ${
                    active
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                  title={showExpanded ? undefined : item.label}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {showExpanded && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-white/5 p-3">
            {showExpanded ? (
              <div className="flex items-center gap-3 px-1">
                <div className="relative h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
                  {user?.profile_photo ? (
                    <Image src={user.profile_photo} alt="" fill className="rounded-full object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || "A"}
                    </div>
                  )}
                </div>
                <div className="flex-1 truncate">
                  <p className="text-sm text-white">{user?.name}</p>
                  <p className="text-xs text-zinc-500">Admin</p>
                </div>
                <button
                  onClick={async () => {
                    setLoggingOut(true);
                    await fetch("/api/auth/logout", { method: "POST" });
                    router.push("/");
                    router.refresh();
                  }}
                  className="text-zinc-500 transition-colors hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <button
                  onClick={async () => {
                    setLoggingOut(true);
                    await fetch("/api/auth/logout", { method: "POST" });
                    router.push("/");
                    router.refresh();
                  }}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:text-red-400"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className={`flex-1 transition-all duration-300 ${expanded ? "md:pl-64" : "md:pl-16"}`}>
        {children}
      </div>

      {activeToast && (
        <div className="fixed right-6 top-6 z-[250] flex w-full max-w-sm overflow-hidden rounded-2xl border border-cyan-500/20 bg-zinc-950/85 backdrop-blur-xl p-4 shadow-xl shadow-cyan-500/10 transition-all duration-300 animate-slide-in">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400">
              <ClipboardList className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold text-white">
                {activeToast.type === "contract_signed" ? "Contract Signed! ✍️" : "New Project Request! 📋"}
              </p>
              <p className="mt-1 text-xs text-zinc-400 leading-normal">
                <span className="font-semibold text-white">{activeToast.client_name}</span>{" "}
                {activeToast.type === "contract_signed" ? "signed the project contract:" : "submitted a project request:"}
                <span className="italic block mt-0.5 text-cyan-400 truncate">{activeToast.project_name}</span>
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  href="/dashboard/admin/project-requests"
                  onClick={handleAcknowledge}
                  className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 text-[10px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  View Requests
                </Link>
                <button
                  onClick={handleAcknowledge}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-semibold text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
