"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Terminal, Database, Globe, Layout, Shield, Cpu } from "lucide-react";

const iconOptions = ["Terminal", "Database", "Globe", "Layout", "Shield", "Cpu"];
const categoryOptions = ["Languages", "Frameworks", "Databases & Tools", "Frontend", "Other"];

interface Skill {
  id: number;
  name: string;
  category: string;
  icon: string;
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [form, setForm] = useState({ name: "", category: "Other", icon: "Terminal" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((d) => setSkills(d.skills));
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", category: "Other", icon: "Terminal" });
    setShowModal(true);
  };

  const openEdit = (s: Skill) => {
    setEditing(s);
    setForm({ name: s.name, category: s.category, icon: s.icon });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await fetch(`/api/skills/id/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        setSkills((p) =>
          p.map((s) => (s.id === editing.id ? { ...s, ...form } : s))
        );
      } else {
        const res = await fetch("/api/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        setSkills((p) => [...p, { id: data.id, ...form }]);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this skill?")) return;
    const res = await fetch(`/api/skills/id/${id}`, { method: "DELETE" });
    if (res.ok) setSkills((p) => p.filter((s) => s.id !== id));
  };

  const iconMap: Record<string, React.ElementType> = {
    Terminal, Database, Globe, Layout, Shield, Cpu,
  };

  const grouped = skills.reduce<Record<string, Skill[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  return (
    <div className="px-6 py-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Skills</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage the skills displayed on your portfolio.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Skill
        </button>
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {Object.keys(grouped).length === 0 ? (
          <div className="col-span-full py-16 text-center text-zinc-500">
            No skills yet. Add your first skill.
          </div>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">{category}</h3>
              <div className="mt-3 space-y-2">
                {items.map((s) => {
                  const Icon = iconMap[s.icon] || Terminal;
                  return (
                    <div key={s.id} className="glass flex items-center gap-3 rounded-xl px-4 py-3 transition-all glass-hover group">
                      <Icon className="h-4 w-4 text-cyan-400" />
                      <span className="flex-1 text-sm text-zinc-300">{s.name}</span>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => openEdit(s)} className="rounded p-1 text-zinc-500 transition-colors hover:text-cyan-400">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="rounded p-1 text-zinc-500 transition-colors hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass w-full max-w-lg rounded-2xl p-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editing ? "Edit Skill" : "Add Skill"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 transition-colors hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <input type="text" placeholder="Skill Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50" />
              <div>
                <label className="mb-2 block text-xs text-zinc-500">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="glass w-full rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50">
                  {categoryOptions.map((c) => (
                    <option key={c} value={c} className="bg-zinc-900">{c}</option>
                  ))}
                </select>
              </div>
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
