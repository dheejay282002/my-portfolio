"use client";

import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((d) => setUsers(d.users));
  }, []);

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
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-zinc-500">
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
