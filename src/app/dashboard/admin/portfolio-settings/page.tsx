"use client";

import { useEffect, useState } from "react";
import { Layout, Link2, Copy, Check } from "lucide-react";
import Skeleton from "@/components/Skeleton";

export default function PortfolioSettingsPage() {
  const [slug, setSlug] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [baseUrl] = useState(typeof window !== "undefined" ? window.location.origin : "");

  useEffect(() => {
    fetch("/api/admin/portfolio-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setSlug(d.settings.slug || "");
          setIsPublished(d.settings.is_published || false);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch("/api/admin/portfolio-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, is_published: isPublished }),
      });
      if (res.ok) {
        setSaveStatus({ type: "success", message: "Saved!" });
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus({ type: "error", message: "Failed to save" });
      }
    } catch {
      setSaveStatus({ type: "error", message: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = () => {
    const s = "my-portfolio-" + Math.random().toString(36).substring(2, 8);
    setSlug(s);
  };

  const portfolioUrl = `${baseUrl}/portfolio/${slug || "..."}`;

  const copyLink = () => {
    navigator.clipboard.writeText(portfolioUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="p-8"><Skeleton className="h-64 w-full rounded-2xl" /></div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
          <Layout className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Portfolio Settings</h1>
          <p className="text-xs text-zinc-500">Generate a public link to your portfolio</p>
        </div>
      </div>

      {saveStatus && (
        <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
          saveStatus.type === "success"
            ? "border-green-500/20 bg-green-500/10 text-green-400"
            : "border-red-500/20 bg-red-500/10 text-red-400"
        }`}>
          {saveStatus.message}
        </div>
      )}

      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Your Portfolio Link</h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400 shrink-0">{baseUrl}/portfolio/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="your-slug"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
          />
          <button
            onClick={generateSlug}
            className="shrink-0 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-medium text-zinc-300 hover:border-white/20 hover:text-white"
          >
            Random
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-300 truncate">
            {portfolioUrl}
          </div>
          <button
            onClick={copyLink}
            disabled={!slug}
            className="shrink-0 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isPublished ? "bg-green-400" : "bg-zinc-600"}`} />
            <span className="text-xs text-zinc-400">{isPublished ? "Published" : "Draft"}</span>
          </div>
          <button
            onClick={() => setIsPublished((p) => !p)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublished ? "bg-cyan-500" : "bg-zinc-700"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublished ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !slug}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
