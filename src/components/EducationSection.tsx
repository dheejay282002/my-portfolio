"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Calendar } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

interface Education {
  id: number;
  school_name: string;
  degree: string;
  field_of_study: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
}

const parseDate = (value?: string) => {
  if (!value) return 0;
  const t = Date.parse(value);
  return isNaN(t) ? 0 : t;
};

export default function EducationSection() {
  const [items, setItems] = useState<Education[]>([]);

  useEffect(() => {
    fetch("/api/educations", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.educations || []))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  const sorted = [...items].sort((a, b) => parseDate(b.start_date) - parseDate(a.start_date));

  const dateLabel = (e: Education) => {
    const start = e.start_date || "";
    const end = e.is_current ? "Present" : e.end_date || "";
    if (!start && !end) return "";
    return `${start} – ${end}`;
  };

  return (
    <section id="education" className="border-t border-white/5 px-6 py-24">
      <ScrollReveal className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Educational{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Background
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            Schools, degrees, and qualifications that shaped my journey.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl space-y-4">
          {sorted.map((e, i) => (
            <ScrollReveal key={e.id} delay={i * 100}>
              <div className="glass flex flex-col gap-4 rounded-2xl p-6 transition-all glass-hover sm:flex-row sm:items-start">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
                  <GraduationCap className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-white">{e.school_name}</h3>
                    {dateLabel(e) && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
                        <Calendar className="h-3 w-3 text-cyan-400" />
                        {dateLabel(e)}
                      </span>
                    )}
                  </div>
                  {(e.degree || e.field_of_study) && (
                    <p className="mt-1 text-sm font-medium text-cyan-400">
                      {[e.degree, e.field_of_study].filter(Boolean).join(" — ")}
                    </p>
                  )}
                  {e.location && <p className="mt-0.5 text-xs text-zinc-500">{e.location}</p>}
                  {e.description && (
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">{e.description}</p>
                  )}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
