"use client";

import { useEffect, useState } from "react";
import { X, Check, AlertCircle, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [projectForm, setProjectForm] = useState({ project_name: "", description: "", tech_stack: "", product_id: "" as string | number });
  const [submitting, setSubmitting] = useState(false);
  const [projectSubmitted, setProjectSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState<number | null>(null);
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

  const formatPrice = (baseline: string) => baseline;

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
      setSubmittedId(data.id);
      setProjectSubmitted(true);
      if (inviteMsgId && onSubmitted) onSubmitted(inviteMsgId);
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
            <p className="mt-1 text-sm text-zinc-500">Now proceed to payment to complete your downpayment.</p>
            <button
              onClick={() => {
                onClose();
                setProjectSubmitted(false);
                setErrorMsg("");
                if (submittedId) router.push(`/dashboard/client/payment/${submittedId}`);
              }}
              className="mt-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Proceed to Payment
            </button>
          </div>
        ) : (
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

            <div className="flex gap-3 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => { onClose(); setProjectSubmitted(false); setErrorMsg(""); }}
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
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
