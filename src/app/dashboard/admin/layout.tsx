"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
} from "lucide-react";

const navItems = [
  { label: "User Management", href: "/dashboard/admin/users", icon: Users },
  { label: "Projects", href: "/dashboard/admin/projects", icon: FolderKanban },
  { label: "Services", href: "/dashboard/admin/services", icon: Wrench },
  { label: "Skills", href: "/dashboard/admin/skills", icon: BarChart3 },
  { label: "Project Requests", href: "/dashboard/admin/project-requests", icon: ClipboardList },
  { label: "Email Config", href: "/dashboard/admin/email-config", icon: Mail },
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

  if (loading) return null;

  const showExpanded = expanded || mobileOpen;
  const sidebarWidth = expanded ? "w-64" : "w-16";

  return (
    <div className="flex min-h-screen pt-16">
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
    </div>
  );
}
