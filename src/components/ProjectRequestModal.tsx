"use client";

import { useEffect, useState } from "react";
import { X, Check, AlertCircle, CreditCard, Upload, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocalCurrency } from "@/hooks/useLocalCurrency";
import Image from "next/image";

interface Product {
  id: number;
  package_tier: string;
  project_baseline: string;
  est_timeline: string;
  deliverables: string;
}

interface BankMethod {
  id: number;
  provider_name: string;
  account_name: string;
  account_number: string;
  qr_code_url: string;
  is_active: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  conversationId?: number | null;
  inviteMsgId?: number | null;
  onSubmitted?: (msgId: number) => void;
}

function PaymentStep({
  projectRequestId,
  projectName,
  packageTier,
  projectBaseline,
  onComplete,
  onCancel,
}: {
  projectRequestId: number;
  projectName: string;
  packageTier?: string;
  projectBaseline?: string;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const { formatPrice, formatDownpayment, currency } = useLocalCurrency();
  const [banks, setBanks] = useState<BankMethod[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [referenceNo, setReferenceNo] = useState("");
  const [banksLoading, setBanksLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

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

      const res = await fetch(`/api/project-requests/${projectRequestId}`, {
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
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const selectedBank = banks.find((b) => b.id === selectedBankId);

  if (success) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
          <Check className="h-8 w-8 text-green-400" />
        </div>
        <p className="text-lg text-green-400 font-semibold">Payment Submitted!</p>
        <p className="mt-1 text-sm text-zinc-400">Your downpayment receipt has been uploaded. The admin will verify it shortly.</p>
        <button
          onClick={onComplete}
          className="mt-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-xl border border-white/5 bg-zinc-950/40 p-3 text-xs text-zinc-300">
        <p className="font-semibold text-white">{projectName}</p>
        {packageTier && (
          <p className="mt-1 text-cyan-400">{packageTier} — {formatPrice(projectBaseline || "")}</p>
        )}
        {projectBaseline && (
          <p className="text-yellow-400 font-semibold mt-0.5">Downpayment (50%): {formatDownpayment(projectBaseline) || formatPrice(projectBaseline)}</p>
        )}
      </div>

      {/* Bank Selection */}
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
              <label
                key={bank.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                  selectedBankId === bank.id
                    ? "border-cyan-500/50 bg-cyan-500/10"
                    : "border-white/5 bg-zinc-950 hover:border-white/10"
                }`}
              >
                <input
                  type="radio"
                  name="bank"
                  value={bank.id}
                  checked={selectedBankId === bank.id}
                  onChange={() => setSelectedBankId(bank.id)}
                  className="h-4 w-4 text-cyan-500 shrink-0"
                />
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

      {/* Selected Bank Details */}
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

      {/* Receipt Upload */}
      <div className="rounded-xl border border-white/5 bg-zinc-950/40 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
          <Upload className="h-3.5 w-3.5 text-cyan-400" />
          Upload Payment Receipt
        </p>
        <div>
          <label className="mb-1 block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Receipt Screenshot</label>
          <input
            type="file"
            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            accept="image/*"
            className="glass w-full rounded-xl px-4 py-2.5 text-xs text-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30"
          />
        </div>
        {receiptFile && <p className="text-[10px] text-green-400">Selected: {receiptFile.name}</p>}
        <div>
          <label className="mb-1 block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Transaction Reference No.</label>
          <input
            type="text"
            placeholder="e.g. 1234567890 or REF-ABC-123"
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
            required
            className="glass w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 bg-zinc-950"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-white/5">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white">
          Cancel
        </button>
        <button type="submit" disabled={submitting || !receiptFile || !referenceNo.trim() || !selectedBankId} className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {submitting ? "Submitting..." : <><Upload className="h-4 w-4" /> Submit Payment Receipt</>}
        </button>
      </div>
    </form>
  );
}

export default function ProjectRequestModal({ open, onClose, conversationId, inviteMsgId, onSubmitted }: Props) {
  const router = useRouter();
  const { formatPrice, formatDownpayment, loaded, currency } = useLocalCurrency();
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [projectForm, setProjectForm] = useState({ project_name: "", description: "", tech_stack: "", product_id: "" as string | number });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [step, setStep] = useState<"form" | "payment">("form");
  const [createdRequestId, setCreatedRequestId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("form");
    setCreatedRequestId(null);
    setErrorMsg("");
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d?.user ?? null));
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => { if (d.products) setAvailableProducts(d.products); })
      .catch(() => {});
  }, [open]);

  const getDownpaymentAmount = (baseline: string) => formatDownpayment(baseline);
  const selectedProduct = availableProducts.find((p) => p.id === projectForm.product_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.project_name.trim() || !projectForm.description.trim()) return;
    if (!user) {
      const pending = JSON.stringify({ productName: projectForm.project_name, productId: projectForm.product_id });
      localStorage.setItem("pending_package_request", pending);
      router.push("/login");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");

    try {
      const createRes = await fetch("/api/project-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...projectForm,
          conversation_id: conversationId || undefined,
        }),
      });
      if (!createRes.ok) {
        const data = await createRes.json();
        setErrorMsg(data.error || "Failed to create request");
        setSubmitting(false);
        return;
      }

      const data = await createRes.json();
      setCreatedRequestId(data.id);
      if (inviteMsgId && onSubmitted) onSubmitted(inviteMsgId);
      setStep("payment");
      setSubmitting(false);
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="glass-strong w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            {step === "form" ? "New Project Request" : "Complete Your Payment"}
          </h3>
          <div className="flex items-center gap-2">
            {step === "payment" && (
              <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-400">{currency}</span>
            )}
            <button onClick={onClose} className="text-zinc-500 transition-colors hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {step === "form" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 flex items-start gap-2 text-left">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <select
              value={projectForm.product_id || ""}
              onChange={(e) => {
                const val = e.target.value;
                setProjectForm({ ...projectForm, product_id: val ? Number(val) : "" });
              }}
              className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 bg-zinc-950 text-left"
            >
              <option value="" className="text-zinc-500">Select Package Tier (optional)</option>
              {availableProducts.map((p) => {
                const dp = getDownpaymentAmount(p.project_baseline);
                return (
                  <option key={p.id} value={p.id} className="text-white bg-zinc-950">
                    {p.package_tier} ({formatPrice(p.project_baseline)}) {dp ? `— 50% DP: ${dp}` : ""}
                  </option>
                );
              })}
            </select>
            {selectedProduct && getDownpaymentAmount(selectedProduct.project_baseline) && (
              <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3 text-xs text-yellow-400 text-left">
                <span className="font-semibold">Downpayment Required:</span> 50% of package price — <span className="font-bold text-white">{getDownpaymentAmount(selectedProduct.project_baseline)}</span>
              </div>
            )}

            <input
              type="text"
              placeholder="Project Name"
              value={projectForm.project_name}
              onChange={(e) => setProjectForm({ ...projectForm, project_name: e.target.value })}
              required
              className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 bg-zinc-950 text-left"
            />

            <textarea
              rows={3}
              placeholder="Project Description"
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              required
              className="glass w-full resize-none rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 bg-zinc-950 text-left"
            />

            <input
              type="text"
              placeholder="Preferred Tech Stack (optional)"
              value={projectForm.tech_stack}
              onChange={(e) => setProjectForm({ ...projectForm, tech_stack: e.target.value })}
              className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 bg-zinc-950 text-left"
            />

            <div className="flex gap-3 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => { onClose(); setErrorMsg(""); }}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !projectForm.project_name.trim() || !projectForm.description.trim()}
                className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? "Processing..." : <><CreditCard className="h-4 w-4" /> Proceed to Payment</>}
              </button>
            </div>
          </form>
        ) : createdRequestId ? (
          <PaymentStep
            projectRequestId={createdRequestId}
            projectName={projectForm.project_name}
            packageTier={selectedProduct?.package_tier}
            projectBaseline={selectedProduct?.project_baseline}
            onComplete={onClose}
            onCancel={onClose}
          />
        ) : null}
      </div>
    </div>
  );
}
