"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, ShoppingBag, Clock, DollarSign, ListTodo } from "lucide-react";
import Skeleton from "@/components/Skeleton";

interface Product {
  id: number;
  package_tier: string;
  project_baseline: string;
  est_timeline: string;
  deliverables: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    package_tier: "",
    project_baseline: "",
    est_timeline: "",
    deliverables: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products || []);
        setLoading(false);
      });
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({
      package_tier: "",
      project_baseline: "",
      est_timeline: "",
      deliverables: "",
    });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      package_tier: p.package_tier,
      project_baseline: p.project_baseline,
      est_timeline: p.est_timeline,
      deliverables: p.deliverables,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await fetch(`/api/products/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        setProducts((p) =>
          p.map((prod) => (prod.id === editing.id ? { ...prod, ...form } : prod))
        );
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        setProducts((p) => [...p, { id: data.id, ...form }]);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product package?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) setProducts((p) => p.filter((prod) => prod.id !== id));
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
          {Array.from({ length: 3 }).map((_, i) => (
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
          <h1 className="text-2xl font-bold text-white">Products / Packages</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage your service package tiers displayed under "What I Offer" on the homepage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.length === 0 ? (
          <div className="col-span-full py-16 text-center text-zinc-500">
            No products/packages configured yet. Click "Add Product" to create one.
          </div>
        ) : (
          products.map((p) => {
            const items = p.deliverables.split("\n").filter(Boolean);
            return (
              <div key={p.id} className="glass rounded-2xl p-6 transition-all glass-hover flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
                      <ShoppingBag className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-cyan-400">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">{p.package_tier}</h3>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <DollarSign className="h-4 w-4 text-cyan-400/80" />
                      <span className="text-sm font-semibold text-white">{p.project_baseline}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Clock className="h-4 w-4 text-cyan-400/80" />
                      <span className="text-sm">{p.est_timeline}</span>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-white/5 pt-4">
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ListTodo className="h-3.5 w-3.5" />
                      Deliverables & Features
                    </h4>
                    <ul className="space-y-1.5">
                      {items.slice(0, 4).map((item, idx) => (
                        <li key={idx} className="text-xs text-zinc-400 list-disc list-inside truncate">
                          {item}
                        </li>
                      ))}
                      {items.length > 4 && (
                        <li className="text-[10px] text-cyan-400/80 font-medium pl-4">
                          + {items.length - 4} more deliverables
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
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
                {editing ? "Edit Product Package" : "Add Product Package"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 transition-colors hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Package Tier</label>
                <input
                  type="text"
                  placeholder="e.g. 01. Basic Pack (MVP)"
                  value={form.package_tier}
                  onChange={(e) => setForm({ ...form, package_tier: e.target.value })}
                  required
                  className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Project Baseline (Price)</label>
                  <input
                    type="text"
                    placeholder="e.g. $800 - $1,800"
                    value={form.project_baseline}
                    onChange={(e) => setForm({ ...form, project_baseline: e.target.value })}
                    required
                    className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Est. Timeline</label>
                  <input
                    type="text"
                    placeholder="e.g. 2 Weeks"
                    value={form.est_timeline}
                    onChange={(e) => setForm({ ...form, est_timeline: e.target.value })}
                    required
                    className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Key Deliverables & Included Features</label>
                <textarea
                  rows={5}
                  placeholder="Enter features (one per line)&#10;e.g.&#10;Light dynamic websites&#10;Clean responsive design&#10;Contact / lead forms"
                  value={form.deliverables}
                  onChange={(e) => setForm({ ...form, deliverables: e.target.value })}
                  required
                  className="glass w-full resize-none rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50">
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
