"use client";

import { Fragment, useEffect, useState } from "react";
import { Star, X, Upload, AlertCircle, Check, CreditCard, Clock } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import Image from "next/image";

interface ProjectRequest {
  id: number;
  project_name: string;
  description: string;
  tech_stack: string;
  status: string;
  created_at: string;
  rating?: number | null;
  review_content?: string | null;
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

const formatDate = (dateVal: any) => {
  if (!dateVal) return "N/A";
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
};

interface FinalPaymentModalProps {
  request: ProjectRequest;
  onClose: () => void;
  onSuccess: (id: number, receiptUrl: string, refNo: string) => void;
}

interface PaymentMethod {
  id: number;
  provider_name: string;
  account_name: string;
  account_number: string;
  qr_code_url: string;
  is_active: boolean;
}

function FinalPaymentModal({ request, onClose, onSuccess }: FinalPaymentModalProps) {
  const [refNo, setRefNo] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [showQRId, setShowQRId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/payment-methods")
      .then((r) => r.json())
      .then((d) => {
        setPaymentMethods(d.methods?.filter((m: any) => m.is_active) || []);
        setLoadingMethods(false);
      })
      .catch(() => setLoadingMethods(false));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setReceiptUrl(data.url);
      } else {
        setError("Failed to upload screenshot. Please make sure file size is under 4.5MB.");
      }
    } catch {
      setError("An error occurred during file upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptUrl || !refNo.trim()) {
      setError("Please upload the final payment receipt screenshot and enter reference number.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/project-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          final_payment_receipt_url: receiptUrl,
          final_payment_reference_no: refNo.trim(),
        }),
      });

      if (res.ok) {
        onSuccess(request.id, receiptUrl, refNo.trim());
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Fake Receipt Detected or invalid reference code. Please verify.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 overflow-y-auto py-10">
      <div className="glass w-full max-w-xl rounded-3xl p-8 relative max-h-[90vh] overflow-y-auto flex flex-col justify-between text-left" onClick={(e) => e.stopPropagation()}>
        <div>
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-cyan-400" />
                Complete Final Payment (50% Balance)
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">{request.project_name}</p>
            </div>
            <button onClick={onClose} className="text-zinc-500 transition-colors hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            Your project build is completed and staging is ready! Please settle the remaining 50% balance payment of <span className="text-cyan-400 font-bold">{request.project_baseline}</span> using any of the bank channels below, and upload your payment receipt below to unlock code handover delivery.
          </p>

          {/* Payment Methods */}
          <div className="space-y-3 mb-6">
            <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Developer Bank Accounts</h4>
            {loadingMethods ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full rounded-xl animate-pulse" />
                <Skeleton className="h-10 w-full rounded-xl animate-pulse" />
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="rounded-xl border border-white/5 p-4 text-xs text-zinc-500 text-center italic bg-white/2">
                No active payment accounts found. Please contact developer via chat.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {paymentMethods.map((m) => (
                  <div key={m.id} className="p-4 rounded-xl bg-zinc-950/40 border border-white/5 flex flex-col justify-between space-y-3">
                    <div>
                      <p className="text-[10px] font-semibold text-zinc-500 uppercase">{m.provider_name}</p>
                      <p className="text-xs font-bold text-white mt-1">{m.account_name}</p>
                      <p className="text-xs font-mono text-cyan-400 tracking-wider mt-0.5">{m.account_number}</p>
                    </div>
                    {m.qr_code_url && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowQRId(showQRId === m.id ? null : m.id)}
                          className="text-[10px] text-cyan-400 hover:underline inline-flex items-center gap-1"
                        >
                          {showQRId === m.id ? "Hide QR Code" : "Show QR Code ↗"}
                        </button>
                        {showQRId === m.id && (
                          <div className="relative mt-2 h-28 w-28 mx-auto border border-white/10 rounded-xl overflow-hidden bg-white">
                            <Image src={m.qr_code_url} alt="Bank QR" fill className="object-contain" unoptimized />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload form */}
          <form onSubmit={handleSubmit} className="space-y-4 border-t border-white/5 pt-6 text-left">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Transaction Reference Number</label>
              <input
                type="text"
                placeholder="Enter bank transfer reference number"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                required
                className="glass w-full rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 bg-zinc-950"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Payment Receipt Screenshot</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  onChange={handleUpload}
                  accept="image/*"
                  id="final-receipt-upload"
                  className="hidden"
                />
                <label
                  htmlFor="final-receipt-upload"
                  className="cursor-pointer rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-white/20 hover:text-white bg-zinc-950/40 inline-flex items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? "Uploading..." : "Upload Screenshot"}
                </label>
                {receiptUrl && (
                  <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                    <Check className="h-4 w-4" /> Screenshot Added
                  </span>
                )}
              </div>
            </div>

            <div className="pt-4 flex gap-3 border-t border-white/5 mt-6">
              <button
                type="submit"
                disabled={submitting || uploading}
                className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Analyzing Receipt..." : "Submit Final Payment"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 px-5 py-2.5 text-xs font-semibold text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface ReviewModalProps {
  request: ProjectRequest;
  onClose: () => void;
  onSuccess: (rating: number, content: string) => void;
}

function ReviewModal({ request, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(request.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState(request.review_content || "");
  const [isEditing, setIsEditing] = useState(!request.rating);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setRating(request.rating || 0);
    setContent(request.review_content || "");
    setIsEditing(!request.rating);
  }, [request]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating");
      return;
    }
    if (!content.trim()) {
      setError("Please write a review comment");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/project-requests/${request.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, content }),
      });
      if (res.ok) {
        onSuccess(rating, content);
        setIsEditing(false);
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit review");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div 
        className="glass-strong w-full max-w-md rounded-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            {request.rating ? "Project Review" : "Add Project Review"}
          </h3>
          <button 
            onClick={onClose} 
            className="text-zinc-500 transition-colors hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-zinc-300">{request.project_name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Please rate your experience with this delivered project.</p>
            </div>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => {
                const starVal = i + 1;
                const isActive = starVal <= (hoveredRating || rating);
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoveredRating(starVal)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="text-zinc-600 transition-colors hover:text-cyan-400 focus:outline-none"
                  >
                    <Star
                      className={`h-7 w-7 transition-all ${
                        isActive ? "fill-cyan-400 text-cyan-400 scale-110" : "text-zinc-600"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Your Feedback</label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="How was the project? What did you like about the developer's work?"
                className="glass w-full resize-none rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              {request.rating && (
                <button
                  type="button"
                  onClick={() => {
                    setRating(request.rating || 0);
                    setContent(request.review_content || "");
                    setIsEditing(false);
                  }}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Saving..." : request.rating ? "Save Changes" : "Submit Review"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-zinc-300">{request.project_name}</p>
            </div>

            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < (request.rating || 0)
                      ? "fill-cyan-400 text-cyan-400"
                      : "text-zinc-700"
                  }`}
                />
              ))}
            </div>

            <div>
              <p className="text-xs text-zinc-500">Your Feedback</p>
              <p className="mt-1.5 text-xs text-zinc-300 italic leading-relaxed bg-white/2 rounded-xl p-4 border border-white/5 whitespace-pre-wrap">
                &ldquo;{request.review_content}&rdquo;
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-xl bg-cyan-500/20 px-4 py-2 text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30"
              >
                Edit Review
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface DetailsModalProps {
  request: ProjectRequest;
  onClose: () => void;
}

function DetailsModal({ request, onClose }: DetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div 
        className="glass-strong w-full max-w-md rounded-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Project Details</h3>
          <button 
            onClick={onClose} 
            className="text-zinc-500 transition-colors hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-zinc-500">Project Name</p>
            <p className="mt-1 text-sm font-semibold text-white">{request.project_name}</p>
          </div>

          {request.package_tier && (
            <div>
              <p className="text-xs text-zinc-500">Selected Package</p>
              <p className="mt-1 text-sm font-semibold text-cyan-400">{request.package_tier}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-zinc-500">Description</p>
            <p className="mt-1.5 text-xs text-zinc-300 whitespace-pre-wrap bg-white/2 rounded-xl p-4 border border-white/5 leading-relaxed">
              {request.description}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-500">Tech Stack</p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {request.tech_stack
                ? request.tech_stack.split(",").map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400"
                    >
                      {t.trim()}
                    </span>
                  ))
                : <span className="text-xs text-zinc-500">-</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
            <div>
              <p className="text-xs text-zinc-500">Submitted Date</p>
              <p className="mt-1 text-xs text-white">
                {formatDate(request.created_at)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Current Status</p>
              <p className="mt-1">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                  statusColors[request.status] || "bg-zinc-500/10 text-zinc-400"
                }`}>
                  {statusLabels[request.status] || request.status}
                </span>
              </p>
              {request.status === "rejected" && request.rejection_reason && (
                <div className="mt-2.5 rounded-xl bg-red-500/5 border border-red-500/10 p-3 text-[11px] text-red-400 text-left">
                  <span className="font-semibold block text-white mb-0.5">Rejection Note:</span>
                  &ldquo;{request.rejection_reason}&rdquo;
                </div>
              )}
              {request.payment_receipt_url && (
                <div className="mt-2 text-left">
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase">Downpayment Reference</p>
                  <p className="text-xs text-zinc-300 font-mono font-medium mt-0.5">{request.payment_reference_no}</p>
                </div>
              )}
              {request.final_payment_receipt_url && (
                <div className="mt-2 text-left">
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase">Final Balance Reference</p>
                  <p className="text-xs text-zinc-300 font-mono font-medium mt-0.5">{request.final_payment_reference_no}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-white/5 mt-6">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-5 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface ContractModalProps {
  request: ProjectRequest;
  onClose: () => void;
  onSuccess: (id: number, name: string, at: string) => void;
}

function ContractModal({ request, onClose, onSuccess }: ContractModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("You must agree to all terms and conditions.");
      return;
    }
    if (!signatureName.trim()) {
      setError("Please type your full name to sign the contract.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/project-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_signed: true,
          contract_signed_name: signatureName.trim(),
        }),
      });
      if (res.ok) {
        const nowStr = new Date().toISOString();
        onSuccess(request.id, signatureName.trim(), nowStr);
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to sign contract.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const printContract = () => {
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
            <p><strong>Client Name:</strong> Harry James</p>
            <p><strong>Project Package:</strong> ${request.package_tier || "Custom Design & Build"}</p>
            <p><strong>Baseline Budget / Price Range:</strong> ${request.project_baseline || "Custom Baseline Quote"}</p>
            <p><strong>Estimated Timeline:</strong> ${request.est_timeline || "Custom Estimate"}</p>
          </div>

          <h2>1. Key Deliverables & Scope</h2>
          <p>The Developer agrees to design, develop, and deploy the project deliverables according to the package parameters and standard specifications detailed below. Any revisions, features, or page additions requested beyond the designated boundaries will be treated as out-of-scope and billed at a mutual freelance rate of $50/hour.</p>
          <ul>
            ${deliverablesHtml}
          </ul>

          <h2>2. Payment Terms & Milestones</h2>
          <p><strong>A. Downpayment Commitment:</strong> A non-refundable deposit equal to fifty percent (50%) of the project price range baseline must be paid and receipt-verified by the Developer prior to work kickoff or timeline commencement.</p>
          <p><strong>B. Final Payment Balance:</strong> The remaining fifty percent (50%) balance of the project baseline budget becomes due immediately upon project completion and staging review, prior to release of the final build, codebase, or hosting deployment details.</p>

          <h2>3. Intellectual Property Transfer</h2>
          <p>Upon final receipt and clearance of all outstanding project balance amounts due, all title, copyrights, and intellectual property ownership rights to the custom source code, design assets, databases, and builds transfer exclusively to the Client. The Developer retains the right to display design screenshots and mockups in their professional portfolio and marketing materials.</p>

          <h2>4. Timelines & Revisions</h2>
          <p><strong>A. Estimated Timeline:</strong> Timelines are calculated from receipt of all initial assets and signed agreement. The Developer will exert reasonable efforts to meet the deadlines but is not liable for delay caused by client feedback lags, raw content delivery delays, or technical dependencies.</p>
          <p><strong>B. Revision Rounds:</strong> The package includes up to three (3) rounds of revisions. Extra feedback cycles will incur hourly design fees.</p>

          <h2>5. Warranties & Ongoing Maintenance</h2>
          <p>The Developer warrants the delivered project will function materially according to specifications. The Developer provides a free support warranty window according to the package tier (1-6 months post-delivery) to fix bugs and layout glitches. Ongoing server maintenance, domain fees, and third-party hosting costs are the sole responsibility of the Client.</p>

          <h2>6. Execution & Agreement to Terms</h2>
          <p>Both parties acknowledge their mutual understanding of the scope details, pricing brackets, and timelines defined herein. By executing their signatures below, the parties establish a binding commitment to these terms.</p>

          <div class="signatures">
            <div class="sig-box">
              <div class="font-sig">Dee Jay Cristobal</div>
              <p><strong>Developer Signature</strong></p>
              <p>DEE JAY PORTFOLIO DEV</p>
            </div>
            <div class="sig-box">
              <div class="font-sig">${signatureName || request.contract_signed_name || "(Pending Client Signature)"}</div>
              <p><strong>Client Signature</strong></p>
              <p>Harry James</p>
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 overflow-y-auto py-10">
      <div className="glass w-full max-w-2xl rounded-3xl p-8 relative max-h-[90vh] overflow-y-auto flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
        <div>
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Project Agreement Contract</h3>
              <p className="text-xs text-zinc-500 mt-0.5">{request.project_name}</p>
            </div>
            <button onClick={onClose} className="text-zinc-500 transition-colors hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4 text-xs text-zinc-300 bg-white/2 border border-white/5 rounded-2xl p-6 h-[300px] overflow-y-auto leading-relaxed text-left">
            <p className="font-bold text-white text-sm text-center uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Terms & Conditions of Service</p>
            <p>This Project Development Agreement outlines the terms, timeline, and scope of work established for the execution of <strong>{request.project_name}</strong>.</p>
            
            <div className="my-4 bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-1.5 font-medium">
              <p><span className="text-zinc-500 font-normal">Package Tier:</span> <span className="text-cyan-400">{request.package_tier || "Custom Request"}</span></p>
              <p><span className="text-zinc-500 font-normal">Baseline Quote:</span> <span className="text-cyan-400 font-semibold">{request.project_baseline || "Custom Baseline Quote"}</span></p>
              <p><span className="text-zinc-500 font-normal">Timeline:</span> <span className="text-cyan-400">{request.est_timeline || "Custom Estimate"}</span></p>
            </div>

            <p className="font-semibold text-white">1. Deliverables Scope & Modifications</p>
            <p>Work is limited to the items configured under this package. Any additional revisions or custom additions requested after this signature will be treated as out-of-scope and invoiced separately at $50/hour.</p>

            <p className="font-semibold text-white">2. Payment Milestones (Downpayment & Final)</p>
            <p><strong>A. 50% Downpayment:</strong> A non-refundable deposit equal to fifty percent (50%) of the baseline is required and receipt-verified before commencement of coding.</p>
            <p><strong>B. 50% Final Payment:</strong> The remaining balance becomes due upon project staging completion prior to final handover or codebase delivery.</p>

            <p className="font-semibold text-white">3. Intellectual Property Transfer</p>
            <p>Full intellectual property ownership rights are transferred to the Client immediately upon receiving and verifying the final payment balance due for the development services.</p>

            <p className="font-semibold text-white">4. Timelines & Feedbacks</p>
            <p>Timelines depend on client review response latency. The package includes up to three (3) rounds of revisions; additional cycles incur standard hourly fees.</p>

            <p className="font-semibold text-white">5. Warranty & Maintenance</p>
            <p>Includes free support post-delivery (1-6 months based on tier) to fix bugs. Ongoing hosting, domain fees, and third-party API configurations remain client responsibilities.</p>

            <p className="font-semibold text-white">6. Client Signature & Acceptance</p>
            <p>By typing your name and signing, you verify your approval of all terms, scopes, timelines, and payment structures detailed in this contract document.</p>
          </div>
        </div>

        <form onSubmit={handleSign} className="mt-6 space-y-4 border-t border-white/5 pt-6 text-left">
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              id="agree-checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={!!request.contract_signed}
              className="mt-0.5 h-4 w-4 rounded border-white/10 bg-zinc-950 text-cyan-500 focus:ring-cyan-500/20"
            />
            <label htmlFor="agree-checkbox" className="text-xs text-zinc-400 select-none cursor-pointer">
              I agree to all the terms, scope deliverables, and conditions outlined in this agreement contract.
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 items-end">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Client Full Name Signature</label>
              <input
                type="text"
                placeholder="Type your full name to sign"
                value={signatureName || request.contract_signed_name || ""}
                onChange={(e) => setSignatureName(e.target.value)}
                disabled={!!request.contract_signed}
                required
                className="glass w-full rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={printContract}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-white/20 hover:text-white flex-1 sm:flex-initial"
              >
                Print / PDF
              </button>
              {!request.contract_signed ? (
                <button
                  type="submit"
                  disabled={submitting || !agreed || !signatureName.trim()}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex-1 sm:flex-initial"
                >
                  {submitting ? "Signing..." : "Sign Contract"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="rounded-xl bg-green-500/10 border border-green-500/20 px-6 py-2.5 text-xs font-bold text-green-400 flex-1 sm:flex-initial"
                >
                  Contract Signed ✓
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClientProjectRequests() {
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReviewRequest, setActiveReviewRequest] = useState<ProjectRequest | null>(null);
  const [activeDetailsRequest, setActiveDetailsRequest] = useState<ProjectRequest | null>(null);
  const [activeContractRequest, setActiveContractRequest] = useState<ProjectRequest | null>(null);
  const [activeFinalPaymentRequest, setActiveFinalPaymentRequest] = useState<ProjectRequest | null>(null);

  useEffect(() => {
    fetch("/api/project-requests")
      .then((r) => r.json())
      .then((d) => { setRequests(d.requests); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="px-6 py-24">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="mt-8">
          <div className="glass rounded-2xl border border-white/5 p-5 space-y-4">
            <div className="flex gap-8 border-b border-white/5 pb-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-16 ml-auto" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-8">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-4 w-16 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-24">
      <div>
        <h1 className="text-2xl font-bold text-white">My Project Requests</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Track the status of your submitted project requests.
        </p>
      </div>

      <div className="mt-8">
        {requests.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 glass rounded-2xl">
            <p>You haven&apos;t submitted any project requests yet.</p>
            <p className="mt-1 text-xs text-zinc-600">
              Start a conversation with the developer and use the file icon to submit a request.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl glass border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
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
                      onClick={() => setActiveDetailsRequest(req)}
                    >
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
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusColors[req.status] || "bg-zinc-500/10 text-zinc-400"}`}>
                          {statusLabels[req.status] || req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex gap-3 justify-end items-center">
                        {req.status === "accepted" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveContractRequest(req);
                            }}
                            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all leading-none ${
                              req.contract_signed
                                ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.12)]"
                            }`}
                          >
                            {req.contract_signed ? "✍️ View Contract" : "✍️ Sign Contract"}
                          </button>
                        )}

                        {req.status === "completed" && (
                          req.final_payment_receipt_url ? (
                            <span className="text-[10px] text-zinc-500 italic">Receipt Pending Verification</span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFinalPaymentRequest(req);
                              }}
                              className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.12)] inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all leading-none"
                            >
                              💰 Complete Final Payment
                            </button>
                          )
                        )}

                        {req.status === "delivered" ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveReviewRequest(req);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            {req.rating ? "View Review" : "Write Review"}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDetailsRequest(req);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeReviewRequest && (
        <ReviewModal
          request={activeReviewRequest}
          onClose={() => setActiveReviewRequest(null)}
          onSuccess={(rating, content) => {
            setRequests((prev) =>
              prev.map((r) =>
                r.id === activeReviewRequest.id
                  ? { ...r, rating, review_content: content }
                  : r
              )
            );
            setActiveReviewRequest((prev) => prev ? { ...prev, rating, review_content: content } : null);
          }}
        />
      )}

      {activeDetailsRequest && (
        <DetailsModal
          request={activeDetailsRequest}
          onClose={() => setActiveDetailsRequest(null)}
        />
      )}

      {activeContractRequest && (
        <ContractModal
          request={activeContractRequest}
          onClose={() => setActiveContractRequest(null)}
          onSuccess={(id, name, at) => {
            setRequests((prev) =>
              prev.map((r) =>
                r.id === id
                  ? { ...r, contract_signed: true, contract_signed_name: name, contract_signed_at: at }
                  : r
              )
            );
          }}
        />
      )}

      {activeFinalPaymentRequest && (
        <FinalPaymentModal
          request={activeFinalPaymentRequest}
          onClose={() => setActiveFinalPaymentRequest(null)}
          onSuccess={(id, receiptUrl, refNo) => {
            setRequests((prev) =>
              prev.map((r) =>
                r.id === id
                  ? { ...r, final_payment_receipt_url: receiptUrl, final_payment_reference_no: refNo, final_receipt_verified: true }
                  : r
              )
            );
          }}
        />
      )}
    </div>
  );
}
