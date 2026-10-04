"use client";

import { useEffect, useState } from "react";
import { X, BadgeCheck, ExternalLink } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

interface Certificate {
  id: number;
  recipient_name: string;
  course_title: string;
  description: string;
  issued_date: string;
  issuer_name: string;
  issuer_title: string;
  badge_image_url: string;
  certificate_image_url: string;
  certificate_url: string;
  verify_url?: string;
  category: string;
}

export default function CertificatesSection() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [selected, setSelected] = useState<Certificate | null>(null);

  useEffect(() => {
    fetch("/api/certificates/public", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCerts(d.certificates || []))
      .catch(() => {});
  }, []);

  if (certs.length === 0) return null;

  const isPdf = (url: string) => !!url && (url.toLowerCase().includes(".pdf") || url.toLowerCase().endsWith("/pdf"));
  const verifyUrl = selected
    ? selected.verify_url ||
      `${typeof window !== "undefined" ? window.location.origin : ""}/certificates/${selected.certificate_url}`
    : "";

  return (
    <section id="certificates" className="border-t border-white/5 px-6 py-24">
      <ScrollReveal className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Certificates{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              & Achievements
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            Verified credentials and professional certifications.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {certs.map((c, i) => (
            <ScrollReveal key={c.id} delay={i * 100}>
              <button
                onClick={() => setSelected(c)}
                className="w-full text-left glass rounded-2xl p-6 transition-all duration-300 glass-hover cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {c.badge_image_url ? (
                    <img src={c.badge_image_url} alt={c.course_title} className="h-16 w-16 rounded-xl object-contain" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-2xl">
                      🎓
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white break-words sm:truncate">{c.course_title}</h3>
                    <p className="mt-1 text-sm text-zinc-400">{c.recipient_name}</p>
                    {c.category && (
                      <span className="mt-2 inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-400">
                        {c.category}
                      </span>
                    )}
                    <p className="mt-1 text-xs text-zinc-500">
                      {new Date(c.issued_date).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              </button>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-4 sm:py-8" onClick={() => setSelected(null)}>
          <div className="glass-strong relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl shadow-2xl sm:max-h-[90vh] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <div className="relative overflow-y-auto flex-1">
              <button onClick={() => setSelected(null)} className="sticky float-right top-2 right-2 z-10 m-2 text-zinc-400 hover:text-white transition-colors bg-black/40 rounded-full p-1.5 backdrop-blur-sm">
                <X className="h-5 w-5" />
              </button>

              {selected.certificate_image_url && isPdf(selected.certificate_image_url) ? (
                <iframe
                  src={`/api/pdf-proxy?url=${encodeURIComponent(selected.certificate_image_url)}`}
                  className="w-full h-[50vh] sm:h-[65vh] bg-black"
                  title={selected.course_title}
                />
              ) : selected.certificate_image_url ? (
                <img src={selected.certificate_image_url} alt={selected.course_title} className="w-full h-auto max-h-[50vh] sm:max-h-[65vh] object-contain bg-black" />
              ) : selected.badge_image_url ? (
                <img src={selected.badge_image_url} alt={selected.course_title} className="w-full h-auto max-h-[50vh] sm:max-h-[65vh] object-contain bg-black" />
              ) : (
                <div className="w-full h-48 sm:h-64 flex items-center justify-center bg-gradient-to-br from-cyan-500/10 to-blue-600/10 text-5xl">
                  🎓
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-white/5 p-4 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-white">{selected.course_title}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{selected.recipient_name}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {new Date(selected.issued_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    {selected.issuer_name && <> &bull; Issued by {selected.issuer_name}</>}
                  </p>
                </div>
                {selected.category && (
                  <span className="shrink-0 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
                    {selected.category}
                  </span>
                )}
              </div>

              {verifyUrl && (
                <a
                  href={verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 transition-colors hover:bg-cyan-500/10"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verify Online
                    </p>
                    <p className="truncate text-xs text-zinc-400">{verifyUrl}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-cyan-400" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
