"use client";

import { useEffect, useState } from "react";
import { X, Upload, Check, AlertCircle, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

interface Product {
  id: number;
  package_tier: string;
  project_baseline: string;
  est_timeline: string;
  deliverables: string;
}

interface PaymentMethod {
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
}

export default function ProjectRequestModal({ open, onClose }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [rate, setRate] = useState(1);
  const [projectForm, setProjectForm] = useState({ project_name: "", description: "", tech_stack: "", product_id: "" as string | number });
  const [submittingProject, setSubmittingProject] = useState(false);
  const [projectSubmitted, setProjectSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState("");
  const [paymentReferenceNo, setPaymentReferenceNo] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptValidated, setReceiptValidated] = useState(false);
  const [showQRId, setShowQRId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d?.user ?? null));
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => { if (d.products) setAvailableProducts(d.products); })
      .catch(() => {});
    fetch("/api/payment-methods")
      .then((r) => r.json())
      .then((d) => setPaymentMethods(d.methods?.filter((m: any) => m.is_active) || []))
      .catch(() => {});
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        const cur = data.currency || "USD";
        setCurrency(cur);
        fetch("https://open.er-api.com/v6/latest/USD")
          .then((r) => r.json())
          .then((ratesData) => {
            if (ratesData.rates && ratesData.rates[cur]) setRate(ratesData.rates[cur]);
          });
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!paymentReceiptUrl && !paymentReferenceNo.trim()) {
      setReceiptValidated(false);
      setErrorMsg("");
      return;
    }
    if (!paymentReceiptUrl) {
      setReceiptValidated(false);
      setErrorMsg("A downpayment receipt screenshot is required to submit a project request.");
      return;
    }
    if (!paymentReferenceNo.trim()) {
      setReceiptValidated(false);
      setErrorMsg("A transaction reference number is required to submit a project request.");
      return;
    }
    const invalidKeywords = ["fake", "dummy", "test", "mock", "sample", "fabricated", "screenshot_123", "placeholder"];
    const fileLower = paymentReceiptUrl.toLowerCase();
    const refLower = paymentReferenceNo.toLowerCase();
    const containsFakeKeyword = invalidKeywords.some((kw) => fileLower.includes(kw) || refLower.includes(kw));
    const refClean = paymentReferenceNo.trim();
    const isValidRefFormat = /^[a-zA-Z0-9-]{8,24}$/.test(refClean);
    if (containsFakeKeyword) {
      setReceiptValidated(false);
      setErrorMsg("Receipt verification error: automated payment scanner flagged this receipt file or transaction reference word as fabricated.");
    } else if (!isValidRefFormat) {
      setReceiptValidated(false);
      setErrorMsg("Receipt verification error: transaction reference number must be alphanumeric and between 8 to 24 characters.");
    } else {
      setReceiptValidated(true);
      setErrorMsg("");
    }
  }, [paymentReceiptUrl, paymentReferenceNo]);

  const formatPrice = (baseline: string) => {
    if (currency === "USD" || rate === 1) return baseline;
    const numbers = baseline.replace(/,/g, "").match(/\d+/g);
    if (!numbers || numbers.length === 0) return baseline;
    const convertedNumbers = numbers.map((n) => {
      const num = Number(n);
      const converted = Math.round(num * rate);
      return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(converted);
    });
    if (convertedNumbers.length === 2) return `${convertedNumbers[0]} – ${convertedNumbers[1]}${baseline.includes("+") ? "+" : ""}`;
    if (convertedNumbers.length === 1) return `${convertedNumbers[0]}${baseline.includes("+") ? "+" : ""}`;
    return baseline;
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    setErrorMsg("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setPaymentReceiptUrl(data.url);
      } else {
        setErrorMsg("Failed to upload screenshot. Make sure file size is under 4.5MB.");
      }
    } catch {
      setErrorMsg("An error occurred during file upload.");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const submitProjectRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.project_name.trim() || !projectForm.description.trim()) return;
    if (!paymentReceiptUrl || !paymentReferenceNo.trim()) {
      setErrorMsg("Please upload your 50% downpayment receipt and enter reference number.");
      return;
    }
    if (!user) {
      const pending = JSON.stringify({ productName: projectForm.project_name, productId: projectForm.product_id });
      localStorage.setItem("pending_package_request", pending);
      router.push("/login");
      return;
    }
    setSubmittingProject(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/project-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...projectForm,
          payment_receipt_url: paymentReceiptUrl,
          payment_reference_no: paymentReferenceNo.trim(),
        }),
      });
      if (res.ok) {
        setProjectSubmitted(true);
        setProjectForm({ project_name: "", description: "", tech_stack: "", product_id: "" });
        setPaymentReceiptUrl("");
        setPaymentReferenceNo("");
        setTimeout(() => { onClose(); setProjectSubmitted(false); }, 2000);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Fake receipt flagged or invalid reference code. Please verify.");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setSubmittingProject(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="glass-strong w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">New Project Request</h3>
          <button onClick={onClose} className="text-zinc-500 transition-colors hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {projectSubmitted ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <Check className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-lg text-green-400 font-semibold">Project Request Submitted!</p>
            <p className="mt-1 text-sm text-zinc-500">The admin will review it shortly.</p>
          </div>
        ) : (
          <form onSubmit={submitProjectRequest} className="space-y-4">
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
                const prod = availableProducts.find(p => p.id === Number(val));
                setProjectForm({
                  ...projectForm,
                  product_id: val ? Number(val) : "",
                  project_name: prod ? `Request for ${prod.package_tier}` : projectForm.project_name,
                });
              }}
              className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 bg-zinc-950 text-left"
            >
              <option value="" className="text-zinc-500">Select Package Tier (optional)</option>
              {availableProducts.map((p) => (
                <option key={p.id} value={p.id} className="text-white bg-zinc-950">
                  {p.package_tier} ({formatPrice(p.project_baseline)})
                </option>
              ))}
            </select>

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

            {/* Payment Details */}
            <div className="rounded-xl border border-white/5 bg-zinc-950 p-4 text-xs text-zinc-400 space-y-3 text-left">
              <p className="font-bold text-white uppercase text-[10px] tracking-wider flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5 text-cyan-400" />
                🔑 Settle 50% Downpayment
              </p>
              <p>A 50% downpayment is required before request submission. Please transfer to any developer account below:</p>
              {paymentMethods.length === 0 ? (
                <p className="italic text-zinc-600">No payment accounts configured yet.</p>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((m) => (
                    <div key={m.id} className="border-t border-white/5 pt-2 space-y-1">
                      <p className="font-semibold text-zinc-300">{m.provider_name}</p>
                      <p className="text-white font-mono">{m.account_number} ({m.account_name})</p>
                      {m.qr_code_url && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setShowQRId(showQRId === m.id ? null : m.id)}
                            className="text-cyan-400 hover:underline text-[10px]"
                          >
                            {showQRId === m.id ? "Hide QR" : "Show QR Code ↗"}
                          </button>
                          {showQRId === m.id && (
                            <div className="relative h-40 w-40 border border-white/10 rounded-xl overflow-hidden bg-white mt-2">
                              <img src={m.qr_code_url} alt="QR" className="h-full w-full object-contain" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Downpayment Inputs */}
            <div className="space-y-3 text-left">
              <input
                type="text"
                placeholder="Transaction Reference Number"
                value={paymentReferenceNo}
                onChange={(e) => setPaymentReferenceNo(e.target.value)}
                required
                className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 bg-zinc-950 text-left"
              />
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="prm-receipt-upload"
                  onChange={handleReceiptUpload}
                  accept="image/*"
                  className="hidden"
                />
                <label
                  htmlFor="prm-receipt-upload"
                  className="cursor-pointer rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-white/20 hover:text-white bg-zinc-950/40 inline-flex items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingReceipt ? "Uploading..." : "Upload Receipt Screenshot"}
                </label>
                {paymentReceiptUrl && (
                  <span className="text-xs text-green-400 font-semibold flex items-center gap-0.5">
                    <Check className="h-3.5 w-3.5" /> Added
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => { onClose(); setProjectSubmitted(false); setErrorMsg(""); setPaymentReceiptUrl(""); setPaymentReferenceNo(""); }}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingProject || uploadingReceipt || !receiptValidated}
                className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submittingProject ? "Analyzing..." : "Submit Request"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
