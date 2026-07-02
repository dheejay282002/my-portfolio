"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Code2, Shield, Server, Globe, Database, GitBranch, Smartphone, Palette, Cloud, Braces, Layers, Rocket, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [activeIndex, setActiveIndex] = useState(0);
  const dragStartX = useRef(0);
  const isDragging = useRef(false);

  const fetchServices = () => {
    fetch("/api/services", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.services) setServices(d.services); })
      .catch(() => {});
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleRequestService = (s: Service) => {
    window.dispatchEvent(new CustomEvent("open-project-request", {
      detail: { productName: s.title, productId: 0 }
    }));
  };

  const goTo = useCallback((index: number) => {
    setActiveIndex((prev) => {
      const max = services.length - 1;
      if (index < 0) return max;
      if (index > max) return 0;
      return index;
    });
  }, [services.length]);

  useEffect(() => {
    const timer = setInterval(() => goTo(activeIndex + 1), 5000);
    return () => clearInterval(timer);
  }, [activeIndex, goTo]);

  const handlePointerDown = (clientX: number) => {
    isDragging.current = true;
    dragStartX.current = clientX;
  };

  const handlePointerUp = (clientX: number) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const dx = clientX - dragStartX.current;
    if (Math.abs(dx) > 50) {
      goTo(dx > 0 ? activeIndex - 1 : activeIndex + 1);
    }
  };

  if (services.length === 0) return null;

  const cardW = 300;

  const getStyle = (index: number) => {
    const diff = index - activeIndex;
    const abs = Math.abs(diff);
    const scale = abs === 0 ? 1 : abs === 1 ? 0.82 : abs === 2 ? 0.65 : 0.5;
    const opacity = abs <= 1 ? 1 : abs === 2 ? 0.6 : 0;
    const zIndex = services.length - abs;
    const translateX = diff * (cardW + 24);

    return {
      transform: `translateX(${translateX}px) scale(${scale})`,
      opacity,
      zIndex,
      transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease",
      pointerEvents: (abs <= 2 ? "auto" : "none") as React.CSSProperties["pointerEvents"],
      willChange: "transform" as const,
    };
  };

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

        <div className="relative mt-16">
          <div
            className="relative mx-auto flex h-[400px] items-center justify-center select-none"
            onMouseDown={(e) => handlePointerDown(e.clientX)}
            onMouseUp={(e) => handlePointerUp(e.clientX)}
            onMouseLeave={(e) => { if (isDragging.current) handlePointerUp(e.clientX); }}
            onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
            onTouchEnd={(e) => handlePointerUp(e.changedTouches[0].clientX)}
          >
            {services.map((s, i) => {
              const Icon = iconMap[s.icon] || Code2;
              const parts = s.description.split("|").map(p => p.trim());
              const included = parts[0]?.replace("What's Included: ", "") || s.description;
              const bestFor = parts[1]?.replace("Best For: ", "") || "";
              const style = getStyle(i);
              const isCenter = i === activeIndex;

              return (
                <div
                  key={s.id}
                  className="absolute cursor-pointer"
                  style={style}
                  onClick={() => goTo(i)}
                >
                  <div
                    className="rounded-2xl p-6 flex flex-col text-left w-[280px] sm:w-[300px] h-[360px]"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${isCenter ? "rgba(6,182,212,0.25)" : "rgba(255,255,255,0.06)"}`,
                      boxShadow: isCenter ? "0 0 40px rgba(6,182,212,0.1)" : "none",
                    }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
                      <Icon className="h-5 w-5 text-cyan-400" />
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-white truncate">
                      {s.title}
                    </h3>

                    <div className="mt-4 flex-1 flex flex-col justify-between gap-3 min-h-0">
                      <div className="overflow-y-auto scrollbar-thin">
                        <h4 className="text-[9px] font-semibold text-cyan-400 uppercase tracking-wider">What&apos;s Included</h4>
                        <p className="mt-1 text-xs text-zinc-300 font-medium leading-relaxed line-clamp-4">
                          {included}
                        </p>
                      </div>

                      {bestFor && (
                        <div className="border-t border-white/5 pt-3 shrink-0">
                          <h4 className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">Best For</h4>
                          <p className="mt-1 text-[11px] text-zinc-400 italic truncate">
                            {bestFor}
                          </p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRequestService(s); }}
                      className="mt-3 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2 text-[11px] font-semibold text-white transition-opacity hover:opacity-90 shrink-0"
                    >
                      Request This Service
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => goTo(activeIndex - 1)}
            className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-400 transition-all hover:bg-zinc-700 hover:text-white backdrop-blur-sm border border-white/10"
            aria-label="Previous service"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => goTo(activeIndex + 1)}
            className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-400 transition-all hover:bg-zinc-700 hover:text-white backdrop-blur-sm border border-white/10"
            aria-label="Next service"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="mt-6 flex items-center justify-center gap-2">
            {services.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIndex ? "w-6 bg-cyan-400" : "w-1.5 bg-zinc-600 hover:bg-zinc-500"
                }`}
                aria-label={`Go to service ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
