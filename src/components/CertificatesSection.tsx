"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
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
  certificate_url: string;
  credly_badge_id: string;
  credly_host: string;
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

  useEffect(() => {
    if (!selected?.credly_badge_id) return;
    const id = `credly-modal-${selected.id}`;
    const existing = document.getElementById(id);
    if (existing) return;

    const container = document.getElementById("credly-modal-container");
    if (!container) return;

    const div = document.createElement("div");
    div.id = id;
    div.setAttribute("data-iframe-width", "270");
    div.setAttribute("data-iframe-height", "320");
    div.setAttribute("data-share-badge-id", selected.credly_badge_id);
    div.setAttribute("data-share-badge-host", selected.credly_host || "https://www.credly.com");
    container.appendChild(div);

    if (!document.getElementById("credly-embed-script")) {
      const script = document.createElement("script");
      script.id = "credly-embed-script";
      script.src = "//cdn.credly.com/assets/utilities/embed.js";
      script.async = true;
      document.body.appendChild(script);
    } else if ((window as any).Credly) {
      (window as any).Credly.embed();
    }

    return () => {
      container.innerHTML = "";
    };
  }, [selected]);

  if (certs.length === 0) return null;

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

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {certs.map((c, i) => (
            <ScrollReveal key={c.id} delay={i * 100}>
              <button
                onClick={() => setSelected(c)}
                className="w-full text-left glass rounded-2xl p-6 transition-all duration-300 glass-hover cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {c.badge_image_url ? (
                    <img src={c.badge_image_url} alt={c.course_title} className="h-16 w-16 rounded-xl object-cover border border-white/10" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-2xl">
                      🎓
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{c.course_title}</h3>
                    <p className="mt-1 text-sm text-zinc-400">{c.recipient_name}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {new Date(c.issued_date).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
                {c.description && (
                  <p className="mt-4 text-sm leading-relaxed text-zinc-400 line-clamp-2">{c.description}</p>
                )}
              </button>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setSelected(null)}>
          <div className="glass-strong relative w-full max-w-2xl rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute right-4 top-4 text-zinc-400 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-semibold text-white pr-8">{selected.course_title}</h3>
            <p className="mt-1 text-sm text-zinc-400">{selected.recipient_name}</p>

            <div className="mt-6 flex justify-center">
              {selected.credly_badge_id ? (
                <div id="credly-modal-container" className="min-h-[320px] flex items-center justify-center" />
              ) : (
                <div className="w-full">
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8 text-center">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400/70">
                      Certificate of Completion
                    </div>
                    <div className="mx-auto my-4 h-px w-32 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                    <p className="text-sm text-zinc-400">This is to certify that</p>
                    <h1 className="mt-2 text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                      {selected.recipient_name}
                    </h1>
                    <p className="mt-3 text-sm text-zinc-400">has successfully completed</p>
                    <h2 className="mt-1 text-lg font-semibold text-white">{selected.course_title}</h2>
                    {selected.description && (
                      <p className="mt-3 max-w-sm mx-auto text-sm text-zinc-400">{selected.description}</p>
                    )}
                    {selected.badge_image_url && (
                      <div className="mt-4 flex justify-center">
                        <img src={selected.badge_image_url} alt="Badge" className="h-16 w-16 object-contain" />
                      </div>
                    )}
                    <div className="mx-auto my-4 h-px w-32 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                    <p className="text-xs text-zinc-500">
                      Date: {new Date(selected.issued_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      {selected.issuer_name && <> &bull; Issued by {selected.issuer_name}</>}
                    </p>
                    <p className="mt-3 text-[10px] text-zinc-600">Verification ID: {selected.certificate_url}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
