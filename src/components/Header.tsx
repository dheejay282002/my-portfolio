"use client";

import { useState, useEffect } from "react";
import { Menu, LogIn } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Home", href: "/#home" },
  { label: "About", href: "/#about" },
  { label: "Skills", href: "/#skills" },
  { label: "Services", href: "/#services" },
  { label: "Projects", href: "/#projects" },
  { label: "Contact", href: "/#contact" },
];

export default function Header() {
  const [user, setUser] = useState<{ id: number; name: string; role: string; profile_photo?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const isHideNav = !mounted || loading || !!user || pathname?.startsWith("/dashboard") || pathname === "/login" || pathname === "/profile";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="w-full flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {!loading && user && (
            <button
              className="text-zinc-400 max-md:hidden"
              onClick={() => window.dispatchEvent(new CustomEvent("toggle-sidebar-expand"))}
              aria-label="Toggle sidebar"
            >
              <Menu size={24} />
            </button>
          )}
          {!loading && user && (
            <button
              className="text-zinc-400 md:hidden"
              onClick={() => window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"))}
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
          )}
          <a href={user ? "/dashboard" : "/#home"} className="text-xl font-bold tracking-tight">
            Dee Jay.
          </a>
        </div>

        {!isHideNav && (
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-zinc-400 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {!isHideNav && (
            <div className="hidden items-center gap-3 md:flex">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
              <a
                href="/#contact"
              >
              </a>
            </div>
          )}
          {!loading && user && (
            <Link
              href={
                user.role === "admin" ? "/dashboard/admin" : "/dashboard/client"
              }
              className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-white/5"
            >
              <div className="relative h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 overflow-hidden">
                {user.profile_photo ? (
                  <Image src={user.profile_photo} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium hidden md:inline">{user.name}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
