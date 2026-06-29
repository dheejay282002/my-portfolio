"use client";

import { useEffect, useState } from "react";
import { Terminal, Database, Globe, Layout, Shield, Cpu } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const iconMap: Record<string, React.ElementType> = {
  Terminal, Database, Globe, Layout, Shield, Cpu,
};

interface Skill {
  id: number;
  name: string;
  category: string;
  icon: string;
}

export default function SkillsSection() {
  const [groups, setGroups] = useState<Record<string, Skill[]>>({});

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((d) => {
        const skills: Skill[] = d.skills || [];
        const grouped: Record<string, Skill[]> = {};
        for (const s of skills) {
          if (!grouped[s.category]) grouped[s.category] = [];
          grouped[s.category].push(s);
        }
        setGroups(grouped);
      });
  }, []);

  if (Object.keys(groups).length === 0) return null;

  return (
    <section id="skills" className="border-t border-white/5 px-6 py-24">
      <ScrollReveal className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            My{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Skills
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            Technologies and tools I use to bring ideas to life.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(groups).map(([category, skills]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">
                {category}
              </h3>
              <div className="mt-4 space-y-3">
                {skills.map((skill) => {
                  const Icon = iconMap[skill.icon] || Terminal;
                  return (
                    <div
                      key={skill.id}
                      className="glass flex items-center gap-3 rounded-xl px-4 py-3 transition-all glass-hover"
                    >
                      <Icon className="h-5 w-5 text-cyan-400" />
                      <span className="text-sm text-zinc-300">{skill.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
