"use client";

import { Fragment, useEffect, useState } from "react";
import { Star, X, Upload, AlertCircle, Check, CreditCard, Clock, Building2 } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import SignaturePad from "@/components/SignaturePad";
import Image from "next/image";
import { useWebSettings } from "@/hooks/useWebSettings";
import { useLocalCurrency } from "@/hooks/useLocalCurrency";

interface ProjectRequest {
  id: number;
  project_name: string;
  description: string;
  tech_stack: string;
  status: string;
  created_at: string;
  rating?: number | null;
  review_content?: string | null;
  client_name?: string;
  client_email?: string;
  package_tier?: string;
  project_baseline?: string;
  est_timeline?: string;
  deliverables?: string;
  contract_signed?: boolean;
  contract_signed_name?: string | null;
  contract_signed_at?: string | null;
  contract_signature_url?: string | null;
  rejection_reason?: string | null;
  payment_receipt_url?: string | null;
  payment_reference_no?: string | null;
  final_payment_receipt_url?: string | null;
  final_payment_reference_no?: string | null;
  payment_rejection_reason?: string | null;
}

interface BankMethod {
  id: number;
  provider_name: string;
  account_name: string;
  account_number: string;
  qr_code_url: string;
  is_active: boolean;
}

const statusColors: Record<string, string> = {
  pending_payment: "bg-purple-500/10 text-purple-400",
  pending: "bg-yellow-500/10 text-yellow-400",
  accepted: "bg-green-500/10 text-green-400",
  rejected: "bg-red-500/10 text-red-400",
  in_progress: "bg-blue-500/10 text-blue-400",
  testing: "bg-purple-500/10 text-purple-400",
  completed: "bg-cyan-500/10 text-cyan-400",
  delivered: "bg-emerald-500/10 text-emerald-400",
};

