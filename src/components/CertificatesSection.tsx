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
  certificate_image_url: string;
  certificate_url: string;
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
                    <img src={c.badge_image_url} alt={c.course_title} className="h-16 w-16 rounded-xl object-contain" />
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
              </button>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-8" onClick={() => setSelected(null)}>
          <div className="glass-strong relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute right-4 top-4 z-10 text-zinc-400 hover:text-white transition-colors bg-black/40 rounded-full p-1.5 backdrop-blur-sm">
              <X className="h-5 w-5" />
            </button>

            {selected.certificate_image_url ? (
              <img src={selected.certificate_image_url} alt={selected.course_title} className="w-full max-h-[75vh] object-contain bg-black" />
            ) : selected.badge_image_url ? (
              <img src={selected.badge_image_url} alt={selected.course_title} className="w-full max-h-[75vh] object-contain bg-black" />
            ) : (
              <div className="w-full h-64 flex items-center justify-center bg-gradient-to-br from-cyan-500/10 to-blue-600/10 text-5xl">
                🎓
              </div>
            )}

            <div className="p-6 border-t border-white/5">
              <h3 className="text-lg font-semibold text-white">{selected.course_title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{selected.recipient_name}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {new Date(selected.issued_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                {selected.issuer_name && <> &bull; Issued by {selected.issuer_name}</>}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
