"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Code2, Shield, Server, Globe, Database, GitBranch, Smartphone, Palette, Cloud, Braces, Layers, Rocket } from "lucide-react";
import Skeleton from "@/components/Skeleton";

const iconOptions = ["Code2", "Shield", "Server", "Globe", "Database", "GitBranch", "Smartphone", "Palette", "Cloud", "Braces", "Layers", "Rocket"];

interface Service {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ title: "", description: "", best_for: "", icon: "Code2" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => { setServices(d.services); setLoading(false); });
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", description: "", best_for: "", icon: "Code2" });
    setShowModal(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    const parts = s.description.split("|").map((p: string) => p.trim());
    const desc = parts[0]?.replace("What's Included: ", "") || s.description;
    const best = parts[1]?.replace("Best For: ", "") || "";
    setForm({ title: s.title, description: desc, best_for: best, icon: s.icon });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fullDesc = form.best_for
      ? `What's Included: ${form.description} | Best For: ${form.best_for}`
      : form.description;
    try {
      if (editing) {
        await fetch(`/api/services/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, description: fullDesc }),
        });
        setServices((p) =>
          p.map((s) => (s.id === editing.id ? { ...s, ...form, description: fullDesc } : s))
        );
      } else {
        const res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, description: fullDesc }),
        });
        const data = await res.json();
        setServices((p) => [...p, { id: data.id, ...form, description: fullDesc }]);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this service?")) return;
    const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
    if (res.ok) setServices((p) => p.filter((s) => s.id !== id));
  };

  const iconMap: Record<string, React.ElementType> = {
    Code2, Shield, Server, Globe, Database, GitBranch, Smartphone, Palette, Cloud, Braces, Layers, Rocket,
  };

  if (loading) {
    return (
      <div className="px-6 py-24">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex gap-1">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <Skeleton className="h-7 w-7 rounded-lg" />
                </div>
              </div>
              <Skeleton className="mt-4 h-5 w-3/4" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-1 h-4 w-1/2" />
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
          <h1 className="text-2xl font-bold text-white">Services</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage the services displayed on your portfolio.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.length === 0 ? (
          <div className="col-span-full py-16 text-center text-zinc-500">
            No services yet. Click "Add Service" to add one manually.
          </div>
        ) : (
          services.map((s) => {
            const Icon = iconMap[s.icon] || Code2;
            const parts = s.description.split("|").map((p: string) => p.trim());
            const desc = parts[0]?.replace("What's Included: ", "") || s.description;
            const bestFor = parts[1]?.replace("Best For: ", "") || "";
            return (
              <div key={s.id} className="glass rounded-2xl p-6 transition-all glass-hover">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
                    <Icon className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-cyan-400">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="mt-4 font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{desc}</p>
                {bestFor && (
                  <div className="mt-4 border-t border-white/5 pt-3">
                    <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Best For</h4>
                    <p className="mt-1 text-xs text-cyan-400/90">{bestFor}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass w-full max-w-lg rounded-2xl p-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editing ? "Edit Service" : "Add Service"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 transition-colors hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <input type="text" placeholder="Service Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50" />
              <textarea rows={3} placeholder="Service Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required className="glass w-full resize-none rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50" />
              <input type="text" placeholder="Best For (e.g., Startups, E-commerce, Portfolios)" value={form.best_for} onChange={(e) => setForm({ ...form, best_for: e.target.value })} required className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50" />
              <div>
                <label className="mb-2 block text-xs text-zinc-500">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((ic) => {
                    const Icon = iconMap[ic];
                    return (
                      <button key={ic} type="button" onClick={() => setForm({ ...form, icon: ic })} className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${form.icon === ic ? "bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/50" : "glass text-zinc-400 hover:text-white"}`}>
                        <Icon className="h-5 w-5" />
                      </button>
                    );
                  })}
                </div>
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
