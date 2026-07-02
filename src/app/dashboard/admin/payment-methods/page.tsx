"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Edit, Trash2, AlertCircle, Check, CreditCard, ToggleLeft, ToggleRight, Globe, Key, Shield, Link } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import Image from "next/image";

interface PaymentMethod {
  id: number;
  provider_name: string;
  account_name: string;
  account_number: string;
  qr_code_url: string;
  is_active: boolean;
  created_at: string;
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    provider_name: "",
    account_name: "",
    account_number: "",
    qr_code_url: "",
    is_active: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dodoForm, setDodoForm] = useState({
    is_enabled: false,
    api_key: "",
    webhook_key: "",
    product_id: "",
    return_url: "",
    environment: "test",
  });
  const [dodoSaving, setDodoSaving] = useState(false);
  const [dodoSuccess, setDodoSuccess] = useState("");
  const [dodoError, setDodoError] = useState("");

  const fetchDodoConfig = async () => {
    try {
      const res = await fetch("/api/payment-gateways");
      if (res.ok) {
        const { gateways } = await res.json();
        const dodo = gateways?.find((g: any) => g.provider === "dodo");
        if (dodo) {
          const cfg = typeof dodo.config === "string" ? JSON.parse(dodo.config) : dodo.config;
          setDodoForm({
            is_enabled: dodo.is_enabled,
            api_key: cfg.api_key || "",
            webhook_key: cfg.webhook_key || "",
            product_id: cfg.product_id || "",
            return_url: cfg.return_url || "",
            environment: cfg.environment || "test",
          });
        }
      }
    } catch {}
  };

  const handleSaveDodo = async () => {
    setDodoSaving(true);
    setDodoError("");
    setDodoSuccess("");
    try {
      const res = await fetch("/api/payment-gateways", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "dodo",
          is_enabled: dodoForm.is_enabled,
          config: {
            api_key: dodoForm.api_key,
            webhook_key: dodoForm.webhook_key,
            product_id: dodoForm.product_id,
            return_url: dodoForm.return_url,
            environment: dodoForm.environment,
          },
        }),
      });
      if (res.ok) {
        setDodoSuccess("DODO configuration saved!");
      } else {
        const data = await res.json();
        setDodoError(data.error || "Failed to save.");
      }
    } catch {
      setDodoError("Something went wrong.");
    } finally {
      setDodoSaving(false);
    }
  };

  const fetchMethods = async () => {
    try {
      const res = await fetch("/api/payment-methods");
      if (res.ok) {
        const d = await res.json();
        setMethods(d.methods || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchMethods();
    fetchDodoConfig();
  }, []);

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setForm((prev) => ({ ...prev, qr_code_url: data.url }));
      } else {
        setError("Failed to upload QR code. Make sure it's under 4.5MB.");
      }
    } catch {
      setError("An error occurred during file upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.provider_name || !form.account_name || !form.account_number) {
      setError("Please fill in all required bank fields.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const url = editingId ? `/api/payment-methods/${editingId}` : "/api/payment-methods";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSuccess(editingId ? "Payment method updated!" : "New payment method added!");
        setForm({ provider_name: "", account_name: "", account_number: "", qr_code_url: "", is_active: true });
        setEditingId(null);
        fetchMethods();
      } else {
        const d = await res.json();
        setError(d.error || "Something went wrong.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (m: PaymentMethod) => {
    setEditingId(m.id);
    setForm({
      provider_name: m.provider_name,
      account_name: m.account_name,
      account_number: m.account_number,
      qr_code_url: m.qr_code_url,
      is_active: m.is_active,
    });
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this payment method?")) return;
    try {
      const res = await fetch(`/api/payment-methods/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccess("Payment method deleted!");
        fetchMethods();
      }
    } catch {}
  };

  const handleToggleActive = async (m: PaymentMethod) => {
    try {
      const res = await fetch(`/api/payment-methods/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !m.is_active }),
      });
      if (res.ok) {
        fetchMethods();
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="px-6 py-24 space-y-6">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-72" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-96 md:col-span-1 rounded-2xl" />
          <Skeleton className="h-96 md:col-span-2 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-24 text-left space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-cyan-400 animate-pulse" />
          Payment Methods & Accounts
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Configure bank accounts and payment channels clients can select to send their project downpayments and final milestone payments.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-xs text-green-400 flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-3 items-start">
        {/* Editor Form */}
        <div className="glass rounded-2xl p-6 space-y-4 md:col-span-1">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            {editingId ? "Edit Bank Account" : "Add Bank Account"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Provider / Bank Name</label>
              <input
                type="text"
                placeholder="e.g. GCash, BDO, Unionbank"
                value={form.provider_name}
                onChange={(e) => setForm({ ...form, provider_name: e.target.value })}
                required
                className="glass w-full rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 bg-zinc-950"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Account Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={form.account_name}
                onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                required
                className="glass w-full rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 bg-zinc-950"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Account Number</label>
              <input
                type="text"
                placeholder="e.g. 0917XXXXXXX or 123-456-789"
                value={form.account_number}
                onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                required
                className="glass w-full rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 bg-zinc-950"
              />
            </div>

            {/* QR Code Upload */}
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">QR Code Image (Optional)</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleQRUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
                >
                  {uploading ? "Uploading..." : "Upload Image"}
                </button>
                {form.qr_code_url && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, qr_code_url: "" })}
                    className="text-[10px] text-red-400 hover:underline"
                  >
                    Remove QR
                  </button>
                )}
              </div>
              {form.qr_code_url && (
                <div className="relative mt-2 h-32 w-32 border border-white/10 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
                  <Image src={form.qr_code_url} alt="QR Code Preview" fill className="object-contain" unoptimized />
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
              >
                {editingId ? "Save Changes" : "Create Account"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm({ provider_name: "", account_name: "", account_number: "", qr_code_url: "", is_active: true });
                  }}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Listing Grid */}
        <div className="glass rounded-2xl p-6 md:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider text-left">Active Payment methods</h2>
          {methods.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              No bank accounts configured. Add one on the left to start accepting downpayments.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-400">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-500 font-semibold">
                    <th className="pb-3 pr-4">Provider</th>
                    <th className="pb-3 px-4">Account Details</th>
                    <th className="pb-3 px-4 text-center">QR Code</th>
                    <th className="pb-3 px-4 text-center">Status</th>
                    <th className="pb-3 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {methods.map((m) => (
                    <tr key={m.id} className="hover:bg-white/2 transition-colors">
                      <td className="py-4 pr-4 font-semibold text-white">{m.provider_name}</td>
                      <td className="py-4 px-4 text-left">
                        <p className="font-medium text-zinc-300">{m.account_name}</p>
                        <p className="text-[10px] text-zinc-500">{m.account_number}</p>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {m.qr_code_url ? (
                          <div className="relative mx-auto h-10 w-10 border border-white/10 rounded overflow-hidden bg-white/5">
                            <Image src={m.qr_code_url} alt="QR" fill className="object-contain" unoptimized />
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-600">None</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(m)}
                          className="text-zinc-500 transition-colors hover:text-white inline-flex items-center"
                        >
                          {m.is_active ? (
                            <ToggleRight className="h-6 w-6 text-green-400" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-zinc-600" />
                          )}
                        </button>
                      </td>
                      <td className="py-4 pl-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(m)}
                            className="rounded-lg p-1.5 border border-white/5 text-zinc-400 hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="rounded-lg p-1.5 border border-white/5 text-zinc-400 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* DODO Payments Configuration */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-cyan-400" />
              DODO Payments Gateway
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Configure online payment processing via DODO Payments (credit/debit cards, etc.)</p>
          </div>
          <button
            onClick={() => {
              setDodoForm((prev) => ({ ...prev, is_enabled: !dodoForm.is_enabled }));
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
              dodoForm.is_enabled
                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                : "bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20"
            }`}
          >
            {dodoForm.is_enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
            {dodoForm.is_enabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Key className="h-3 w-3" /> API Key
            </label>
            <input
              type="password"
              placeholder="sk_live_... or sk_test_..."
              value={dodoForm.api_key}
              onChange={(e) => setDodoForm((prev) => ({ ...prev, api_key: e.target.value }))}
              className="glass w-full rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 bg-zinc-950 font-mono"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Shield className="h-3 w-3" /> Webhook Secret Key
            </label>
            <input
              type="password"
              placeholder="whsec_..."
              value={dodoForm.webhook_key}
              onChange={(e) => setDodoForm((prev) => ({ ...prev, webhook_key: e.target.value }))}
              className="glass w-full rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 bg-zinc-950 font-mono"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Globe className="h-3 w-3" /> Product ID
            </label>
            <input
              type="text"
              placeholder="prod_..."
              value={dodoForm.product_id}
              onChange={(e) => setDodoForm((prev) => ({ ...prev, product_id: e.target.value }))}
              className="glass w-full rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 bg-zinc-950 font-mono"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Link className="h-3 w-3" /> Return URL
            </label>
            <input
              type="text"
              placeholder="https://yoursite.com/dashboard/client/project-requests"
              value={dodoForm.return_url}
              onChange={(e) => setDodoForm((prev) => ({ ...prev, return_url: e.target.value }))}
              className="glass w-full rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 bg-zinc-950 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase">Environment</span>
            <select
              value={dodoForm.environment}
              onChange={(e) => setDodoForm((prev) => ({ ...prev, environment: e.target.value }))}
              className="glass rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50 bg-zinc-950"
            >
              <option value="test">Test (Sandbox)</option>
              <option value="live">Live (Production)</option>
            </select>
          </div>
          <button
            onClick={handleSaveDodo}
            disabled={dodoSaving}
            className="ml-auto rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {dodoSaving ? "Saving..." : "Save DODO Configuration"}
          </button>
        </div>
        {dodoSuccess && (
          <p className="text-xs text-green-400 flex items-center gap-1"><Check className="h-3 w-3" /> {dodoSuccess}</p>
        )}
        {dodoError && (
          <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {dodoError}</p>
        )}
        {dodoForm.api_key && (
          <div className="border-t border-white/5 pt-3 mt-2">
            <p className="text-[10px] text-zinc-600">
              Webhook URL for DODO Dashboard: <code className="text-cyan-400 bg-white/5 px-1.5 py-0.5 rounded">{typeof window !== "undefined" ? window.location.origin : ""}/api/dodo/webhook</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
