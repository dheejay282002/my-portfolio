"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Upload, Check, AlertCircle, CreditCard, Building2 } from "lucide-react";
import Image from "next/image";

interface BankMethod {
  id: number;
  provider_name: string;
  account_name: string;
  account_number: string;
  qr_code_url: string;
  is_active: boolean;
}

interface ProjectRequest {
  id: number;
  project_name: string;
  description: string;
  tech_stack: string;
  status: string;
  package_tier?: string;
  project_baseline?: string;
  payment_receipt_url?: string | null;
  payment_reference_no?: string | null;
}

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [request, setRequest] = useState<ProjectRequest | null>(null);
  const [banks, setBanks] = useState<BankMethod[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [referenceNo, setReferenceNo] = useState("");
  const [banksLoading, setBanksLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/project-requests")
      .then((r) => r.json())
      .then((d) => {
        const found = d.requests?.find((r: ProjectRequest) => r.id === Number(id));
        if (found) setRequest(found);
        else setError("Project request not found.");
      })
      .catch(() => setError("Failed to load project request."));
  }, [id]);

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
    if (!receiptFile) {
      setError("Please upload your payment receipt screenshot.");
      return;
    }
    if (!referenceNo.trim()) {
      setError("Please enter the transaction reference number.");
      return;
    }
    if (!selectedBankId) {
      setError("Please select a bank or payment method.");
      return;
    }

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

      const res = await fetch(`/api/project-requests/${id}`, {
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

  const getDownpaymentAmount = (baseline?: string) => {
    if (!baseline) return null;
    const nums = baseline.replace(/[$,]/g, "").match(/\d+/g);
    if (!nums) return null;
    const minPrice = parseInt(nums[0], 10);
    const half = Math.round(minPrice / 2);
    return `$${half.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => router.push("/dashboard/client/project-requests")}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project Requests
        </button>

        {success ? (
          <div className="rounded-2xl glass border border-green-500/20 p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <Check className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Payment Submitted!</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Your downpayment receipt has been uploaded. The admin will verify it shortly.
            </p>
            <button
              onClick={() => router.push("/dashboard/client/project-requests")}
              className="mt-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white">Complete Your Payment</h1>
              <p className="mt-1 text-sm text-zinc-400">
                Select a payment method, transfer the downpayment, then upload your receipt.
              </p>
            </div>

            {request && (
              <div className="mb-6 rounded-xl border border-white/5 bg-zinc-950/40 p-4 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Project</p>
                <p className="text-sm font-semibold text-white">{request.project_name}</p>
                {request.description && (
                  <p className="text-xs text-zinc-400 line-clamp-2">{request.description}</p>
                )}
                {request.package_tier && (
                  <>
                    <div className="h-px bg-white/5" />
                    <p className="text-xs text-cyan-400 font-semibold">{request.package_tier}</p>
                    <p className="text-xs text-zinc-300">
                      Package Price: <span className="font-semibold text-white">{request.project_baseline}</span>
                    </p>
                    <p className="text-xs text-yellow-400 font-semibold">
                      Downpayment (50%): <span className="text-white">{getDownpaymentAmount(request.project_baseline) || request.project_baseline}</span>
                    </p>
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Bank Selection */}
              <div className="rounded-xl border border-white/5 bg-zinc-950/40 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                  Select Payment Method
                </p>
                {banksLoading ? (
                  <p className="text-xs text-zinc-500">Loading payment methods...</p>
                ) : banks.length === 0 ? (
                  <p className="text-xs text-zinc-500">No payment methods available yet. Please contact the developer to add bank accounts.</p>
                ) : (
                  <div className="space-y-2">
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
                          className="h-4 w-4 text-cyan-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{bank.provider_name}</p>
                          <p className="text-xs text-zinc-400">{bank.account_name}</p>
                          <p className="text-xs font-mono text-zinc-500">{bank.account_number}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Bank Details */}
              {selectedBank && (
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5 text-center">
                  <CreditCard className="mx-auto mb-3 h-8 w-8 text-cyan-400" />
                  <p className="text-sm font-bold text-white">{selectedBank.provider_name}</p>
                  <p className="mt-1 text-xs text-zinc-400">Account Name: <span className="font-semibold text-white">{selectedBank.account_name}</span></p>
                  <p className="text-xs text-zinc-400">Account Number: <span className="font-mono font-bold text-cyan-400">{selectedBank.account_number}</span></p>
                  {selectedBank.qr_code_url && (
                    <div className="mt-4 inline-block rounded-xl border border-white/5 bg-white p-2">
                      <Image
                        src={selectedBank.qr_code_url}
                        alt={`${selectedBank.provider_name} QR`}
                        width={160}
                        height={160}
                        className="rounded-lg"
                      />
                    </div>
                  )}
                  <p className="mt-3 text-xs text-zinc-500">
                    Transfer your downpayment to this account, then upload your receipt below.
                  </p>
                </div>
              )}

              {/* Receipt Upload */}
              <div className="rounded-xl border border-white/5 bg-zinc-950/40 p-5 space-y-4">
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
                {receiptFile && (
                  <p className="text-[10px] text-green-400">Selected: {receiptFile.name}</p>
                )}
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

              <button
                type="submit"
                disabled={submitting || !receiptFile || !referenceNo.trim() || !selectedBankId}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Submit Payment Receipt
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
