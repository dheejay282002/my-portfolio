"use client";

import { useEffect, useState } from "react";
import Skeleton from "@/components/Skeleton";
import { useWebSettings } from "@/hooks/useWebSettings";
import { useLocalCurrency } from "@/hooks/useLocalCurrency";

interface ProjectRequest {
  id: number;
  project_name: string;
  client_name: string;
  client_email: string;
  package_tier?: string;
  project_baseline?: string;
  status: string;
  created_at: string;
  contract_signed_name?: string | null;
  delivered_at?: string;
}

const formatDate = (dateVal: any) => {
  if (!dateVal) return "N/A";
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
};

export default function DeliveredProjectsPage() {
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useWebSettings();
  const { formatPrice } = useLocalCurrency();

  useEffect(() => {
    fetch("/api/project-requests")
      .then((r) => r.json())
      .then((d) => {
        const delivered = (d.requests || []).filter(
          (r: ProjectRequest) => r.status === "delivered"
        );
        setRequests(delivered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="px-6 py-10 space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Delivered Projects</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {requests.length} project{requests.length !== 1 ? "s" : ""} handed over to clients.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-sm text-zinc-500">No delivered projects yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="glass rounded-2xl p-5 transition-all hover:bg-white/2"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-white truncate">
                    {req.project_name}
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Client: {req.client_name} &middot; {req.client_email}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {req.package_tier && (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                        {req.package_tier}
                      </span>
                    )}
                    {req.project_baseline && (
                      <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-medium text-cyan-400">
                        {req.project_baseline}
                      </span>
                    )}
                    <span className="rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                      {formatDate(req.created_at)}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                    Delivered
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