const statusLabels: Record<string, string> = {
  pending_payment: "Awaiting Payment",
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

interface DownpaymentModalProps {
  request: ProjectRequest;
  onClose: () => void;
  onSuccess: (id: number, receiptUrl: string, refNo: string) => void;
}

function DownpaymentModal({ request, onClose, onSuccess }: DownpaymentModalProps) {
  const [banks, setBanks] = useState<BankMethod[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [referenceNo, setReferenceNo] = useState("");
  const [banksLoading, setBanksLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { formatPrice, formatDownpayment } = useLocalCurrency();

  useEffect(() => {
    fetch("/api/payment-methods")
      .then((r) => r.json())
      .then((d) => {
        const active = (d.methods || []).filter((m: BankMethod) => m.is_active);
        setBanks(active);
        setBanksLoading(false);
      })
      .catch(() => { setError("Failed to load payment methods."); setBanksLoading(false); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) { setError("Please upload your payment receipt screenshot."); return; }
    if (!referenceNo.trim()) { setError("Please enter the transaction reference number."); return; }
    if (!selectedBankId) { setError("Please select a bank or payment method."); return; }

    setSubmitting(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", receiptFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) {
        setError("Failed to upload receipt. Make sure it's under 4.5MB.");
        setSubmitting(false);
        return;
      }
      const { url } = await uploadRes.json();

      const res = await fetch(`/api/project-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_receipt_url: url,
          payment_reference_no: referenceNo.trim(),
          payment_method_id: selectedBankId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit payment.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      onSuccess(request.id, url, referenceNo.trim());
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const selectedBank = banks.find((b) => b.id === selectedBankId);

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
        <div className="glass-strong w-full max-w-md rounded-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <Check className="h-8 w-8 text-green-400" />
          </div>
          <p className="text-lg text-green-400 font-semibold">Payment Submitted!</p>
          <p className="mt-1 text-sm text-zinc-400">Your downpayment receipt has been uploaded. The admin will verify it shortly.</p>
          <button onClick={onClose} className="mt-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="glass-strong w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-cyan-400" />
            Complete Payment
          </h3>
          <button onClick={onClose} className="text-zinc-500 transition-colors hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-xl border border-white/5 bg-zinc-950/40 p-3 text-xs text-zinc-300">
            <p className="font-semibold text-white">{request.project_name}</p>
            {request.package_tier && (
              <p className="mt-1 text-cyan-400">{request.package_tier} — {formatPrice(request.project_baseline || "")}</p>
            )}
            {request.project_baseline && (
              <p className="text-yellow-400 font-semibold mt-0.5">Downpayment (50%): {formatDownpayment(request.project_baseline) || formatPrice(request.project_baseline)}</p>
            )}
          </div>

          <div className="rounded-xl border border-white/5 bg-zinc-950/40 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-cyan-400" />
              Select Payment Method
            </p>
            {banksLoading ? (
              <p className="text-xs text-zinc-500">Loading payment methods...</p>
            ) : banks.length === 0 ? (
              <p className="text-xs text-zinc-500">No payment methods available yet. Please contact the developer.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {banks.map((bank) => (
                  <label key={bank.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${selectedBankId === bank.id ? "border-cyan-500/50 bg-cyan-500/10" : "border-white/5 bg-zinc-950 hover:border-white/10"}`}>
                    <input type="radio" name="bank" value={bank.id} checked={selectedBankId === bank.id} onChange={() => setSelectedBankId(bank.id)} className="h-4 w-4 text-cyan-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{bank.provider_name}</p>
                      <p className="text-xs text-zinc-400 truncate">{bank.account_name}</p>
                      <p className="text-xs font-mono text-zinc-500">{bank.account_number}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {selectedBank && (
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-center">
              <CreditCard className="mx-auto mb-2 h-6 w-6 text-cyan-400" />
              <p className="text-sm font-bold text-white">{selectedBank.provider_name}</p>
              <p className="text-xs text-zinc-400">Account: <span className="font-semibold text-white">{selectedBank.account_name}</span></p>
              <p className="text-xs text-zinc-400">Number: <span className="font-mono font-bold text-cyan-400">{selectedBank.account_number}</span></p>
              {selectedBank.qr_code_url && (
                <div className="mt-3 inline-block rounded-xl border border-white/5 bg-white p-1.5">
                  <Image src={selectedBank.qr_code_url} alt="QR" width={120} height={120} className="rounded-lg" />
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-white/5 bg-zinc-950/40 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5 text-cyan-400" />
              Upload Payment Receipt
            </p>
            <div>
              <label className="mb-1 block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Receipt Screenshot</label>
              <input type="file" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} accept="image/*" className="glass w-full rounded-xl px-4 py-2.5 text-xs text-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30" />
            </div>
            {receiptFile && <p className="text-[10px] text-green-400">Selected: {receiptFile.name}</p>}
            <div>
              <label className="mb-1 block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Transaction Reference No.</label>
              <input type="text" placeholder="e.g. 1234567890 or REF-ABC-123" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} required className="glass w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 bg-zinc-950" />
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-white/5">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={submitting || !receiptFile || !referenceNo.trim() || !selectedBankId} className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {submitting ? "Submitting..." : <><Upload className="h-4 w-4" /> Submit Payment Receipt</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FinalPaymentModalProps {
  request: ProjectRequest;
  onClose: () => void;
  onSuccess: (id: number, receiptUrl: string, refNo: string) => void;
}

function FinalPaymentModal({ request, onClose, onSuccess }: FinalPaymentModalProps) {
  const [banks, setBanks] = useState<BankMethod[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [referenceNo, setReferenceNo] = useState("");
  const [banksLoading, setBanksLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { formatPrice } = useLocalCurrency();

  useEffect(() => {
    fetch("/api/payment-methods")
      .then((r) => r.json())
      .then((d) => {
        const active = (d.methods || []).filter((m: BankMethod) => m.is_active);
        setBanks(active);
        setBanksLoading(false);
      })
      .catch(() => { setError("Failed to load payment methods."); setBanksLoading(false); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) { setError("Please upload your payment receipt screenshot."); return; }
    if (!referenceNo.trim()) { setError("Please enter the transaction reference number."); return; }
    if (!selectedBankId) { setError("Please select a bank or payment method."); return; }

    setSubmitting(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", receiptFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) {
        setError("Failed to upload receipt. Make sure it's under 4.5MB.");
        setSubmitting(false);
        return;
      }
      const { url } = await uploadRes.json();

      const res = await fetch(`/api/project-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          final_payment_receipt_url: url,
          final_payment_reference_no: referenceNo.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit payment.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      onSuccess(request.id, url, referenceNo.trim());
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const selectedBank = banks.find((b) => b.id === selectedBankId);

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
        <div className="glass-strong w-full max-w-md rounded-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <Check className="h-8 w-8 text-green-400" />
          </div>
          <p className="text-lg text-green-400 font-semibold">Final Payment Submitted!</p>
          <p className="mt-1 text-sm text-zinc-400">Your final balance receipt has been uploaded. The admin will verify it shortly.</p>
          <button onClick={onClose} className="mt-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 overflow-y-auto py-10">
      <div className="glass w-full max-w-xl rounded-3xl p-8 relative max-h-[90vh] overflow-y-auto text-left" onClick={(e) => e.stopPropagation()}>
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
          Your project build is completed and staging is ready! Please settle the remaining 50% balance payment to unlock code handover delivery.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-white/5 bg-zinc-950/40 p-3 text-xs text-zinc-300">
            <p className="font-semibold text-white">{request.project_name}</p>
            {request.package_tier && (
              <p className="mt-1 text-cyan-400">{request.package_tier} — {formatPrice(request.project_baseline || "")}</p>
            )}
            {request.project_baseline && (
              <p className="text-yellow-400 font-semibold mt-0.5">Final Balance (50%): {formatPrice(request.project_baseline)}</p>
            )}
          </div>

          <div className="rounded-xl border border-white/5 bg-zinc-950/40 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-cyan-400" />
              Select Payment Method
            </p>
            {banksLoading ? (
              <p className="text-xs text-zinc-500">Loading payment methods...</p>
            ) : banks.length === 0 ? (
              <p className="text-xs text-zinc-500">No payment methods available yet. Please contact the developer.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {banks.map((bank) => (
                  <label key={bank.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${selectedBankId === bank.id ? "border-cyan-500/50 bg-cyan-500/10" : "border-white/5 bg-zinc-950 hover:border-white/10"}`}>
                    <input type="radio" name="finalBank" value={bank.id} checked={selectedBankId === bank.id} onChange={() => setSelectedBankId(bank.id)} className="h-4 w-4 text-cyan-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{bank.provider_name}</p>
                      <p className="text-xs text-zinc-400 truncate">{bank.account_name}</p>
                      <p className="text-xs font-mono text-zinc-500">{bank.account_number}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {selectedBank && (
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-center">
              <CreditCard className="mx-auto mb-2 h-6 w-6 text-cyan-400" />
              <p className="text-sm font-bold text-white">{selectedBank.provider_name}</p>
              <p className="text-xs text-zinc-400">Account: <span className="font-semibold text-white">{selectedBank.account_name}</span></p>
              <p className="text-xs text-zinc-400">Number: <span className="font-mono font-bold text-cyan-400">{selectedBank.account_number}</span></p>
              {selectedBank.qr_code_url && (
                <div className="mt-3 inline-block rounded-xl border border-white/5 bg-white p-1.5">
                  <Image src={selectedBank.qr_code_url} alt="QR" width={120} height={120} className="rounded-lg" />
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-white/5 bg-zinc-950/40 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5 text-cyan-400" />
              Upload Payment Receipt
            </p>
            <div>
              <label className="mb-1 block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Receipt Screenshot</label>
              <input type="file" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} accept="image/*" className="glass w-full rounded-xl px-4 py-2.5 text-xs text-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30" />
            </div>
            {receiptFile && <p className="text-[10px] text-green-400">Selected: {receiptFile.name}</p>}
            <div>
              <label className="mb-1 block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Transaction Reference No.</label>
              <input type="text" placeholder="e.g. 1234567890 or REF-ABC-123" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} required className="glass w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 bg-zinc-950" />
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-white/5">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={submitting || !receiptFile || !referenceNo.trim() || !selectedBankId} className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {submitting ? "Submitting..." : <><Upload className="h-4 w-4" /> Submit Final Payment Receipt</>}
            </button>
          </div>
        </form>
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
  const { formatPrice } = useLocalCurrency();
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
              {request.project_baseline && (
                <p className="mt-0.5 text-xs text-zinc-400">{formatPrice(request.project_baseline)}</p>
              )}
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
                  {request.payment_rejection_reason && (
                    <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-[10px]">
                      <p className="font-semibold text-white">⚠️ Refund Notice</p>
                      <p className="mt-0.5">Your downpayment has been rejected. A <strong className="text-white">refund will be processed</strong>. Please contact the developer for details.</p>
                    </div>
                  )}
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
  onSuccess: (id: number, name: string, at: string, signatureUrl?: string) => void;
}

function ContractModal({ request, onClose, onSuccess }: ContractModalProps) {
  const { settings } = useWebSettings();
  const [agreed, setAgreed] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [adminSignatureUrl, setAdminSignatureUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.user?.admin_signature_url) setAdminSignatureUrl(d.user.admin_signature_url);
      })
      .catch(() => {});
  }, []);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("You must agree to all terms and conditions.");
      return;
    }
    if (!signatureDataUrl) {
      setError("Please draw your signature above.");
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
          contract_signed_name: "signed",
          contract_signature_url: signatureDataUrl,
        }),
      });
      if (res.ok) {
        const nowStr = new Date().toISOString();
        onSuccess(request.id, "signed", nowStr, signatureDataUrl);
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
    const brandName = settings.web_name || "Dee Jay.";
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

    const fontFace = settings.logo_font_file
      ? `@font-face { font-family: 'UploadedCustomFont'; src: url('${settings.logo_font_file}'); }`
      : "";
    const logoHtml = settings.logo_type === "image" && settings.logo_image
      ? `<img src="${settings.logo_image}" alt="${brandName}" style="height:28px;max-width:200px;object-fit:contain;display:inline-block;vertical-align:middle" />`
      : `<span style="font-family:${settings.logo_font_file ? 'UploadedCustomFont' : settings.logo_font};color:${settings.logo_color || '#111'};font-weight:bold;font-size:15px">${brandName}</span>`;

    const devSigHtml = adminSignatureUrl
      ? `<img src="${adminSignatureUrl}" style="max-height:45px;max-width:140px;object-fit:contain;" />`
      : "Dee Jay Cristobal";
    const clientSigHtml = request.contract_signed && request.contract_signature_url
      ? `<img src="${request.contract_signature_url}" style="max-height:45px;max-width:140px;object-fit:contain;" />`
      : (request.contract_signed ? (request.contract_signed_name || "Signed") : "");

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Agreement Contract - ${request.project_name}</title>
  <style>
    ${fontFace}
    body { font-family: 'Georgia', serif; padding: 60px 50px; color: #111; line-height: 1.6; max-width: 800px; margin: 0 auto; background: #fff; }
    .logo-header { font-size: 11px; font-style: italic; color: #666; margin-bottom: 30px; text-align: center; }
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
    .sig-underline { border-bottom: 1.5px solid #111; margin-bottom: 8px; min-height: 50px; display: flex; align-items: center; justify-content: center; padding: 4px; }
    .sig-label-title { font-weight: bold; font-size: 12px; }
    .sig-sub-label { font-size: 11px; color: #555; margin-top: 2px; }
    .actions-bar { margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
    @media print { .actions-bar { display: none; } body { padding: 30px 10px; } }
  </style>
</head>
<body>
  <div class="logo-header">${logoHtml}</div>

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

  <p class="resolving-clause"><span class="bold">NOW, THEREFORE</span>, upon the mutual understanding, consent, and execution of the terms detailed herein,</p>
  <p class="resolving-clause"><span class="bold">BE IT RESOLVED, AS IT IS HEREBY RESOLVED</span>, that the Developer shall execute and deliver the following Key Deliverables &amp; Included Features:</p>

  <ol class="deliverables-list">${deliverablesHtml}</ol>

  <p class="resolving-clause"><span class="bold">RESOLVED FURTHER</span>, that upon receipt of the full payment balance due for the development services, all title, copyrights, and intellectual property ownership rights to the final code, assets, and builds shall transfer exclusively to the Client.</p>

  <div class="approved-statement">APPROVED on this ${approvalDateFormatted}.</div>

  <div class="signatures-row">
    <div class="sig-line-container">
      <div class="sig-underline">${devSigHtml}</div>
      <div class="sig-label-title">Dee Jay Cristobal</div>
      <div class="sig-sub-label">Developer Signature</div>
    </div>
    <div class="sig-line-container">
      <div class="sig-underline">${clientSigHtml}</div>
      <div class="sig-label-title">${request.contract_signed ? (request.contract_signed_name || "Client") : "(Unsigned)"}</div>
      <div class="sig-sub-label">Client Signature</div>
    </div>
  </div>

  <div class="actions-bar">
    <button onclick="window.print()" style="padding:12px 24px;font-weight:bold;background:#111;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px">Print Contract / Save PDF</button>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (w) {
      w.onload = () => URL.revokeObjectURL(url);
    }
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

          <div className="space-y-4 text-[13px] text-zinc-300 bg-white/2 border border-white/5 rounded-2xl p-6 h-[340px] overflow-y-auto leading-relaxed text-left font-serif">
            <div className="text-[10px] italic text-zinc-500 text-center mb-4">
              {settings.logo_type === "image" && settings.logo_image ? (
                <img src={settings.logo_image} alt={settings.web_name || "Dee Jay."} className="h-7 max-w-[180px] object-contain inline-block" />
              ) : (
                <span style={{ fontFamily: settings.logo_font_file ? 'UploadedCustomFont' : settings.logo_font, color: settings.logo_color || '#fff' }} className="font-bold text-xs">{settings.web_name || "Dee Jay."}</span>
              )}
            </div>
            
            <p className="font-bold text-white text-base text-center uppercase tracking-wider mb-1">Project Development Agreement</p>
            <p className="text-zinc-400 text-[11px] font-bold text-center mb-4 uppercase">Series of {request.created_at ? new Date(request.created_at).getFullYear() : 2026}</p>
            
            <div className="font-bold text-zinc-200 text-xs text-justify border-y border-white/10 py-3 uppercase tracking-wide my-4 leading-normal">
              A TERMS AUTHORIZING THE COMMENCEMENT AND EXECUTION OF THE PROJECT DEVELOPMENT AGREEMENT FOR THE APPLICATION "{request.project_name.toUpperCase()}" BETWEEN THE CLIENT, MR/MS. {request.client_name?.toUpperCase() || "CLIENT"}, AND THE DEVELOPER, MR. DEE JAY CRISTOBAL, OUTLINING THE SCOPE, DELIVERABLES, AND FINANCES UNDER THE {request.package_tier?.toUpperCase() || "STANDARD PACK"} ARRANGEMENT.
            </div>

            <p><span className="font-bold text-white">WHEREAS</span>, the Client, {request.client_name || "Client Name"}, requires high-level professional technical software development services for the implementation and execution of the digital project specified as "{request.project_name}";</p>
            
            <p><span className="font-bold text-white">WHEREAS</span>, the Developer, Dee Jay Cristobal, possesses the requisite full-stack engineering expertise to deliver the comprehensive technical scope required by the Client;</p>
            
            <p><span className="font-bold text-white">WHEREAS</span>, both parties have mutually established and finalized the key technical parameters, project specifications, and milestones required for a successful launch;</p>
            
            <p><span className="font-bold text-white">WHEREAS</span>, the parameters, finances, and execution terms agreed upon under the "{request.package_tier || "Standard Pack"}" are designated as follows:</p>
            
            <ul className="list-disc list-inside pl-4 space-y-1 my-3 text-zinc-400">
              <li><strong>Project Specification:</strong> {request.project_name}</li>
              <li><strong>Project Package:</strong> {request.package_tier || "Custom Services"}</li>
              <li><strong>Baseline Budget / Price Range:</strong> {request.project_baseline || "Custom baseline"}</li>
              <li><strong>Estimated Timeline:</strong> {request.est_timeline || "3 – 5 Weeks"}</li>
            </ul>

            <p className="font-bold text-white">NOW, THEREFORE, upon the mutual understanding, consent, and execution of the terms detailed herein,</p>
            
            <p className="font-bold text-white">BE IT RESOLVED, AS IT IS HEREBY RESOLVED, that the Developer shall execute and deliver the following Key Deliverables & Included Features:</p>

            <ol className="list-decimal list-inside pl-4 space-y-2 my-3 text-zinc-300">
              {request.deliverables
                ? request.deliverables.split("\n").map((d: string, index: number) => (
                    <li key={index}>{d.replace(/^-\s*/, "").trim()}</li>
                  ))
                : <li>Custom project specification deliverables</li>
              }
            </ol>

            <p className="font-bold text-white">RESOLVED FURTHER, that upon receipt of the full payment balance due for the development services, all title, copyrights, and intellectual property ownership rights to the final code, assets, and builds shall transfer exclusively to the Client.</p>
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

          <SignaturePad
            onSave={setSignatureDataUrl}
            defaultImage={request.contract_signature_url}
            label={request.contract_signed ? "Signed" : "Draw your signature to sign the contract"}
            readOnly={!!request.contract_signed}
          />

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
                disabled={submitting || !agreed || !signatureDataUrl}
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
  const [activeDownpaymentRequest, setActiveDownpaymentRequest] = useState<ProjectRequest | null>(null);

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
                      <td className="px-6 py-4 text-right flex gap-3 justify-end items-center flex-wrap">

                        {req.status === "pending" && !req.payment_receipt_url && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDownpaymentRequest(req);
                            }}
                            className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.12)] inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all leading-none"
                          >
                            💰 Complete Payment
                          </button>
                        )}

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
                            <span className="text-[10px] text-zinc-500 italic">Payment Pending Verification</span>
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
          onSuccess={(id, name, at, signatureUrl) => {
            setRequests((prev) =>
              prev.map((r) =>
                r.id === id
                  ? { ...r, contract_signed: true, contract_signed_name: name, contract_signed_at: at, contract_signature_url: signatureUrl }
                  : r
              )
            );
          }}
        />
      )}

      {activeDownpaymentRequest && (
        <DownpaymentModal
          request={activeDownpaymentRequest}
          onClose={() => setActiveDownpaymentRequest(null)}
          onSuccess={(id, receiptUrl, refNo) => {
            setRequests((prev) =>
              prev.map((r) =>
                r.id === id
                  ? { ...r, payment_receipt_url: receiptUrl, payment_reference_no: refNo }
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
