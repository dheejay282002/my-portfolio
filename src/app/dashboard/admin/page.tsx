"use client";

import { useEffect, useState } from "react";
import Skeleton from "@/components/Skeleton";
import {
  Users,
  FolderKanban,
  Wrench,
  BarChart3,
  ClipboardList,
  Mail,
  Globe,
  Settings,
  Shield,
  AlertTriangle,
  Activity,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";

const formatDate = (dateVal: any) => {
  if (!dateVal) return "N/A";
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
};

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface ProjectRequest {
  id: number;
  project_name: string;
  client_name: string;
  status: string;
  created_at: string;
}

interface SecurityEvent {
  id: number;
  event_type: string;
  ip_address: string;
  user_agent: string;
  email: string;
  details: string;
  created_at: string;
}

interface SecuritySummary {
  event_type: string;
  cnt: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400",
  accepted: "bg-green-500/10 text-green-400",
  rejected: "bg-red-500/10 text-red-400",
  in_progress: "bg-blue-500/10 text-blue-400",
  testing: "bg-purple-500/10 text-purple-400",
  completed: "bg-cyan-500/10 text-cyan-400",
  delivered: "bg-emerald-500/10 text-emerald-400",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  in_progress: "In Progress",
  testing: "Testing",
  completed: "Completed",
  delivered: "Delivered",
};

const quickLinks = [
  { label: "User Management", href: "/dashboard/admin/users", icon: Users, desc: "Manage all users" },
  { label: "Projects", href: "/dashboard/admin/projects", icon: FolderKanban, desc: "Manage portfolio projects" },
  { label: "Products", href: "/dashboard/admin/products", icon: ShoppingBag, desc: "Manage package tiers" },
  { label: "Services", href: "/dashboard/admin/services", icon: Wrench, desc: "Manage offered services" },
  { label: "Skills", href: "/dashboard/admin/skills", icon: BarChart3, desc: "Manage skill sets" },
  { label: "Project Requests", href: "/dashboard/admin/project-requests", icon: ClipboardList, desc: "Review client requests" },
  { label: "Email Config", href: "/dashboard/admin/email-config", icon: Mail, desc: "Configure email settings" },
  { label: "Web Settings", href: "/dashboard/admin/web-settings", icon: Globe, desc: "Customize site appearance" },
  { label: "Profile Settings", href: "/dashboard/admin/profile", icon: Settings, desc: "Update your profile" },
];

export default function AdminDashboard() {
  const [adminName, setAdminName] = useState("");
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);
  const [skillsCount, setSkillsCount] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [securitySummary, setSecuritySummary] = useState<SecuritySummary[]>([]);
  const [securityLast24h, setSecurityLast24h] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/project-requests").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
      fetch("/api/skills").then((r) => r.json()),
      fetch("/api/admin/security-events").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ])
      .then(([me, reqData, usersData, projData, svcData, skillData, secData, prodData]) => {
        setAdminName(me.user?.name || "Admin");
        setRequests(reqData.requests || []);
        setUsersCount(usersData.users?.length || 0);
        setUsers((usersData.users || []).slice(0, 5));
        setProjectsCount(projData.projects?.length || 0);
        setServicesCount(svcData.services?.length || 0);
        setSkillsCount(skillData.skills?.length || 0);
        setSecurityEvents(secData.events || []);
        setSecuritySummary(secData.summary || []);
        setSecurityLast24h(secData.last24h || 0);
        setProductsCount(prodData.products?.length || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const openCount = requests.filter((r) => r.status === "pending" || r.status === "in_progress" || r.status === "testing").length;
  const recentRequests = requests.slice(0, 5);

  const statCards = [
    { label: "Total Users", value: usersCount, icon: Users, color: "from-cyan-500 to-blue-600" },
    { label: "Project Requests", value: requests.length, icon: ClipboardList, color: "from-yellow-500 to-orange-600" },
    { label: "Products / Tiers", value: productsCount, icon: ShoppingBag, color: "from-emerald-500 to-teal-600" },
    { label: "Projects", value: projectsCount, icon: FolderKanban, color: "from-blue-500 to-purple-600" },
    { label: "Services", value: servicesCount, icon: Wrench, color: "from-purple-500 to-indigo-600" },
    { label: "Skills", value: skillsCount, icon: BarChart3, color: "from-pink-500 to-rose-600" },
  ];

  if (loading) {
    return (
      <div className="px-6 py-24 space-y-10">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="glass rounded-2xl divide-y divide-white/5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="glass rounded-2xl divide-y divide-white/5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-24 space-y-10">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {adminName.split(" ")[0]}!
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Here&apos;s an overview of your site.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {statCards.map((card) => (
          <div key={card.label} className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl bg-gradient-to-br ${card.color} p-2.5`}>
                <card.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <p className="text-xs text-zinc-400">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
        {/* Pending Requests */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Project Requests</h2>
            <Link
              href="/dashboard/admin/project-requests"
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View All ({requests.length})
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-zinc-600" />
              <p className="mt-3 text-sm text-zinc-500">No project requests yet.</p>
            </div>
          ) : (
            <div className="glass rounded-2xl divide-y divide-white/5">
              {recentRequests.map((req) => (
                <Link
                  key={req.id}
                  href="/dashboard/admin/project-requests"
                  className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">
                      {req.project_name}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 truncate">
                      by {req.client_name} &middot; {formatDate(req.created_at)}
                    </p>
                  </div>
                  <span
                    className={`ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                      statusColors[req.status] || "bg-zinc-500/10 text-zinc-400"
                    }`}
                  >
                    {statusLabels[req.status] || req.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Users */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Users</h2>
            <Link
              href="/dashboard/admin/users"
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View All
            </Link>
          </div>

          {users.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-zinc-600" />
              <p className="mt-3 text-sm text-zinc-500">No users yet.</p>
            </div>
          ) : (
            <div className="glass rounded-2xl divide-y divide-white/5">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      u.role === "admin"
                        ? "bg-cyan-500/10 text-cyan-400"
                        : "bg-zinc-500/10 text-zinc-400"
                    }`}
                  >
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── DDoS / Security Monitor ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">DDoS Protection &amp; Security Monitor</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-[10px] font-medium text-cyan-400">
              <Activity className="h-3 w-3" />
              {securityLast24h} events (24h)
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-medium text-red-400">
              <AlertTriangle className="h-3 w-3" />
              {securitySummary.find((s) => s.event_type === "failed_login")?.cnt || 0} failed logins
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {/* Summary breakdown */}
          <div className="lg:col-span-1 space-y-2">
            {securitySummary.length === 0 ? (
              <div className="glass rounded-2xl p-5 text-center">
                <Shield className="mx-auto h-6 w-6 text-zinc-600" />
                <p className="mt-2 text-xs text-zinc-500">No threats detected</p>
              </div>
            ) : (
              <div className="glass rounded-2xl p-4 space-y-2">
                {securitySummary.map((s) => (
                  <div key={s.event_type} className="flex items-center justify-between rounded-xl bg-white/2 px-3.5 py-2.5">
                    <span className="text-xs font-medium text-zinc-300 capitalize">
                      {s.event_type.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-bold text-white">{s.cnt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Event log */}
          <div className="lg:col-span-3">
            {securityEvents.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center">
                <Shield className="mx-auto h-8 w-8 text-zinc-600" />
                <p className="mt-2 text-sm text-zinc-500">
                  No security events yet. Failed login attempts will appear here.
                </p>
              </div>
            ) : (
              <div className="glass rounded-2xl max-h-[320px] overflow-y-auto scrollbar-hide">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-zinc-900/90 backdrop-blur-sm">
                    <tr className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">IP Address</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">User Agent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-zinc-400">
                    {securityEvents.slice(0, 20).map((ev) => (
                      <tr key={ev.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-500">
                          {new Date(ev.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            ev.event_type === "failed_login"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-yellow-500/10 text-yellow-400"
                          }`}>
                            {ev.event_type.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-300">{ev.ip_address}</td>
                        <td className="px-4 py-3">{ev.email || "-"}</td>
                        <td className="px-4 py-3 max-w-[200px] truncate" title={ev.user_agent}>
                          {ev.user_agent ? ev.user_agent.slice(0, 60) + "..." : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Quick Access</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="glass rounded-2xl p-4 text-center transition-all hover:bg-white/5"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <p className="mt-2 text-xs font-semibold text-white">{link.label}</p>
                <p className="mt-0.5 text-[10px] text-zinc-500 line-clamp-1">{link.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
