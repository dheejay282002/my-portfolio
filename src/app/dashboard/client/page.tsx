"use client";

import { useEffect, useState } from "react";
import Skeleton from "@/components/Skeleton";
import { ClipboardList, FileText, MessageSquare, Settings, Star, Wrench } from "lucide-react";
import Link from "next/link";

interface ProjectRequest {
  id: number;
  project_name: string;
  description: string;
  tech_stack: string;
  status: string;
  created_at: string;
  rating?: number | null;
  review_content?: string | null;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  last_name?: string;
  profile_photo?: string;
}

interface AdminProfile {
  name: string;
  last_name?: string;
  profile_photo?: string;
  bio?: string;
  projects_delivered: number;
}

interface Service {
  id: number;
  title: string;
  description: string;
  icon?: string;
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

export default function ClientDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/project-requests").then((r) => r.json()),
      fetch("/api/profile/public").then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
    ])
      .then(([meData, requestsData, profileData, servicesData]) => {
        setUser(meData.user);
        setRequests(requestsData.requests || []);
        setAdminProfile(profileData.admin);
        setServices((servicesData.services || []).slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const inProgressCount = requests.filter(
    (r) => r.status === "in_progress" || r.status === "testing"
  ).length;
  const completedCount = requests.filter(
    (r) => r.status === "completed" || r.status === "delivered"
  ).length;
  const recentRequests = requests.slice(0, 5);

  const statCards = [
    {
      label: "Total Requests",
      value: requests.length,
      icon: ClipboardList,
      color: "from-cyan-500 to-blue-600",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: FileText,
      color: "from-yellow-500 to-orange-600",
    },
    {
      label: "In Progress",
      value: inProgressCount,
      icon: Wrench,
      color: "from-blue-500 to-purple-600",
    },
    {
      label: "Completed",
      value: completedCount,
      icon: Star,
      color: "from-emerald-500 to-green-600",
    },
  ];

  if (loading) {
    return (
      <div className="px-6 py-24 space-y-10">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-16" />
            </div>
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
          <div className="space-y-6">
            <div className="glass rounded-2xl p-5 space-y-4">
              <Skeleton className="h-4 w-20" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="glass rounded-2xl p-5 space-y-3">
              <Skeleton className="h-4 w-16" />
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
            <div className="glass rounded-2xl p-5 space-y-3">
              <Skeleton className="h-4 w-20" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
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
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Here&apos;s an overview of your project requests and account.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Project Requests */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Requests</h2>
            <Link
              href="/dashboard/client/project-requests"
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View All
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-zinc-600" />
              <p className="mt-3 text-sm text-zinc-500">
                No project requests yet.
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                Start a conversation with the developer to submit a request.
              </p>
            </div>
          ) : (
            <div className="glass rounded-2xl divide-y divide-white/5">
              {recentRequests.map((req) => (
                <Link
                  key={req.id}
                  href="/dashboard/client/project-requests"
                  className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">
                      {req.project_name}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 truncate">
                      {new Date(req.created_at + "Z").toLocaleDateString()}
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Admin Profile */}
          {adminProfile && (
            <div className="glass rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Developer</h3>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-lg font-bold text-white">
                  {adminProfile.profile_photo ? (
                    <img
                      src={adminProfile.profile_photo}
                      alt={adminProfile.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (adminProfile.name.charAt(0) + (adminProfile.last_name?.charAt(0) || "")).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {adminProfile.name} {adminProfile.last_name || ""}
                  </p>
                  {adminProfile.bio && (
                    <p className="mt-0.5 text-xs text-zinc-400 line-clamp-2">{adminProfile.bio}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/2 px-4 py-3">
                <Star className="h-4 w-4 text-cyan-400" />
                <span className="text-xs text-zinc-400">
                  <strong className="text-white">{adminProfile.projects_delivered}</strong> projects delivered
                </span>
              </div>
            </div>
          )}

          {/* Services */}
          {services.length > 0 && (
            <div className="glass rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white">Services</h3>
              <div className="space-y-2">
                {services.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl bg-white/2 px-3.5 py-2.5"
                  >
                    <p className="text-xs font-medium text-white">{s.title}</p>
                    <p className="mt-0.5 text-[10px] text-zinc-500 line-clamp-1">{s.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="glass rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/dashboard/client/project-requests"
                className="flex items-center gap-3 rounded-xl bg-white/2 px-4 py-3 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                <ClipboardList className="h-4 w-4 text-cyan-400" />
                View Project Requests
              </Link>
              <Link
                href="/dashboard/client/profile"
                className="flex items-center gap-3 rounded-xl bg-white/2 px-4 py-3 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Settings className="h-4 w-4 text-cyan-400" />
                Profile Settings
              </Link>
              <Link
                href="/"
                className="flex items-center gap-3 rounded-xl bg-white/2 px-4 py-3 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                <MessageSquare className="h-4 w-4 text-cyan-400" />
                Start a Conversation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
