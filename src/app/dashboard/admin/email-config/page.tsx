"use client";

import { useEffect, useState } from "react";
import { Mail, Lock, Server, User, Send, Check, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function EmailConfigPage() {
  const [form, setForm] = useState({
    smtp_host: "",
    smtp_port: 587,
    smtp_user: "",
    smtp_password: "",
    sender_email: "",
    sender_name: "",
    provider: "smtp",
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetch("/api/admin/email-config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.config) {
          setForm({
            smtp_host: data.config.smtp_host || "",
            smtp_port: data.config.smtp_port || 587,
            smtp_user: data.config.smtp_user || "",
            smtp_password: data.config.smtp_password || "",
            sender_email: data.config.sender_email || "",
            sender_name: data.config.sender_name || "",
            provider: data.config.provider || "smtp",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch("/api/admin/email-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveStatus({ type: "success", message: "Email configuration saved successfully!" });
      } else {
        setSaveStatus({ type: "error", message: data.error || "Failed to save configuration." });
      }
    } catch {
      setSaveStatus({ type: "error", message: "An error occurred while saving." });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;
    setTesting(true);
    setTestStatus(null);
    try {
      const res = await fetch("/api/admin/email-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, to_email: testEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestStatus({ type: "success", message: `Test email sent successfully! Check your inbox.` });
      } else {
        setTestStatus({ type: "error", message: data.error || "Failed to send test email." });
      }
    } catch {
      setTestStatus({ type: "error", message: "An error occurred during testing." });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-white">Emailer Configuration</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Setup and verify the SMTP server settings for sending One-Time Passwords (OTP).
        </p>

        <form onSubmit={handleSave} className="mt-10 space-y-6">
          <div className="glass rounded-2xl p-6 border border-white/5 space-y-6">
            <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Server Setup</h2>
            
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs text-zinc-500">SMTP Host</label>
                <div className="relative">
                  <Server className="absolute left-4 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={form.smtp_host}
                    onChange={(e) => setForm({ ...form, smtp_host: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="glass w-full rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs text-zinc-500">SMTP Port</label>
                <input
                  type="number"
                  required
                  value={form.smtp_port}
                  onChange={(e) => setForm({ ...form, smtp_port: Number(e.target.value) })}
                  placeholder="587"
                  className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs text-zinc-500">SMTP Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={form.smtp_user}
                    onChange={(e) => setForm({ ...form, smtp_user: e.target.value })}
                    placeholder="your-email@gmail.com"
                    className="glass w-full rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs text-zinc-500">SMTP Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.smtp_password}
                    onChange={(e) => setForm({ ...form, smtp_password: e.target.value })}
                    placeholder="••••••••••••"
                    className="glass w-full rounded-xl pl-11 pr-11 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-zinc-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/5 space-y-6">
            <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Sender Info</h2>
            
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs text-zinc-500">Sender Name</label>
                <input
                  type="text"
                  required
                  value={form.sender_name}
                  onChange={(e) => setForm({ ...form, sender_name: e.target.value })}
                  placeholder="Dee Jay Admin"
                  className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs text-zinc-500">Sender Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={form.sender_email}
                    onChange={(e) => setForm({ ...form, sender_email: e.target.value })}
                    placeholder="noreply@deejay.dev"
                    className="glass w-full rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {saveStatus && (
            <div className={`flex items-center gap-3 rounded-xl p-4 text-xs font-semibold ${
              saveStatus.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}>
              {saveStatus.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span>{saveStatus.message}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving Configuration..." : "Save Configuration"}
            </button>
          </div>
        </form>

        <div className="mt-10 border-t border-white/5 pt-10">
          <h2 className="text-base font-semibold text-white">Test Mail Connection</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Verify that your SMTP setup can successfully dispatch OTP emails to a verification recipient.
          </p>

          <form onSubmit={handleTest} className="mt-6 flex flex-col gap-4 sm:flex-row items-end">
            <div className="flex-1 w-full">
              <label className="mb-2 block text-xs text-zinc-500">Recipient Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="recipient@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="glass w-full rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={testing || !testEmail}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/10 px-6 text-xs font-semibold text-white transition-all hover:bg-white/15 disabled:opacity-50 max-sm:w-full"
            >
              <Send className="h-4 w-4" />
              <span>{testing ? "Testing..." : "Send Test OTP"}</span>
            </button>
          </form>

          {testStatus && (
            <div className={`mt-4 flex items-center gap-3 rounded-xl p-4 text-xs font-semibold ${
              testStatus.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}>
              {testStatus.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span>{testStatus.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
