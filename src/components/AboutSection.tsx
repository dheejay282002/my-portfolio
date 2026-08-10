"use client";

import { useEffect, useState } from "react";
import { Code2, Coffee, GitCommit, FileText, X } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function AboutSection() {
  const [admin, setAdmin] = useState<{ name: string; last_name: string | null; profile_photo: string | null; bio: string | null } | null>(null);
  const [deliveredCount, setDeliveredCount] = useState<number>(0);
  const [cupsOfCoffee, setCupsOfCoffee] = useState("0");
  const [contributions, setContributions] = useState("1k+");
  const [resume, setResume] = useState<{ file_url: string; file_type: string; file_name: string } | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);

  useEffect(() => {
    fetch("/api/profile/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setAdmin(d?.admin ?? null);
        setDeliveredCount(d?.projects_delivered ?? 0);
        setCupsOfCoffee(d?.cups_of_coffee ?? "0");
        setContributions(d?.contributions ?? "1k+");
      });
    fetch("/api/resume/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setResume(d?.resume ?? null));
  }, []);

  const stats = [
    { icon: Code2, label: "Projects Delivered", value: String(deliveredCount) },
    { icon: Coffee, label: "Cups of Coffee", value: cupsOfCoffee },
    { icon: GitCommit, label: "Contributions", value: contributions },
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
            {resume && (
              <button
                onClick={() => setShowResumeModal(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <FileText className="h-4 w-4" />
                View My Resume
              </button>
            )}
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

      {showResumeModal && resume && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowResumeModal(false)}>
          <div className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">Resume</h3>
              <div className="flex items-center gap-2">
                <a
                  href={resume.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-cyan-400"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button onClick={() => setShowResumeModal(false)} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-4 scrollbar-hide" style={{ maxHeight: "calc(90vh - 64px)" }}>
              {resume.file_type === "application/pdf" ? (
                <embed
                  src={resume.file_url}
                  type="application/pdf"
                  className="w-full h-[700px] rounded-xl border border-white/10"
                />
              ) : (
                <img
                  src={resume.file_url}
                  alt="Resume"
                  className="w-full rounded-xl object-contain border border-white/10"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
