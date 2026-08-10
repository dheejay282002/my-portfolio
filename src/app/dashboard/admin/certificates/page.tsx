"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Award, Link2, Eye, EyeOff, Copy, Check } from "lucide-react";
import Skeleton from "@/components/Skeleton";

interface Certificate {
  id: number;
  recipient_name: string;
  course_title: string;
  description: string;
  issued_date: string;
  issuer_name: string;
  issuer_title: string;
  badge_image_url: string;
  certificate_image_url: string;
  certificate_url: string;
  credly_badge_id: string;
  credly_host: string;
  is_public: boolean;
  created_at: string;
}

export default function CertificatesPage() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Certificate | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    recipient_name: "",
    course_title: "",
    description: "",
    issued_date: new Date().toISOString().split("T")[0],
    issuer_name: "",
    issuer_title: "",
    badge_image_url: "",
    certificate_image_url: "",
    credly_badge_id: "",
    credly_host: "https://www.credly.com",
  });

  useEffect(() => {
    fetch("/api/certificates")
      .then((r) => r.json())
      .then((d) => { setCerts(d.certificates || []); setLoading(false); });
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({
      recipient_name: "", course_title: "", description: "",
      issued_date: new Date().toISOString().split("T")[0],
      issuer_name: "", issuer_title: "", badge_image_url: "", certificate_image_url: "",
      credly_badge_id: "", credly_host: "https://www.credly.com",
    });
    setShowModal(true);
  };

  const openEdit = (c: Certificate) => {
    setEditing(c);
    setForm({
      recipient_name: c.recipient_name,
      course_title: c.course_title,
      description: c.description || "",
      issued_date: c.issued_date ? c.issued_date.split("T")[0] : "",
      issuer_name: c.issuer_name || "",
      issuer_title: c.issuer_title || "",
      badge_image_url: c.badge_image_url || "",
      certificate_image_url: c.certificate_image_url || "",
      credly_badge_id: c.credly_badge_id || "",
      credly_host: c.credly_host || "https://www.credly.com",
    });
    setShowModal(true);
  };

  const handleBadgeUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "badge_image_url" | "certificate_image_url") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      alert("Only image files (PNG, JPG, GIF, WEBP) and PDF are allowed.");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setForm((p) => ({ ...p, [field]: data.url }));
    } catch {}
    setUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await fetch(`/api/certificates/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        setCerts((p) => p.map((c) => (c.id === editing.id ? { ...c, ...form } : c)));
      } else {
        const res = await fetch("/api/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (data.certificate_url) {
          const newCert: Certificate = {
            id: data.id,
            ...form,
            certificate_url: data.certificate_url,
            is_public: true,
            created_at: new Date().toISOString(),
          };
          setCerts((p) => [newCert, ...p]);
        }
      }
      setShowModal(false);
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this certificate?")) return;
    const res = await fetch(`/api/certificates/${id}`, { method: "DELETE" });
    if (res.ok) setCerts((p) => p.filter((c) => c.id !== id));
  };

  const togglePublic = async (c: Certificate) => {
    await fetch(`/api/certificates/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_public: !c.is_public }),
    });
    setCerts((p) => p.map((x) => (x.id === c.id ? { ...x, is_public: !x.is_public } : x)));
  };

  const copyLink = (c: Certificate) => {
    const base = window.location.origin;
    navigator.clipboard.writeText(`${base}/certificates/${c.certificate_url}`);
    setCopied(c.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getEmbedCode = (c: Certificate) => {
    if (c.credly_badge_id) {
      const host = c.credly_host || "https://www.credly.com";
      return `<div data-iframe-width="150" data-iframe-height="270" data-share-badge-id="${c.credly_badge_id}" data-share-badge-host="${host}"></div>\n<script type="text/javascript" async src="//cdn.credly.com/assets/utilities/embed.js"></script>`;
    }
    const base = window.location.origin;
    return `<iframe src="${base}/certificates/${c.certificate_url}" width="800" height="600" frameborder="0"></iframe>`;
  };

  if (loading) {
    return (
      <div className="px-6 py-24">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-11 w-40 rounded-xl" />
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="mt-4 h-5 w-3/4" />
              <Skeleton className="mt-2 h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Certificates</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Create and manage certificates. Share embedded links with recipients.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Certificate
        </button>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {certs.length === 0 ? (
          <div className="col-span-full py-16 text-center text-zinc-500">
            No certificates yet. Click "Add Certificate" to create one.
          </div>
        ) : (
          certs.map((c) => (
            <div key={c.id} className="glass rounded-2xl p-6 transition-all glass-hover group">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
                  <Award className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => togglePublic(c)} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-cyan-400" title={c.is_public ? "Public" : "Private"}>
                    {c.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-cyan-400">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="mt-4 font-semibold text-white">{c.recipient_name}</h3>
              <p className="mt-1 text-sm text-zinc-400">{c.course_title}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {new Date(c.issued_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </p>

              <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3">
                <button
                  onClick={() => copyLink(c)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {copied === c.id ? <Check className="h-3 w-3 text-green-400" /> : <Link2 className="h-3 w-3" />}
                  {copied === c.id ? "Copied!" : "Copy Link"}
                </button>
                <button
                  onClick={() => {
                    const embed = getEmbedCode(c);
                    navigator.clipboard.writeText(embed);
                    setCopied(c.id);
                    setTimeout(() => setCopied(null), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {copied === c.id ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                  {copied === c.id ? "Copied!" : "Embed"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass w-full max-w-lg rounded-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editing ? "Edit Certificate" : "Add Certificate"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 transition-colors hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <input type="text" placeholder="Recipient Name" value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} required className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50" />
              <input type="text" placeholder="Course / Program Title" value={form.course_title} onChange={(e) => setForm({ ...form, course_title: e.target.value })} required className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50" />
              <textarea rows={2} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="glass w-full resize-none rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50" />
              <input type="date" value={form.issued_date} onChange={(e) => setForm({ ...form, issued_date: e.target.value })} className="glass w-full rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Issuer Name" value={form.issuer_name} onChange={(e) => setForm({ ...form, issuer_name: e.target.value })} className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50" />
                <input type="text" placeholder="Issuer Title" value={form.issuer_title} onChange={(e) => setForm({ ...form, issuer_title: e.target.value })} className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs text-zinc-500">Badge Image (icon)</label>
                  <div className="flex items-center gap-3">
                    {form.badge_image_url && (
                      <img src={form.badge_image_url} alt="Badge" className="h-12 w-12 rounded-lg object-cover border border-white/10" />
                    )}
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:border-white/20 hover:text-white">
                      {uploading ? "..." : "Upload Badge"}
                      <input type="file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,.pdf" onChange={(e) => handleBadgeUpload(e, "badge_image_url")} className="hidden" disabled={uploading} />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs text-zinc-500">Certificate Image (full doc)</label>
                  <div className="flex items-center gap-3">
                    {form.certificate_image_url && (
                      <img src={form.certificate_image_url} alt="Certificate" className="h-12 w-12 rounded-lg object-cover border border-white/10" />
                    )}
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:border-white/20 hover:text-white">
                      {uploading ? "..." : "Upload Cert"}
                      <input type="file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,.pdf" onChange={(e) => handleBadgeUpload(e, "certificate_image_url")} className="hidden" disabled={uploading} />
                    </label>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/5 pt-4">
                <p className="text-xs text-zinc-500 mb-3">Credly Badge Embed (optional)</p>
                <input type="text" placeholder="Credly Badge ID" value={form.credly_badge_id} onChange={(e) => setForm({ ...form, credly_badge_id: e.target.value })} className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50" />
                <input type="text" placeholder="Credly Host (default: https://www.credly.com)" value={form.credly_host} onChange={(e) => setForm({ ...form, credly_host: e.target.value })} className="glass mt-3 w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
