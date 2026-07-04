"use client";

import { useEffect, useState } from "react";
import Skeleton from "@/components/Skeleton";
import { Eye, Trash2, X } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  oauth_provider?: string | null;
  avatar_url?: string | null;
  profile_photo?: string | null;
  bio?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = () => {
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((d) => { setUsers(d.users); setLoading(false); });
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleView = async (id: number) => {
    setViewLoading(true);
    setViewUser(null);
    try {
      const res = await fetch(`/api/users/${id}`);
      const data = await res.json();
      setViewUser(data.user);
    } catch {}
    setViewLoading(false);
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setDeleteConfirm(null);
      }
    } catch {}
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="px-6 py-24">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-1 h-4 w-72" />
        <div className="mt-8 overflow-x-auto">
          <div className="glass w-full rounded-2xl p-5 space-y-4">
            <div className="flex gap-8 border-b border-white/5 pb-4">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-8">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-24">
      <h1 className="text-2xl font-bold text-white">User Management</h1>
      <p className="mt-1 text-sm text-zinc-400">
        View all registered users and their roles.
      </p>

      <div className="mt-8 overflow-x-auto">
        <table className="glass w-full rounded-2xl text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-zinc-500">
              <th className="px-5 py-3 font-medium">ID</th>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Joined</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-zinc-500">
                  No users registered yet
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-white/5 text-white last:border-0"
                >
                  <td className="px-5 py-3.5 text-zinc-400">{u.id}</td>
                  <td className="px-5 py-3.5">{u.name}</td>
                  <td className="px-5 py-3.5 text-zinc-400">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-cyan-500/10 text-cyan-400"
                          : "bg-zinc-500/10 text-zinc-400"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(u.id)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-cyan-400 transition-colors"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(u.id)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View User Modal */}
      {(viewUser || viewLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setViewUser(null); setViewLoading(false); }}>
          <div className="glass-strong mx-4 w-full max-w-lg rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">User Details</h2>
              <button onClick={() => { setViewUser(null); setViewLoading(false); }} className="text-zinc-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            {viewLoading && !viewUser && (
              <div className="space-y-4">
                <Skeleton className="h-20 w-20 rounded-full mx-auto" />
                <Skeleton className="h-5 w-48 mx-auto" />
                <Skeleton className="h-4 w-64 mx-auto" />
              </div>
            )}
            {viewUser && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3">
                  {viewUser.avatar_url || viewUser.profile_photo ? (
                    <img src={viewUser.avatar_url || viewUser.profile_photo || ""} alt={viewUser.name} className="h-20 w-20 rounded-full object-cover border-2 border-white/10" />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white">
                      {viewUser.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-white font-semibold text-lg">{viewUser.name}</h3>
                    <p className="text-zinc-400 text-sm">{viewUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="glass rounded-xl p-3">
                    <p className="text-xs text-zinc-500 mb-1">Role</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      viewUser.role === "admin" ? "bg-cyan-500/10 text-cyan-400" : "bg-zinc-500/10 text-zinc-400"
                    }`}>{viewUser.role}</span>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <p className="text-xs text-zinc-500 mb-1">Joined</p>
                    <p className="text-sm text-white">{new Date(viewUser.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <p className="text-xs text-zinc-500 mb-1">Auth Provider</p>
                    <p className="text-sm text-white">{viewUser.oauth_provider || "Email/Password"}</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <p className="text-xs text-zinc-500 mb-1">User ID</p>
                    <p className="text-sm text-white">#{viewUser.id}</p>
                  </div>
                </div>
                {viewUser.bio && (
                  <div className="glass rounded-xl p-3">
                    <p className="text-xs text-zinc-500 mb-1">Bio</p>
                    <p className="text-sm text-white">{viewUser.bio}</p>
                  </div>
                )}
                {(viewUser.github_url || viewUser.linkedin_url || viewUser.twitter_url) && (
                  <div className="glass rounded-xl p-3">
                    <p className="text-xs text-zinc-500 mb-1">Social Links</p>
                    <div className="flex flex-col gap-1 mt-1">
                      {viewUser.github_url && <a href={viewUser.github_url} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:underline">{viewUser.github_url}</a>}
                      {viewUser.linkedin_url && <a href={viewUser.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:underline">{viewUser.linkedin_url}</a>}
                      {viewUser.twitter_url && <a href={viewUser.twitter_url} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:underline">{viewUser.twitter_url}</a>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="glass-strong mx-4 w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Delete User?</h3>
            <p className="mt-2 text-sm text-zinc-400">
              This action cannot be undone. The user will lose access to their account.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
