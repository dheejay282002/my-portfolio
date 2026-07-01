"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Save, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function ProfileForm() {
  const router = useRouter();
  const [user, setUser] = useState<{
    id: number;
    name: string;
    email: string;
    role: string;
    last_name: string;
    profile_photo: string;
    bio: string;
    github_url?: string;
    linkedin_url?: string;
    twitter_url?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    last_name: "",
    bio: "",
    profile_photo: "",
    github_url: "",
    linkedin_url: "",
    twitter_url: "",
    email: "",
    current_password: "",
    password: "",
    confirm_password: "",
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.user) router.push("/login");
        else {
          setUser(d.user);
          setForm({
            name: d.user.name || "",
            last_name: d.user.last_name || "",
            bio: d.user.bio || "",
            profile_photo: d.user.profile_photo || "",
            github_url: d.user.github_url || "",
            linkedin_url: d.user.linkedin_url || "",
            twitter_url: d.user.twitter_url || "",
            email: d.user.email || "",
            current_password: "",
            password: "",
            confirm_password: "",
          });
          setLoading(false);
        }
      });
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirm_password) {
      setMessage("Passwords do not match");
      return;
    }
    if (form.password && !form.current_password) {
      setMessage("Current password is required to set a new password");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          last_name: form.last_name,
          bio: form.bio,
          profile_photo: form.profile_photo,
          github_url: form.github_url,
          linkedin_url: form.linkedin_url,
          twitter_url: form.twitter_url,
          email: user?.role === "admin" ? form.email : undefined,
          current_password: form.password ? form.current_password : undefined,
          password: form.password ? form.password : undefined,
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        if (data.user) {
          setUser(data.user);
          setForm((f) => ({
            ...f,
            email: data.user.email || "",
            current_password: "",
            password: "",
            confirm_password: "",
          }));
          router.refresh();
        }
        setMessage("Profile updated!");
      } else {
        setMessage(data.error || "Failed to update profile");
      }
    } catch {
      setMessage("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Update your personal information. Email cannot be changed.
        </p>

        <form onSubmit={handleSave} className="mt-10 space-y-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative h-24 w-24 shrink-0">
              {form.profile_photo ? (
                <>
                  <Image
                    src={form.profile_photo}
                    alt="Profile"
                    fill
                    className="rounded-full object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, profile_photo: "" })}
                    className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white text-xs"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full glass text-3xl font-bold text-cyan-400">
                  {form.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            <label className="glass flex cursor-pointer items-center gap-2 rounded-xl px-5 py-3 text-sm text-zinc-400 transition-all glass-hover">
              <Upload className="h-4 w-4" />
              <span>{uploading ? "Uploading..." : "Change Photo"}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  const fd = new FormData();
                  fd.append("file", file);
                  try {
                    const res = await fetch("/api/upload", { method: "POST", body: fd });
                    const data = await res.json();
                    if (res.ok) setForm({ ...form, profile_photo: data.url });
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </label>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs text-zinc-500">First Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs text-zinc-500">Last Name</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs text-zinc-500">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={user?.role !== "admin"}
              className={`glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 ${
                user?.role !== "admin" ? "text-zinc-600 cursor-not-allowed" : ""
              }`}
            />
            {user?.role !== "admin" && (
              <p className="mt-1 text-[10px] text-zinc-500">Email cannot be changed.</p>
            )}
          </div>

          <div className="space-y-5 border-t border-white/5 pt-6">
            <h3 className="text-sm font-semibold text-zinc-300">Change Password</h3>
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs text-zinc-500">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={form.current_password}
                    onChange={(e) => setForm({ ...form, current_password: e.target.value })}
                    placeholder="••••••••"
                    className="glass w-full rounded-xl pl-4 pr-11 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs text-zinc-500">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="glass w-full rounded-xl pl-4 pr-11 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs text-zinc-500">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirm_password}
                    onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                    placeholder="••••••••"
                    className="glass w-full rounded-xl pl-4 pr-11 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs text-zinc-500">About Me</label>
            <textarea
              rows={4}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Write about yourself — this will appear on the homepage About section..."
              className="glass w-full resize-none rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
            />
          </div>

          {user?.role === "admin" && (
            <div className="space-y-6 border-t border-white/5 pt-6">
              <h3 className="text-sm font-semibold text-zinc-300">Social Links (Public Portfolio)</h3>
              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-xs text-zinc-500">GitHub Link</label>
                  <input
                    type="url"
                    value={form.github_url}
                    onChange={(e) => setForm({ ...form, github_url: e.target.value })}
                    placeholder="https://github.com/..."
                    className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs text-zinc-500">LinkedIn Link</label>
                  <input
                    type="url"
                    value={form.linkedin_url}
                    onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                    className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs text-zinc-500">Facebook Link</label>
                  <input
                    type="url"
                    value={form.twitter_url}
                    onChange={(e) => setForm({ ...form, twitter_url: e.target.value })}
                    placeholder="https://facebook.com/..."
                    className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
            </div>
          )}

          {message && (
            <p className={`text-sm ${message.includes("updated") ? "text-green-400" : "text-red-400"}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
