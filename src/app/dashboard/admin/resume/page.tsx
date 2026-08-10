"use client";

import { useEffect, useState } from "react";
import { Upload, Trash2, FileText, Image as ImageIcon } from "lucide-react";

interface Resume {
  id: number;
  file_url: string;
  file_type: string;
  file_name: string;
  updated_at: string;
}

export default function AdminResumePage() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/resume")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setResume(d?.resume ?? null);
        setLoading(false);
      });
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (data.url) {
        setSaving(true);
        await fetch("/api/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_url: data.url,
            file_type: file.type,
            file_name: file.name,
          }),
        });
        const updated = await fetch("/api/resume").then((r) => r.json());
        setResume(updated.resume);
        setSaving(false);
      }
    } catch {}
    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your resume?")) return;
    try {
      await fetch("/api/resume", { method: "DELETE" });
      setResume(null);
    } catch {}
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-white/5" />
          <div className="h-64 rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  const isPdf = resume?.file_type === "application/pdf";
  const isImage = resume?.file_type?.startsWith("image/");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white">Resume Management</h1>
      <p className="mt-1 text-sm text-zinc-400">Upload and manage your resume. Accepted formats: PDF, PNG, JPG, GIF, WEBP.</p>

      <div className="mt-6">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-400 transition-colors hover:border-white/20 hover:text-white">
          {uploading || saving ? "Uploading..." : "Upload Resume"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,.pdf"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading || saving}
          />
        </label>
      </div>

      {resume && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPdf ? (
                <FileText className="h-5 w-5 text-red-400" />
              ) : (
                <ImageIcon className="h-5 w-5 text-cyan-400" />
              )}
              <div>
                <p className="text-sm font-medium text-white">{resume.file_name}</p>
                <p className="text-xs text-zinc-500">
                  Updated {new Date(resume.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
            <button
              onClick={handleDelete}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:text-red-400"
              title="Delete Resume"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-2">
            <p className="mb-2 text-xs text-zinc-500">Preview</p>
            {isPdf ? (
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(resume.file_url)}&embedded=true`}
                className="w-full h-[700px] rounded-xl border border-white/10"
                title="Resume Preview"
              />
            ) : isImage ? (
              <img
                src={resume.file_url}
                alt="Resume Preview"
                className="w-full max-h-[600px] rounded-xl object-contain border border-white/10"
              />
            ) : null}
          </div>
        </div>
      )}

      {!resume && (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16">
          <Upload className="h-10 w-10 text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-500">No resume uploaded yet</p>
        </div>
      )}
    </div>
  );
}
