"use client";

import { useEffect, useState } from "react";
import { Check, AlertCircle, Eye, EyeOff, ExternalLink, Loader2, Plug } from "lucide-react";
import Skeleton from "@/components/Skeleton";

export default function OAuthSettingsPage() {
  const [form, setForm] = useState({
    google_client_id: "",
    google_client_secret: "",
    github_client_id: "",
    github_client_secret: "",
  });

  const [initialForm, setInitialForm] = useState<typeof form | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { valid: boolean; message: string } | null>>({});

  const testConnection = async (provider: string) => {
    setTesting(provider);
    setTestResults((prev) => ({ ...prev, [provider]: null }));
    try {
      const res = await fetch("/api/admin/oauth/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      setTestResults((prev) => ({ ...prev, [provider]: { valid: data.valid, message: data.message } }));
    } catch {
      setTestResults((prev) => ({ ...prev, [provider]: { valid: false, message: "Request failed." } }));
    } finally {
      setTesting(null);
    }
  };

  useEffect(() => {
    fetch("/api/admin/oauth")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.settings) {
          const fetched = {
            google_client_id: data.settings.google_client_id || "",
            google_client_secret: data.settings.google_client_secret || "",
            github_client_id: data.settings.github_client_id || "",
            github_client_secret: data.settings.github_client_secret || "",
          };
          setForm(fetched);
          setInitialForm(fetched);
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
      const res = await fetch("/api/admin/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setInitialForm(form);
        setSaveStatus({ type: "success", message: "OAuth settings saved successfully!" });
      } else {
        setSaveStatus({ type: "error", message: data.error || "Failed to save." });
      }
    } catch {
      setSaveStatus({ type: "error", message: "An error occurred while saving." });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = initialForm ? JSON.stringify(form) !== JSON.stringify(initialForm) : false;

  const inputCls = "glass w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50";

  if (loading) {
    return (
      <div className="px-6 py-24 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">OAuth Authentication</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Configure social login providers for your portfolio.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-8 space-y-6">
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-6">
          {/* Google */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              <h3 className="text-sm font-semibold text-white">Google</h3>
              <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="ml-auto text-[10px] text-cyan-400 hover:underline flex items-center gap-1">
                Google Cloud Console <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs text-zinc-500">Client ID</label>
                <input type="text" value={form.google_client_id} onChange={(e) => setForm({ ...form, google_client_id: e.target.value })} placeholder="xxxxxxxx.apps.googleusercontent.com" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs text-zinc-500">Client Secret</label>
                <div className="relative">
                  <input type={showSecrets ? "text" : "password"} value={form.google_client_secret} onChange={(e) => setForm({ ...form, google_client_secret: e.target.value })} placeholder="GOCSPX-..." className={`${inputCls} pr-10`} />
                  <button type="button" onClick={() => setShowSecrets(!showSecrets)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <button type="button" onClick={() => testConnection("google")} disabled={testing === "google" || !form.google_client_id || !form.google_client_secret}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-semibold text-zinc-300 transition-colors hover:border-white/20 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                {testing === "google" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plug className="h-3 w-3" />}
                Test Connection
              </button>
              {testResults.google && (
                <span className={`flex items-center gap-1 text-[10px] ${testResults.google.valid ? "text-green-400" : "text-red-400"}`}>
                  {testResults.google.valid ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  {testResults.google.message}
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* GitHub */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" color="#fff"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              <h3 className="text-sm font-semibold text-white">GitHub</h3>
              <a href="https://github.com/settings/developers" target="_blank" rel="noreferrer" className="ml-auto text-[10px] text-cyan-400 hover:underline flex items-center gap-1">
                GitHub OAuth Apps <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs text-zinc-500">Client ID</label>
                <input type="text" value={form.github_client_id} onChange={(e) => setForm({ ...form, github_client_id: e.target.value })} placeholder="Iv1.xxxxxxxxxxxx" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs text-zinc-500">Client Secret</label>
                <div className="relative">
                  <input type={showSecrets ? "text" : "password"} value={form.github_client_secret} onChange={(e) => setForm({ ...form, github_client_secret: e.target.value })} placeholder="ghp_..." className={`${inputCls} pr-10`} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <button type="button" onClick={() => testConnection("github")} disabled={testing === "github" || !form.github_client_id || !form.github_client_secret}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-semibold text-zinc-300 transition-colors hover:border-white/20 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                {testing === "github" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plug className="h-3 w-3" />}
                Test Connection
              </button>
              {testResults.github && (
                <span className={`flex items-center gap-1 text-[10px] ${testResults.github.valid ? "text-green-400" : "text-red-400"}`}>
                  {testResults.github.valid ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  {testResults.github.message}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {saveStatus && (
            <div className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs ${saveStatus.type === "success" ? "bg-cyan-500/10 text-cyan-400" : "bg-red-500/10 text-red-400"}`}>
              {saveStatus.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {saveStatus.message}
            </div>
          )}
          <div className="flex items-center gap-3 ml-auto">
            {hasChanges && (
              <button type="button" onClick={() => { if (initialForm) setForm(initialForm); setSaveStatus(null); }}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors">
                Discard
              </button>
            )}
            <button type="submit" disabled={saving || !hasChanges}
              className="rounded-xl bg-cyan-500 hover:bg-cyan-600 px-5 py-2 text-xs font-bold text-black shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
