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
  rejection_reason?: string | null;
  payment_receipt_url?: string | null;
  payment_reference_no?: string | null;
  final_payment_receipt_url?: string | null;
  final_payment_reference_no?: string | null;
}

const formatDate = (dateVal: any) => {
  if (!dateVal) return "N/A";
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
};

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
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  const printContract = (request: ProjectRequest) => {
    const w = window.open("", "_blank");
    if (!w) return;
    const deliverablesHtml = request.deliverables
      ? request.deliverables.split("\n").map((d: string) => `<li>${d.replace(/^-\s*/, "").trim()}</li>`).join("")
      : "<li>Custom project specification deliverables</li>";
    
    const formatApprovalDate = (dateVal: any) => {
      const d = dateVal ? new Date(dateVal) : new Date();
      const day = d.getDate();
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();

      let suffix = "th";
      if (day === 1 || day === 21 || day === 31) suffix = "st";
      else if (day === 2 || day === 22) suffix = "nd";
      else if (day === 3 || day === 23) suffix = "rd";

      return `${day}${suffix} day of ${month}, ${year}`;
    };

    const currentYear = request.created_at ? new Date(request.created_at).getFullYear() : 2026;
    const approvalDateFormatted = formatApprovalDate(request.contract_signed_at);
    
    w.document.write(`
      <html>
        <head>
          <title>Agreement Contract - ${request.project_name}</title>
          <style>
            body { font-family: 'Georgia', serif; padding: 60px 50px; color: #111; line-height: 1.6; max-width: 800px; margin: 0 auto; background: #fff; }
            .logo-header { font-size: 11px; font-style: italic; color: #666; margin-bottom: 30px; text-align: center; }
            .logo-bold { font-weight: bold; font-style: normal; color: #111; font-size: 15px; }
            h1.agreement-title { text-align: center; font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px; }
            .series-subtitle { text-align: center; font-weight: bold; font-size: 13px; margin-bottom: 30px; text-transform: uppercase; }
            .legal-statement { font-weight: bold; text-align: justify; font-size: 12px; line-height: 1.6; margin-bottom: 25px; text-transform: uppercase; border-bottom: 1.5px solid #111; border-top: 1.5px solid #111; padding: 15px 0; }
            p.whereas-clause { text-align: justify; font-size: 12.5px; text-indent: 30px; margin-bottom: 15px; }
            p.whereas-clause span.whereas-bold { font-weight: bold; }
            .whereas-list { list-style-type: disc; margin-left: 55px; margin-bottom: 20px; font-size: 12.5px; }
            .whereas-list li { margin-bottom: 6px; }
            .resolving-clause { font-size: 12.5px; margin-bottom: 20px; text-align: justify; }
            .resolving-clause span.bold { font-weight: bold; }
            ol.deliverables-list { margin-left: 55px; margin-bottom: 25px; font-size: 12.5px; }
            ol.deliverables-list li { margin-bottom: 8px; line-height: 1.5; }
            .approved-statement { font-size: 12.5px; font-weight: bold; margin-top: 40px; margin-bottom: 60px; text-transform: uppercase; }
            .signatures-row { display: flex; justify-content: space-between; margin-top: 70px; }
            .sig-line-container { width: 42%; text-align: center; }
            .sig-underline { border-bottom: 1.5px solid #111; margin-bottom: 8px; height: 35px; font-style: italic; font-size: 17px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 2px; }
            .sig-label-title { font-weight: bold; font-size: 12px; }
            .sig-sub-label { font-size: 11px; color: #555; margin-top: 2px; }
            .actions-bar { margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
            @media print {
              .actions-bar { display: none; }
              body { padding: 30px 10px; }
            }
          </style>
        </head>
        <body>
          <div class="logo-header">(this must be my logo, which is the website logo, like <span class="logo-bold">Dee Jay.</span>)</div>
          
          <h1 class="agreement-title">Project Development Agreement</h1>
          <div class="series-subtitle">Series of ${currentYear}</div>
          
          <div class="legal-statement">
            A TERMS AUTHORIZING THE COMMENCEMENT AND EXECUTION OF THE PROJECT DEVELOPMENT AGREEMENT FOR THE APPLICATION "${request.project_name.toUpperCase()}" BETWEEN THE CLIENT, MR/MS. ${request.client_name?.toUpperCase() || "CLIENT"}, AND THE DEVELOPER, MR. DEE JAY CRISTOBAL, OUTLINING THE SCOPE, DELIVERABLES, AND FINANCES UNDER THE ${request.package_tier?.toUpperCase() || "STANDARD PACK"} ARRANGEMENT.
          </div>

          <p class="whereas-clause"><span class="whereas-bold">WHEREAS</span>, the Client, ${request.client_name || "Client Name"}, requires high-level professional technical software development services for the implementation and execution of the digital project specified as "${request.project_name}";</p>
          
          <p class="whereas-clause"><span class="whereas-bold">WHEREAS</span>, the Developer, Dee Jay Cristobal, possesses the requisite full-stack engineering expertise to deliver the comprehensive technical scope required by the Client;</p>
          
          <p class="whereas-clause"><span class="whereas-bold">WHEREAS</span>, both parties have mutually established and finalized the key technical parameters, project specifications, and milestones required for a successful launch;</p>
          
          <p class="whereas-clause"><span class="whereas-bold">WHEREAS</span>, the parameters, finances, and execution terms agreed upon under the "${request.package_tier || "Standard Pack"}" are designated as follows:</p>
          
          <ul class="whereas-list">
            <li><strong>Project Specification:</strong> ${request.project_name}</li>
            <li><strong>Project Package:</strong> ${request.package_tier || "Custom Services"}</li>
            <li><strong>Baseline Budget / Price Range:</strong> ${request.project_baseline || "Custom baseline"}</li>
            <li><strong>Estimated Timeline:</strong> ${request.est_timeline || "3 – 5 Weeks"}</li>
          </ul>

          <p class="resolving-clause">
            <span class="bold">NOW, THEREFORE</span>, upon the mutual understanding, consent, and execution of the terms detailed herein,
          </p>
          
          <p class="resolving-clause">
            <span class="bold">BE IT RESOLVED, AS IT IS HEREBY RESOLVED</span>, that the Developer shall execute and deliver the following Key Deliverables & Included Features:
          </p>

          <ol class="deliverables-list">
            ${deliverablesHtml}
          </ol>

          <p class="resolving-clause">
            <span class="bold">RESOLVED FURTHER</span>, that upon receipt of the full payment balance due for the development services, all title, copyrights, and intellectual property ownership rights to the final code, assets, and builds shall transfer exclusively to the Client.
          </p>

          <div class="approved-statement">
            APPROVED on this ${approvalDateFormatted}.
          </div>

          <div class="signatures-row">
            <div class="sig-line-container">
              <div class="sig-underline">Dee Jay Cristobal</div>
              <div class="sig-label-title">Dee Jay Cristobal</div>
              <div class="sig-sub-label">Developer Signature</div>
            </div>
            <div class="sig-line-container">
              <div class="sig-underline">${request.contract_signed ? (request.contract_signed_name || "Signed") : ""}</div>
              <div class="sig-label-title">${request.contract_signed ? (request.contract_signed_name || "Client") : "(Unsigned)"}</div>
              <div class="sig-sub-label">Client Signature</div>
            </div>
          </div>
          
          <div class="actions-bar">
            <button onclick="window.print()" style="padding: 12px 24px; font-weight: bold; background: #111; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">Print Contract / Save PDF</button>
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

  const submitRejection = async (id: number) => {
    const res = await fetch(`/api/project-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected", rejection_reason: rejectionReasonInput.trim() }),
    });
    if (res.ok) {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "rejected", rejection_reason: rejectionReasonInput.trim() } : r))
      );
      if (selected?.id === id) {
        setSelected((prev) =>
          prev ? { ...prev, status: "rejected", rejection_reason: rejectionReasonInput.trim() } : null
        );
      }
    }
    setRejectingId(null);
    setRejectionReasonInput("");
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
                        {formatDate(req.created_at)}
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
              {selected.status === "rejected" && selected.rejection_reason && (
                <div>
                  <p className="text-xs text-zinc-500">Rejection Note Sent</p>
                  <p className="mt-1 text-xs text-red-400 italic bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
                    &ldquo;{selected.rejection_reason}&rdquo;
                  </p>
                </div>
              )}

              {/* Downpayment Receipt */}
              {selected.payment_receipt_url && (
                <div className="border-t border-white/5 pt-4 space-y-1.5 text-left">
                  <p className="text-xs text-zinc-500">50% Downpayment Receipt</p>
                  <p className="text-xs text-zinc-300">
                    <span className="font-semibold text-white">Reference No:</span> {selected.payment_reference_no || "N/A"}
                  </p>
                  <a
                    href={selected.payment_receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-[10px] text-cyan-400 hover:underline"
                  >
                    View Downpayment Screenshot ↗
                  </a>
                </div>
              )}

              {/* Final Payment Receipt */}
              {selected.final_payment_receipt_url && (
                <div className="border-t border-white/5 pt-4 space-y-1.5 text-left">
                  <p className="text-xs text-zinc-500">Final 50% Payment Receipt</p>
                  <p className="text-xs text-zinc-300">
                    <span className="font-semibold text-white">Reference No:</span> {selected.final_payment_reference_no || "N/A"}
                  </p>
                  <a
                    href={selected.final_payment_receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-[10px] text-cyan-400 hover:underline"
                  >
                    View Final Payment Screenshot ↗
                  </a>
                </div>
              )}

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
              {(selected.status === "pending" || (selected.status === "accepted" && !selected.contract_signed)) && (
                rejectingId === selected.id ? (
                  <div className="w-full space-y-3 bg-zinc-900/40 p-4 rounded-xl border border-red-500/10 text-left">
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Reason for Rejection (Optional)</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Current workload is too high. Let's chat next month!"
                      value={rejectionReasonInput}
                      onChange={(e) => setRejectionReasonInput(e.target.value)}
                      className="glass w-full resize-none rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500/30 bg-zinc-950"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setRejectingId(null); setRejectionReasonInput(""); }}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-semibold text-zinc-400 transition-colors hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => submitRejection(selected.id)}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-[10px] font-bold text-white transition-opacity hover:opacity-90"
                      >
                        Confirm Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {selected.status === "pending" && (
                      <button
                        onClick={() => updateStatus(selected.id, "accepted")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-green-500/20 px-4 py-2 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/30"
                      >
                        <Check className="h-3.5 w-3.5" /> Accept
                      </button>
                    )}
                    <button
                      onClick={() => setRejectingId(selected.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/20 px-4 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/30"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject Request
                    </button>
                  </>
                )
              )}

              {selected.status !== "pending" && selected.status !== "rejected" && (() => {
                const isProgressDisabled = !selected.contract_signed;
                return (
                  <div className="relative ml-auto">
                    <button
                      disabled={isProgressDisabled}
                      onClick={() => setOpenDropdown(openDropdown === selected.id ? null : selected.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/20 px-4 py-2 text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30 ${
                        isProgressDisabled ? "opacity-40 cursor-not-allowed" : ""
                      }`}
                      title={isProgressDisabled ? "Progress updates are locked until the client signs the contract agreement." : undefined}
                    >
                      Set Progress <ChevronDown className="h-3 w-3" />
                    </button>
                    {openDropdown === selected.id && (
                      <div className="absolute right-0 top-full z-10 mt-1 w-40 overflow-hidden rounded-xl glass-strong">
                        {progressOptions.map((opt) => {
                          const isDeliveredDisabled = opt === "delivered" && !selected.final_payment_receipt_url;
                          return (
                            <button
                              key={opt}
                              disabled={isDeliveredDisabled}
                              onClick={() => updateStatus(selected.id, opt)}
                              className={`flex w-full px-4 py-2.5 text-left text-xs transition-colors hover:bg-white/5 ${
                                selected.status === opt ? "text-cyan-400" : "text-zinc-400"
                              } ${isDeliveredDisabled ? "opacity-30 cursor-not-allowed" : ""}`}
                              title={isDeliveredDisabled ? "Final payment receipt screenshot is required before delivery." : undefined}
                            >
                              {opt.replace("_", " ")} {isDeliveredDisabled && "🔒"}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
