"use client";

import { useEffect, useState } from "react";
import { Code2, Coffee, GitCommit } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function AboutSection() {
  const [admin, setAdmin] = useState<{ name: string; last_name: string | null; profile_photo: string | null; bio: string | null } | null>(null);
  const [deliveredCount, setDeliveredCount] = useState<number>(0);

  useEffect(() => {
    fetch("/api/profile/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setAdmin(d?.admin ?? null);
        setDeliveredCount(d?.projects_delivered ?? 0);
      });
  }, []);

  const stats = [
    { icon: Code2, label: "Projects Delivered", value: String(deliveredCount) },
    { icon: Coffee, label: "Cups of Coffee", value: "500+" },
    { icon: GitCommit, label: "Contributions", value: "1k+" },
  ];

  const bioParagraphs = admin?.bio
    ? admin.bio.split("\n").filter(Boolean)
    : [
        "I'm a passionate Web Developer with expertise in building modern, scalable web applications. I love turning complex problems into simple, beautiful, and intuitive solutions.",
        "With a strong foundation in Python and modern web technologies, I deliver clean, maintainable code that drives real business results. Every project is an opportunity to push boundaries and create something exceptional.",
        "When I'm not coding, you'll find me exploring new technologies, contributing to open-source, or sharing knowledge with the developer community.",
      ];

  const initials = admin?.name
    ? admin.name.split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2)
    : "DJ";

  return (
    <section id="about" className="border-t border-white/5 px-6 py-24">
      <ScrollReveal className="mx-auto max-w-7xl">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              About{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Me
              </span>
            </h2>
            {bioParagraphs.map((p, i) => (
              <p key={i} className="mt-4 leading-relaxed text-zinc-400 first:mt-6">
                {p}
              </p>
            ))}
          </div>

          <div className="flex flex-col items-center gap-8">
            {admin?.profile_photo ? (
              <div className="h-64 w-64 overflow-hidden rounded-3xl border border-white/10">
                <img src={admin.profile_photo} alt="" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-3xl glass">
                <span className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  {initials}
                </span>
              </div>
            )}

            <div className="grid w-full grid-cols-3 gap-4">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="glass rounded-xl p-4 text-center">
                    <Icon className="mx-auto h-5 w-5 text-cyan-400" />
                    <p className="mt-2 text-lg font-bold text-white">{s.value}</p>
                    <p className="text-xs text-zinc-500">{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
