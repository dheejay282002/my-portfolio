"use client";

import { useEffect, useState } from "react";
import { X, Check, XCircle, ChevronDown } from "lucide-react";
import Skeleton from "@/components/Skeleton";

interface ProjectRequest {
  id: number;
  client_id: number;
  project_name: string;
  description: string;
  tech_stack: string;
  status: string;
  conversation_id: number | null;
  created_at: string;
  client_name: string;
  client_email: string;
  package_tier?: string;
  project_baseline?: string;
  est_timeline?: string;
  deliverables?: string;
  contract_signed?: boolean;
  contract_signed_name?: string | null;
  contract_signed_at?: string | null;
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

const progressOptions = ["in_progress", "testing", "completed", "delivered"];

export default function ProjectRequestsPage() {
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ProjectRequest | null>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const printContract = (request: ProjectRequest) => {
    const w = window.open("", "_blank");
    if (!w) return;
    const deliverablesHtml = request.deliverables
      ? request.deliverables.split("\n").map((d: string) => `<li>${d}</li>`).join("")
      : "<li>Custom project specification deliverables</li>";
    
    w.document.write(`
      <html>
        <head>
          <title>Project Contract - ${request.project_name}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #111; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            h1 { border-bottom: 2px solid #333; padding-bottom: 10px; font-size: 24px; text-transform: uppercase; margin-bottom: 5px; }
            .subtitle { font-size: 14px; color: #666; margin-bottom: 30px; }
            h2 { font-size: 16px; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; text-transform: uppercase; }
            .meta { margin: 20px 0; background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee; }
            .meta p { margin: 5px 0; font-size: 14px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
            .sig-box { width: 45%; border-top: 1px solid #333; padding-top: 10px; }
            .sig-box p { margin: 3px 0; font-size: 13px; }
            .sig-box .font-sig { font-family: cursive, serif; font-size: 20px; font-style: italic; color: #111; margin-bottom: 10px; height: 30px; }
            .actions-bar { margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
            @media print {
              .actions-bar { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Project Development Agreement</h1>
          <div class="subtitle">This document outlines the scope, deliverables, and terms agreed upon for project commencement.</div>
          
          <p>This Project Development Agreement (the "Agreement") is executed on this date by and between the Client (specified below) and Dee Jay Cristobal (the "Developer").</p>

          <div class="meta">
            <p><strong>Project Specification:</strong> ${request.project_name}</p>
            <p><strong>Client Name:</strong> ${request.client_name}</p>
            <p><strong>Project Package:</strong> ${request.package_tier || "Custom Design & Build"}</p>
            <p><strong>Baseline Budget / Price Range:</strong> ${request.project_baseline || "Custom Baseline Quote"}</p>
            <p><strong>Estimated Timeline:</strong> ${request.est_timeline || "Custom Estimate"}</p>
          </div>

          <h2>1. Key Deliverables & Included Features</h2>
          <ul>
            ${deliverablesHtml}
          </ul>

          <h2>2. Intellectual Property Rights</h2>
          <p>The Developer transfers all ownership rights of the final build deliverables to the Client upon receiving the full contract payment balance due for the development services.</p>

          <h2>3. Execution & Agreement to Terms</h2>
          <p>Both parties acknowledge their mutual understanding of the scope details, pricing brackets, and timelines defined herein. By executing their signatures below, the parties establish a commitment to these terms.</p>

          <div class="signatures">
            <div class="sig-box">
              <div class="font-sig">Dee Jay Cristobal</div>
              <p><strong>Developer Signature</strong></p>
              <p>DEE JAY PORTFOLIO DEV</p>
            </div>
            <div class="sig-box">
              <div class="font-sig">${request.contract_signed_name || "(Pending Client Signature)"}</div>
              <p><strong>Client Signature</strong></p>
              <p>${request.client_name}</p>
              <p>Date: ${request.contract_signed_at ? new Date(request.contract_signed_at).toLocaleDateString() : new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          <div class="actions-bar">
            <button onclick="window.print()" style="padding: 12px 24px; font-weight: bold; background: #06b6d4; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; box-shadow: 0 4px 12px rgba(6,182,212,0.2);">Print Contract / Download PDF</button>
          </div>
        </body>
      </html>
    `);
    w.document.close();
  };

  useEffect(() => {
    fetch("/api/project-requests")
      .then((r) => r.json())
      .then((d) => { setRequests(d.requests); setLoading(false); });
  }, []);

  const updateStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/project-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : null);
    }
    setOpenDropdown(null);
  };

  if (loading) {
    return (
      <div className="px-6 py-24">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="mt-8">
          <div className="glass rounded-2xl border border-white/5 p-5 space-y-4">
            <div className="flex gap-8 border-b border-white/5 pb-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-12 ml-auto" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-8">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-4 w-12 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Project Requests</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Review and manage project requests from clients.
          </p>
        </div>
      </div>

      <div className="mt-8">
        {requests.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 glass rounded-2xl">No project requests yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl glass border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Project Name</th>
                  <th className="px-6 py-4">Tech Stack</th>
                  <th className="px-6 py-4">Submitted</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                {requests.map((req) => {
                  const techList = req.tech_stack
                    ? req.tech_stack.split(",").map((t) => t.trim())
                    : [];
                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-white/2 transition-colors cursor-pointer"
                      onClick={() => setSelected(req)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{req.client_name}</div>
                        <div className="text-xs text-zinc-500">{req.client_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-white">{req.project_name}</div>
                          {req.package_tier && (
                            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-medium text-blue-400">
                              {req.package_tier}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 line-clamp-1 max-w-xs">{req.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        {techList.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {techList.map((t) => (
                              <span
                                key={t}
                                className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500">
                        {new Date(req.created_at + "Z").toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusColors[req.status] || "bg-zinc-500/10 text-zinc-400"}`}>
                            {req.status.replace("_", " ")}
                          </span>
                          {req.status === "accepted" && (
                            <span className={`text-[9px] font-semibold ${req.contract_signed ? "text-green-400" : "text-yellow-500 animate-pulse"}`}>
                              {req.contract_signed ? "Signed ✓" : "Unsigned ✍️"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(req);
                          }}
                          className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => { setSelected(null); setOpenDropdown(null); }}
        >
          <div
            className="glass-strong w-full max-w-lg rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{selected.project_name}</h3>
              <button onClick={() => { setSelected(null); setOpenDropdown(null); }} className="text-zinc-500 transition-colors hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-zinc-500">Client</p>
                <p className="text-sm text-white">{selected.client_name}</p>
                <p className="text-xs text-zinc-400">{selected.client_email}</p>
              </div>
              {selected.package_tier && (
                <div>
                  <p className="text-xs text-zinc-500">Selected Package</p>
                  <p className="text-sm font-semibold text-cyan-400">{selected.package_tier}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-zinc-500">Description</p>
                <p className="mt-1 text-sm text-zinc-300 whitespace-pre-wrap">{selected.description}</p>
              </div>
              {selected.tech_stack && (
                <div>
                  <p className="text-xs text-zinc-500">Tech Stack</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {selected.tech_stack.split(",").map((t) => (
                      <span key={t.trim()} className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-400">
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-zinc-500">Status</p>
                <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${statusColors[selected.status] || "bg-zinc-500/10 text-zinc-400"}`}>
                  {selected.status.replace("_", " ")}
                </span>
              </div>
              {selected.status === "accepted" && (
                <div>
                  <p className="text-xs text-zinc-500">Contract Agreement Status</p>
                  {selected.contract_signed ? (
                    <div className="mt-1.5 space-y-2 text-left">
                      <p className="text-xs text-green-400 font-semibold">
                        ✓ Signed by <span className="underline font-bold text-white">{selected.contract_signed_name}</span> on {new Date(selected.contract_signed_at || "").toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => printContract(selected)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-bold text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
                      >
                        Print / Download Signed Contract
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-yellow-500 italic">Pending Client Signature</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
              {selected.status === "pending" && (
                <>
                  <button
                    onClick={() => updateStatus(selected.id, "accepted")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-green-500/20 px-4 py-2 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/30"
                  >
                    <Check className="h-3.5 w-3.5" /> Accept
                  </button>
                  <button
                    onClick={() => updateStatus(selected.id, "rejected")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/20 px-4 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/30"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </>
              )}

              {selected.status !== "pending" && selected.status !== "rejected" && (
                <div className="relative ml-auto">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === selected.id ? null : selected.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/20 px-4 py-2 text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30"
                  >
                    Set Progress <ChevronDown className="h-3 w-3" />
                  </button>
                  {openDropdown === selected.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-40 overflow-hidden rounded-xl glass-strong">
                      {progressOptions.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => updateStatus(selected.id, opt)}
                          className={`flex w-full px-4 py-2.5 text-left text-xs transition-colors hover:bg-white/5 ${
                            selected.status === opt ? "text-cyan-400" : "text-zinc-400"
                          }`}
                        >
                          {opt.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
