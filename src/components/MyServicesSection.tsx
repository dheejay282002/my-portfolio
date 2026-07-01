"use client";

import { useEffect, useState } from "react";
import { Code2, Shield, Server, Globe, Database, GitBranch, Smartphone, Palette, Cloud, Braces, Layers, Rocket } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const iconMap: Record<string, React.ElementType> = {
  Code2, Shield, Server, Globe, Database, GitBranch, Smartphone, Palette, Cloud, Braces, Layers, Rocket,
};

interface Service {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export default function MyServicesSection() {
  const [services, setServices] = useState<Service[]>([]);

  const fetchServices = () => {
    fetch("/api/services", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.services) setServices(d.services); })
      .catch(() => {});
  };

  useEffect(() => {
    fetchServices();
  }, []);

  if (services.length === 0) return null;

  return (
    <section id="services" className="border-t border-white/5 px-6 py-24">
      <ScrollReveal className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            My{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Services
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            A comprehensive list of services I offer to help you bring your ideas to life.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {services.map((s) => {
            const Icon = iconMap[s.icon] || Code2;
            const parts = s.description.split("|").map(p => p.trim());
            const included = parts[0]?.replace("What's Included: ", "") || s.description;
            const bestFor = parts[1]?.replace("Best For: ", "") || "";

            return (
              <div
                key={s.id}
                className="glass rounded-2xl p-8 transition-all duration-300 glass-hover flex flex-col relative overflow-hidden text-left"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
                  <Icon className="h-6 w-6 text-cyan-400" />
                </div>
                
                <h3 className="mt-6 text-xl font-bold text-white">
                  {s.title}
                </h3>

                <div className="mt-6 flex-1 flex flex-col justify-between gap-6">
                  <div>
                    <h4 className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">What&apos;s Included</h4>
                    <p className="mt-1.5 text-sm text-zinc-300 font-medium leading-relaxed">
                      {included}
                    </p>
                  </div>
                  
                  {bestFor && (
                    <div className="border-t border-white/5 pt-4 mt-auto">
                      <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Best For</h4>
                      <p className="mt-1.5 text-xs text-zinc-400 italic">
                        {bestFor}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollReveal>
    </section>
  );
}
