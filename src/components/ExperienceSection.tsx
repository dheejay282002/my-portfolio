"use client";

import { useEffect, useState } from "react";
import { Briefcase, Calendar } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

interface WorkExperience {
  id: number;
  company_name: string;
  position: string;
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

export default function ExperienceSection() {
  const [items, setItems] = useState<WorkExperience[]>([]);

  useEffect(() => {
    fetch("/api/work-experiences", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.experiences || []))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  const sorted = [...items].sort((a, b) => parseDate(b.start_date) - parseDate(a.start_date));

  const dateLabel = (e: WorkExperience) => {
    const start = e.start_date || "";
    const end = e.is_current ? "Present" : e.end_date || "";
    if (!start && !end) return "";
    return `${start} – ${end}`;
  };

  return (
    <section id="experience" className="border-t border-white/5 px-6 py-24">
      <ScrollReveal className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Work{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Experience
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            Roles and responsibilities I have taken on throughout my career.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl space-y-4">
          {sorted.map((e, i) => (
            <ScrollReveal key={e.id} delay={i * 100}>
              <div className="glass flex flex-col gap-4 rounded-2xl p-6 transition-all glass-hover sm:flex-row sm:items-start">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
                  <Briefcase className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-white">{e.position}</h3>
                    {dateLabel(e) && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
                        <Calendar className="h-3 w-3 text-cyan-400" />
                        {dateLabel(e)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-cyan-400">
                    {e.company_name}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
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
