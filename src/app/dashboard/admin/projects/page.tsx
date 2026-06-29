"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, ExternalLink, X, Upload } from "lucide-react";

interface ProjectImage {
  id: number;
  url: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  live_url: string;
  images: ProjectImage[];
  tech_stack: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    live_url: "",
    images: [] as string[],
    tech_stack: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects));
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", description: "", live_url: "", images: [], tech_stack: "" });
    setShowModal(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({
      title: p.title,
      description: p.description,
      live_url: p.live_url,
      images: p.images.map((img) => img.url),
      tech_stack: p.tech_stack,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch("/api/projects", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...form }),
        });
        if (res.ok) {
          setProjects((p) =>
            p.map((x) =>
              x.id === editing.id
                ? { ...x, ...form, images: form.images.map((url, i) => ({ id: i, url })) }
                : x
            )
          );
        }
      } else {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const data = await res.json();
          setProjects((p) => [
            { id: data.id, ...form, created_at: "", images: form.images.map((url, i) => ({ id: i, url })) } as Project,
            ...p,
          ]);
        }
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this project?")) return;
    const res = await fetch("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setProjects((p) => p.filter((x) => x.id !== id));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) setForm((f) => ({ ...f, images: [...f.images, data.url] }));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  return (
    <div className="px-6 py-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage your portfolio projects.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Project
        </button>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <div className="col-span-full py-16 text-center text-zinc-500">
            No projects yet.
          </div>
        ) : (
          projects.map((p) => (
            <div key={p.id} className="glass rounded-2xl overflow-hidden transition-all glass-hover flex flex-col">
              {p.images && p.images.length > 0 && (
                <div className="relative aspect-video w-full">
                  <Image src={p.images[0].url} alt={p.title} fill className="object-cover" unoptimized />
                  {p.images.length > 1 && (
                    <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2.5 py-0.5 text-xs text-white">
                      +{p.images.length - 1}
                    </span>
                  )}
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400 line-clamp-2">{p.description}</p>
                {p.tech_stack && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.tech_stack.split(",").map((t) => (
                      <span key={t.trim()} className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-400">{t.trim()}</span>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex items-center gap-2">
                  {p.live_url && (
                    <a href={p.live_url} target="_blank" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-cyan-400">
                      <ExternalLink className="h-3.5 w-3.5" /> Live View
                    </a>
                  )}
                  <div className="ml-auto flex gap-1">
                    <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-cyan-400">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass w-full max-w-lg rounded-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{editing ? "Edit Project" : "Add Project"}</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 transition-colors hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <input type="text" placeholder="Project Name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50" />
              <textarea rows={3} placeholder="Project Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required className="glass w-full resize-none rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50" />
              <input type="url" placeholder="Live View URL (optional)" value={form.live_url} onChange={(e) => setForm({ ...form, live_url: e.target.value })} className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50" />
              <div>
                <label className="mb-2 block text-xs text-zinc-500">Project Images</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.images.map((url, i) => (
                    <div key={i} className="relative h-20 w-28 overflow-hidden rounded-xl">
                      <Image src={url} alt="" fill className="object-cover" unoptimized />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white text-xs"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
                <label className="glass flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-6 text-sm text-zinc-500 transition-all glass-hover">
                  <Upload className="h-5 w-5" />
                  <span>{uploading ? "Uploading..." : "Click to upload images"}</span>
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleUpload} />
                </label>
              </div>
              <input type="text" placeholder="Tech Stack (comma separated)" value={form.tech_stack} onChange={(e) => setForm({ ...form, tech_stack: e.target.value })} className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50" />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50">{saving ? "Saving..." : editing ? "Save Changes" : "Save Project"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
