"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Briefcase, Calendar } from "lucide-react";
import Skeleton from "@/components/Skeleton";

interface WorkExperience {
  id: number;
  company_name: string;
  position: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
}

const emptyForm = {
  company_name: "",
  position: "",
  location: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
};

const inputCls = "glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50";

export default function WorkExperiencePage() {
  const [items, setItems] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<WorkExperience | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/work-experiences")
      .then((r) => r.json())
      .then((d) => { setItems(d.experiences || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item: WorkExperience) => {
    setEditing(item);
    setForm({
      company_name: item.company_name,
      position: item.position || "",
      location: item.location || "",
      start_date: item.start_date || "",
      end_date: item.end_date || "",
      is_current: !!item.is_current,
      description: item.description || "",
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/work-experiences/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) setItems((p) => p.map((s) => (s.id === editing.id ? { ...s, ...form } : s)));
      } else {
        const res = await fetch("/api/work-experiences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (res.ok) setItems((p) => [...p, { id: data.id, ...form }]);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this work experience?")) return;
    const res = await fetch(`/api/work-experiences/${id}`, { method: "DELETE" });
    if (res.ok) setItems((p) => p.filter((s) => s.id !== id));
  };

  const dateLabel = (e: WorkExperience) => {
    const start = e.start_date || "";
    const end = e.is_current ? "Present" : e.end_date || "";
    if (!start && !end) return "";
    return `${start} – ${end}`;
  };

  if (loading) {
    return (
      <div className="px-6 py-24">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-11 w-44 rounded-xl" />
        </div>
        <div className="mt-8 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Work Experience</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage the roles and jobs displayed in your portfolio timeline.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Experience
        </button>
      </div>

      <div className="mt-8 space-y-3">
        {items.length === 0 ? (
          <div className="py-16 text-center text-zinc-500">
            No work experience yet. Click &quot;Add Experience&quot; to create one.
          </div>
        ) : (
          items.map((e) => (
            <div key={e.id} className="glass flex items-start gap-4 rounded-2xl p-5 transition-all glass-hover group">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
                <Briefcase className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="font-semibold text-white">{e.position}</h3>
                  {dateLabel(e) && (
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                      <Calendar className="h-3 w-3" />
                      {dateLabel(e)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-cyan-400">
                  {e.company_name}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
                {e.description && <p className="mt-2 text-sm leading-relaxed text-zinc-400">{e.description}</p>}
              </div>
              <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => openEdit(e)} className="rounded p-1.5 text-zinc-500 transition-colors hover:text-cyan-400" title="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(e.id)} className="rounded p-1.5 text-zinc-500 transition-colors hover:text-red-400" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editing ? "Edit Work Experience" : "Add Work Experience"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 transition-colors hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Company Name *" value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })} required className={inputCls} />
                <input type="text" placeholder="Position / Job Title *" value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })} required className={inputCls} />
              </div>
              <input type="text" placeholder="Location (optional)" value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Start Date (e.g. Jan 2021)" value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={inputCls} />
                <input type="text" placeholder="End Date (e.g. Dec 2023)" value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })} disabled={form.is_current}
                  className={`${inputCls} disabled:opacity-40`} />
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-4 py-3">
                <input type="checkbox" checked={form.is_current}
                  onChange={(e) => setForm({ ...form, is_current: e.target.checked })}
                  className="h-4 w-4 accent-cyan-500" />
                <span className="text-sm text-zinc-300">I currently work here (show as Present)</span>
              </label>
              <textarea rows={3} placeholder="Responsibilities / highlights (optional)" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={`${inputCls} resize-none`} />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white">Cancel</button>
                <button type="submit" disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
