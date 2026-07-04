"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Save, Eye, EyeOff, Lock, CheckCircle, PenLine, ImageIcon } from "lucide-react";
import Image from "next/image";
import Skeleton from "@/components/Skeleton";
import SignaturePad from "@/components/SignaturePad";
import { removeSignatureBackground } from "@/lib/removeBg";

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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    last_name: "",
    bio: "",
    profile_photo: "",
    github_url: "",
    linkedin_url: "",
    twitter_url: "",
    email: "",
    admin_signature_url: "",
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
            admin_signature_url: d.user.admin_signature_url || "",
          });
          setLoading(false);
        }
      });
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
          admin_signature_url: form.admin_signature_url || undefined,
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        if (data.user) {
          setUser(data.user);
          setForm((f) => ({ ...f, email: data.user.email || "" }));
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

  if (loading) {
    return (
      <div className="px-6 py-10">
        <div className="mx-auto max-w-2xl space-y-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Skeleton className="h-24 w-24 shrink-0 rounded-full" />
            <Skeleton className="h-11 w-36 rounded-xl" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <Skeleton className="h-[60px] w-full rounded-xl" />
            <Skeleton className="h-[60px] w-full rounded-xl" />
          </div>
          <Skeleton className="h-[60px] w-full rounded-xl" />
          <div className="border-t border-white/5 pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-10 w-40 rounded-xl" />
            </div>
          </div>
          <Skeleton className="h-[120px] w-full rounded-xl" />
          <div className="border-t border-white/5 pt-6 space-y-6">
            <Skeleton className="h-4 w-32" />
            <div className="grid gap-6 sm:grid-cols-3">
              <Skeleton className="h-[60px] w-full rounded-xl" />
              <Skeleton className="h-[60px] w-full rounded-xl" />
              <Skeleton className="h-[60px] w-full rounded-xl" />
            </div>
          </div>
          <Skeleton className="h-11 w-40 rounded-xl" />
        </div>
      </div>
    );
  }

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

          <div className="border-t border-white/5 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-300">Password</h3>
                <p className="mt-0.5 text-xs text-zinc-500">Change your account password</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Lock className="h-3.5 w-3.5" />
                Change Password
              </button>
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

              <div className="border-t border-white/5 pt-6">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-zinc-300">Signature for Contracts</h3>
                  <button
                    type="button"
                    onClick={() => setShowSignatureModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/20 px-4 py-2 text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30"
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    {form.admin_signature_url ? "Change Signature" : "Set Signature"}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 mb-3">This signature will appear on all project agreement contracts.</p>
                {form.admin_signature_url && (
                  <div className="inline-block rounded-xl border border-white/5 bg-white p-2">
                    <img src={form.admin_signature_url} alt="Admin signature" className="h-12 w-auto max-w-[180px] object-contain" />
                  </div>
                )}
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

        {/* ── Change Password Modal ── */}
          {showPasswordModal && (
            <ChangePasswordModal
              onClose={() => setShowPasswordModal(false)}
            />
          )}

          {showSignatureModal && (
            <SignatureModal
              currentSignature={form.admin_signature_url}
              onSave={(dataUrl) => {
                setForm({ ...form, admin_signature_url: dataUrl });
                setShowSignatureModal(false);
              }}
              onClose={() => setShowSignatureModal(false)}
            />
          )}
      </div>
    </div>
  );
}

function SignatureModal({ currentSignature, onSave, onClose }: { currentSignature: string; onSave: (dataUrl: string) => void; onClose: () => void }) {
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const [drawnDataUrl, setDrawnDataUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Image must be under 2MB."); return; }
    setUploading(true);
    setError("");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      const cleaned = await removeSignatureBackground(dataUrl);
      setUploadedUrl(cleaned);
    } catch { setError("Failed to process image."); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    let finalUrl = mode === "draw" ? drawnDataUrl : uploadedUrl;
    if (!finalUrl) { setError("Please provide a signature first."); return; }
    if (mode === "draw") {
      finalUrl = await removeSignatureBackground(finalUrl);
      setDrawnDataUrl(finalUrl);
    }
    onSave(finalUrl);
  };

  const previewUrl = mode === "draw" ? drawnDataUrl : uploadedUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div className="glass-strong w-full max-w-lg rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Signature for Contracts</h3>
          <button onClick={onClose} className="text-zinc-500 transition-colors hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode("draw")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              mode === "draw" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-white/5 text-zinc-400 border border-transparent hover:bg-white/10"
            }`}
          >
            <PenLine className="h-3.5 w-3.5" /> Draw Signature
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              mode === "upload" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-white/5 text-zinc-400 border border-transparent hover:bg-white/10"
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" /> Upload Image
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">{error}</div>
        )}

        {/* Draw Mode */}
        {mode === "draw" && (
          <SignaturePad
            onSave={setDrawnDataUrl}
            defaultImage={currentSignature}
            label="Draw your signature below"
          />
        )}

        {/* Upload Mode */}
        {mode === "upload" && (
          <div className="rounded-xl border border-white/5 bg-zinc-950/40 p-4 space-y-3">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Upload Signature Image</p>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 p-6 text-xs text-zinc-400 hover:border-cyan-500/30 transition-colors">
              <Upload className="h-5 w-5" />
              <span>{uploading ? "Uploading..." : "Click to upload signature image (PNG, JPG)"}</span>
              <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleUpload} />
            </label>
          </div>
        )}

        {/* Preview */}
        {previewUrl && (
          <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-center">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Preview</p>
            <div className="inline-block rounded-lg border border-white/5 bg-white p-2">
              <img src={previewUrl} alt="Signature preview" className="h-14 w-auto max-w-[200px] object-contain" />
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6 border-t border-white/5 pt-4">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={(mode === "draw" && !drawnDataUrl) || (mode === "upload" && !uploadedUrl)}
            className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Signature
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"verify" | "change">("verify");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleVerify = async () => {
    if (!currentPassword) {
      setError("Enter your current password");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/auth/profile/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword }),
      });
      const data = await res.json();
      if (data.valid) {
        setStep("change");
      } else {
        setError(data.error || "Current password is incorrect");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!newPassword) {
      setError("Enter a new password");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onClose();
      } else {
        setError(data.error || "Failed to update password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div
        className="glass-strong w-full max-w-md rounded-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white">
            {step === "verify" ? "Verify Current Password" : "Set New Password"}
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-500 transition-colors hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "verify" ? (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs text-zinc-500">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleVerify(); } }}
                  placeholder="Enter your current password"
                  className="glass w-full rounded-xl pl-4 pr-11 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="button"
              disabled={verifying}
              onClick={handleVerify}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {verifying ? (
                <Skeleton className="h-4 w-4 rounded-full" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {verifying ? "Verifying..." : "Verify"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl bg-green-500/10 px-4 py-3">
              <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
              <p className="text-xs text-green-400">Current password verified</p>
            </div>
            <div>
              <label className="mb-2 block text-xs text-zinc-500">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="glass w-full rounded-xl pl-4 pr-11 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs text-zinc-500">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="glass w-full rounded-xl pl-4 pr-11 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep("verify"); setError(""); }}
                className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-medium text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save New Password"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
