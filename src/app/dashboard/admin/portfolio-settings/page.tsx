"use client";

import { useEffect, useState } from "react";
import {
  Layout, Link2, Copy, Check, Eye, EyeOff, Plus, X, Trash2,
  Globe, User, Code2, Briefcase, Mail, Wrench
} from "lucide-react";
import Skeleton from "@/components/Skeleton";

interface PortfolioSettings {
  slug: string;
  title: string;
  tagline: string;
  bio: string;
  skills: { name: string; level: string }[];
  social_github: string;
  social_linkedin: string;
  social_facebook: string;
  social_twitter: string;
  contact_email: string;
  contact_phone: string;
  contact_location: string;
  hero_visible: boolean;
  about_visible: boolean;
  skills_visible: boolean;
  projects_visible: boolean;
  services_visible: boolean;
  contact_visible: boolean;
  is_published: boolean;
}

const defaultSettings: PortfolioSettings = {
  slug: "",
  title: "My Portfolio",
  tagline: "Web Developer & Designer",
  bio: "",
  skills: [],
  social_github: "",
  social_linkedin: "",
  social_facebook: "",
  social_twitter: "",
  contact_email: "",
  contact_phone: "",
  contact_location: "",
  hero_visible: true,
  about_visible: true,
  skills_visible: true,
  projects_visible: true,
  services_visible: true,
  contact_visible: true,
  is_published: false,
};

const skillLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];

export default function PortfolioSettingsPage() {
  const [settings, setSettings] = useState<PortfolioSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: "", level: "Intermediate" });
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/portfolio-settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings({
            ...defaultSettings,
            ...data.settings,
            skills: Array.isArray(data.settings.skills) ? data.settings.skills : [],
          });
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch("/api/admin/portfolio-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaveStatus({ type: "success", message: "Portfolio settings saved!" });
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus({ type: "error", message: "Failed to save settings" });
      }
    } catch {
      setSaveStatus({ type: "error", message: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = () => {
    const raw = settings.title || "my-portfolio";
    const slug = raw
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50);
    setSettings((prev) => ({ ...prev, slug }));
  };

  const portfolioUrl = baseUrl ? `${baseUrl}/portfolio/${settings.slug || "..."}` : `/portfolio/${settings.slug || "..."}`;

  const copyLink = () => {
    navigator.clipboard.writeText(portfolioUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addSkill = () => {
    if (!newSkill.name.trim()) return;
    setSettings((prev) => ({
      ...prev,
      skills: [...prev.skills, { name: newSkill.name.trim(), level: newSkill.level }],
    }));
    setNewSkill({ name: "", level: "Intermediate" });
  };

  const removeSkill = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const toggleSection = (key: keyof PortfolioSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
            <Layout className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Portfolio Settings</h1>
            <p className="text-xs text-zinc-500">Configure your public portfolio page</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
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

      {/* Portfolio Link */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Portfolio Link</h2>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400 shrink-0">{baseUrl}/portfolio/</span>
            <input
              type="text"
              value={settings.slug}
              onChange={(e) => setSettings((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
              placeholder="my-portfolio"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
            />
            <button
              onClick={generateSlug}
              className="shrink-0 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
            >
              Generate
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-300 truncate">
              {portfolioUrl}
            </div>
            <button
              onClick={copyLink}
              disabled={!settings.slug}
              className="shrink-0 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
            >
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${settings.is_published ? "bg-green-400" : "bg-zinc-600"}`} />
              <span className="text-xs text-zinc-400">{settings.is_published ? "Published" : "Draft"}</span>
            </div>
            <button
              onClick={() => setSettings((p) => ({ ...p, is_published: !p.is_published }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.is_published ? "bg-cyan-500" : "bg-zinc-700"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.is_published ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Basic Information</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Portfolio Title</label>
            <input
              type="text"
              value={settings.title}
              onChange={(e) => setSettings((p) => ({ ...p, title: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tagline</label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => setSettings((p) => ({ ...p, tagline: e.target.value }))}
              placeholder="Web Developer & Designer"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Bio / About</label>
            <textarea
              value={settings.bio}
              onChange={(e) => setSettings((p) => ({ ...p, bio: e.target.value }))}
              rows={4}
              placeholder="Tell visitors about yourself..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Skills</h2>
        </div>

        <div className="space-y-3">
          {settings.skills.map((skill, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white">{skill.name}</span>
              <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-400">{skill.level}</span>
              <button onClick={() => removeSkill(i)} className="text-zinc-500 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSkill.name}
              onChange={(e) => setNewSkill((p) => ({ ...p, name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addSkill()}
              placeholder="Add skill..."
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
            />
            <select
              value={newSkill.level}
              onChange={(e) => setNewSkill((p) => ({ ...p, level: e.target.value }))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-cyan-500/50"
            >
              {skillLevels.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <button
              onClick={addSkill}
              className="shrink-0 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Social Links</h2>
        </div>

        <div className="space-y-3">
          {[
            { key: "social_github" as const, label: "GitHub" },
            { key: "social_linkedin" as const, label: "LinkedIn" },
            { key: "social_facebook" as const, label: "Facebook" },
            { key: "social_twitter" as const, label: "Twitter / X" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-zinc-400 mb-1">{label}</label>
              <input
                type="url"
                value={settings[key]}
                onChange={(e) => setSettings((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={`https://${label.toLowerCase()}.com/...`}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Contact Info */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Contact Information</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              value={settings.contact_email}
              onChange={(e) => setSettings((p) => ({ ...p, contact_email: e.target.value }))}
              placeholder="your@email.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Phone</label>
            <input
              type="tel"
              value={settings.contact_phone}
              onChange={(e) => setSettings((p) => ({ ...p, contact_phone: e.target.value }))}
              placeholder="+63 9XX XXX XXXX"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Location</label>
            <input
              type="text"
              value={settings.contact_location}
              onChange={(e) => setSettings((p) => ({ ...p, contact_location: e.target.value }))}
              placeholder="City, Country"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
      </div>

      {/* Section Visibility */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Section Visibility</h2>
        </div>

        <div className="space-y-3">
          {[
            { key: "hero_visible" as const, label: "Hero / Intro", icon: "🏠" },
            { key: "about_visible" as const, label: "About Me", icon: "👤" },
            { key: "skills_visible" as const, label: "Skills", icon: "⚡" },
            { key: "projects_visible" as const, label: "Projects", icon: "💼" },
            { key: "services_visible" as const, label: "Services", icon: "🛠" },
            { key: "contact_visible" as const, label: "Contact", icon: "📧" },
          ].map(({ key, label, icon }) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{icon}</span>
                <span className="text-sm text-white">{label}</span>
              </div>
              <button
                onClick={() => toggleSection(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings[key] ? "bg-cyan-500" : "bg-zinc-700"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings[key] ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Bottom */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
