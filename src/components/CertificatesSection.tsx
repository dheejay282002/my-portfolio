"use client";

import { useEffect, useState, useRef } from "react";
import ScrollReveal from "./ScrollReveal";

interface Certificate {
  id: number;
  recipient_name: string;
  course_title: string;
  description: string;
  issued_date: string;
  issuer_name: string;
  badge_image_url: string;
  certificate_url: string;
  credly_badge_id: string;
  credly_host: string;
}

export default function CertificatesSection() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/certificates/public", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCerts(d.certificates || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (certs.length === 0) return;
    const hasCredly = certs.some((c) => c.credly_badge_id);
    if (!hasCredly) return;

    const scriptId = "credly-embed-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "//cdn.credly.com/assets/utilities/embed.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [certs]);

  if (certs.length === 0) return null;

  return (
    <section ref={sectionRef} id="certificates" className="border-t border-white/5 px-6 py-24">
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
          {certs.map((c) => (
            <ScrollReveal key={c.id} delay={certs.indexOf(c) * 100}>
              {c.credly_badge_id ? (
                <div
                  data-iframe-width="270"
                  data-iframe-height="320"
                  data-share-badge-id={c.credly_badge_id}
                  data-share-badge-host={c.credly_host || "https://www.credly.com"}
                />
              ) : (
                <a
                  href={`/certificates/${c.certificate_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block glass rounded-2xl p-6 transition-all duration-300 glass-hover"
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
                </a>
              )}
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
