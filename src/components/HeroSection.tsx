"use client";

import { useEffect, useState } from "react";
import { ArrowDown, Mail } from "lucide-react";

export default function HeroSection() {
  const [admin, setAdmin] = useState<{ name: string; last_name: string | null; profile_photo: string | null; bio: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/profile/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAdmin(d?.admin ?? null));
  }, []);

  const name = admin?.name || "Dee Jay";

  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.12),transparent_60%)]" />

      <div className="relative text-center">
        <p className="text-sm font-medium tracking-widest text-cyan-400 uppercase">
          Full Stack Developer
        </p>

        <h1 className="mt-4 text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          Hi, I&apos;m{" "}
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {name}
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
          I build scalable web solutions with clean code and modern tools.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#projects"
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            View My Work
          </a>
          <a
            href="#contact"
            className="glass rounded-lg px-8 py-3.5 text-sm font-medium text-white transition-all glass-hover inline-flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Get in Touch
          </a>
        </div>

        <div className="mt-16 animate-bounce">
          <a href="#about" className="text-zinc-500 transition-colors hover:text-white">
            <ArrowDown className="mx-auto h-6 w-6" />
          </a>
        </div>
      </div>
    </section>
  );
}
