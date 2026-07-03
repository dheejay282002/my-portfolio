"use client";

import { useEffect, useState } from "react";
import { X, Check, AlertCircle, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocalCurrency } from "@/hooks/useLocalCurrency";

interface Product {
  id: number;
  package_tier: string;
  project_baseline: string;
  est_timeline: string;
  deliverables: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  conversationId?: number | null;
  inviteMsgId?: number | null;
  onSubmitted?: (msgId: number) => void;
}

export default function ProjectRequestModal({ open, onClose, conversationId, inviteMsgId, onSubmitted }: Props) {
  const router = useRouter();
  const { formatPrice, formatDownpayment, loaded, currency } = useLocalCurrency();
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [projectForm, setProjectForm] = useState({ project_name: "", description: "", tech_stack: "", product_id: "" as string | number });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!open) return;
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
      onClose();
      if (inviteMsgId && onSubmitted) onSubmitted(inviteMsgId);
      router.push(`/dashboard/client/payment/${data.id}`);
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
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">New Project Request</h3>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-400">
              {currency}
            </span>
            <button onClick={onClose} className="text-zinc-500 transition-colors hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

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
                  setProjectForm({
                    ...projectForm,
                    product_id: val ? Number(val) : "",
                  });
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
                {submitting ? (
                  "Processing..."
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Proceed to Payment
                  </>
                )}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
}
