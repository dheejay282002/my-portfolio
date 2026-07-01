"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink, ChevronLeft, ChevronRight, X } from "lucide-react";

function MarkdownContent({ fallback }: { fallback: string }) {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="w-full text-sm text-left border-collapse">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return <th className="px-4 py-2.5 font-semibold text-cyan-400 whitespace-nowrap border-b border-white/10">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-2.5 text-zinc-300 border-b border-white/5">{children}</td>;
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">
                {children}
              </a>
            );
          },
          code({ className, children, ...props }) {
            const isInline = !className;
            if (isInline) {
              return <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm text-cyan-300" {...props}>{children}</code>;
            }
            return (
              <pre className="overflow-x-auto rounded-xl bg-zinc-900 p-4 text-sm">
                <code className={className} {...props}>{children}</code>
              </pre>
            );
          },
        }}
      >
        {fallback}
      </ReactMarkdown>
    </div>
  );
}

interface ProjectImage {
  id: number;
  url: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  live_url: string;
  images: ProjectImage[];
  tech_stack: string;
}

function ImageGallery({ 
  images, 
  title,
  onImageClick
}: { 
  images: ProjectImage[]; 
  title: string;
  onImageClick?: () => void;
}) {
  const [idx, setIdx] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-zinc-800/50">
      <div
        onClick={onImageClick}
        className="flex h-full w-full transition-transform duration-500 ease-in-out cursor-pointer"
        style={{ transform: `translateX(-${idx * 100}%)` }}
      >
        {images.map((img, i) => (
          <div key={img.id || i} className="h-full w-full shrink-0 relative">
            <img
              src={img.url}
              alt={`${title} ${i + 1}`}
              className="h-full w-full object-contain"
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIdx((idx - 1 + images.length) % images.length);
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-all hover:bg-black/70 hover:scale-110 z-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIdx((idx + 1) % images.length);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-all hover:bg-black/70 hover:scale-110 z-10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setIdx(i);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? "w-4 bg-cyan-400" : "w-1.5 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [modalProject, setModalProject] = useState<Project | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const autoScrollRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const pausedForDrag = useRef(false);
  const lastPausedCardIndexRef = useRef<number>(-1);
  const resumeScrollAtRef = useRef<number>(0);
  const scrollDirectionRef = useRef<number>(1);
  const touchStartRef = useRef<number>(0);

  const REPEAT_COUNT = 6;
  const repeatedProjects = Array.from({ length: REPEAT_COUNT }, () => projects).flat();

  // Resize cardRefs to fit the repeated projects length
  cardRefs.current = cardRefs.current.slice(0, repeatedProjects.length);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => {
        const list = d.projects || [];
        for (let i = list.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [list[i], list[j]] = [list[j], list[i]];
        }
        setProjects(list);
      });
  }, []);

  const updateCardScales = useCallback(() => {
    const container = scrollRef.current;
    if (!container || projects.length === 0) return;

    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let halfWidth = container.clientWidth / 2;
    if (halfWidth <= 0) halfWidth = 600;

    cardRefs.current.forEach((card) => {
      if (!card) return;

      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(containerCenter - cardCenter);

      const x = Math.min(1.2, distance / halfWidth);

      // Continuous scale: 1.2 in center to 0.6 at screen edge
      const scale = 0.6 + 0.6 * Math.cos((Math.min(1, x) * Math.PI) / 2);

      // Continuous opacity fade: 1.0 in center to 0.25 at screen edge
      const opacity = 0.25 + 0.75 * (1 - Math.pow(Math.min(1, x), 1.8));

      // Ratio for highlight borders & shadows: 1.0 in center, 0 at screen edge
      const ratio = Math.max(0, 1 - x);

      const inner = card.querySelector(".glass") as HTMLElement;
      if (inner) {
        inner.style.transform = `scale(${scale})`;
        inner.style.opacity = `${opacity}`;

        // Dynamic border color interpolation
        const r = Math.round(255 - (255 - 6) * ratio);
        const g = Math.round(255 - (255 - 182) * ratio);
        const b = Math.round(255 - (255 - 212) * ratio);
        const borderAlpha = 0.05 + 0.35 * ratio;
        inner.style.borderColor = `rgba(${r}, ${g}, ${b}, ${borderAlpha})`;

        // Dynamic glowing shadow
        inner.style.boxShadow = `0 20px 40px -15px rgba(6, 182, 212, ${0.25 * ratio})`;
      }
    });
  }, [projects.length]);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container || projects.length === 0) return;

    const N = projects.length;
    if (!cardRefs.current[0] || !cardRefs.current[N]) return;

    const setWidth = cardRefs.current[N].offsetLeft - cardRefs.current[0].offsetLeft;
    if (setWidth <= 0) return;

    const centerOffset = (container.scrollWidth - container.clientWidth) / 2;
    const diff = container.scrollLeft - centerOffset;

    if (Math.abs(diff) >= setWidth) {
      const numShifts = Math.round(diff / setWidth);
      container.scrollLeft -= numShifts * setWidth;
    }

    updateCardScales();
  }, [projects.length, updateCardScales]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || projects.length === 0) return;

    // Set scroll position to the center of the scroll container
    const centerOffset = (container.scrollWidth - container.clientWidth) / 2;
    container.scrollLeft = centerOffset;

    // Compute scales after scroll position is set
    const id = requestAnimationFrame(() => {
      updateCardScales();
    });
    return () => cancelAnimationFrame(id);
  }, [projects, updateCardScales]);

  useEffect(() => {
    if (projects.length === 0) return;
    let running = true;

    const tick = () => {
      if (!running) return;
      const container = scrollRef.current;
      if (container && !pausedRef.current && !pausedForDrag.current) {
        const now = Date.now();
        if (now >= resumeScrollAtRef.current) {
          container.scrollLeft += 0.8 * scrollDirectionRef.current;

          // Check if any card is now centered
          const containerCenter = container.scrollLeft + container.clientWidth / 2;
          
          let closestIndex = -1;
          let minDistance = Infinity;
          
          cardRefs.current.forEach((card, idx) => {
            if (!card) return;
            const cardCenter = card.offsetLeft + card.offsetWidth / 2;
            const dist = Math.abs(containerCenter - cardCenter);
            if (dist < minDistance) {
              minDistance = dist;
              closestIndex = idx;
            }
          });

          // Reset lastPausedCardIndexRef when card moves away from center
          if (closestIndex !== lastPausedCardIndexRef.current && minDistance > 5) {
            lastPausedCardIndexRef.current = -1;
          }

          // Since scroll step is 0.8px, a threshold of 0.6px guarantees at least one frame lands in the target area
          if (minDistance < 0.6 && closestIndex !== lastPausedCardIndexRef.current) {
            resumeScrollAtRef.current = now + 1000;
            lastPausedCardIndexRef.current = closestIndex;
            // Snap to exactly center for perfect visual alignment!
            if (cardRefs.current[closestIndex]) {
              const card = cardRefs.current[closestIndex]!;
              const cardCenter = card.offsetLeft + card.offsetWidth / 2;
              container.scrollLeft = cardCenter - container.clientWidth / 2;
            }
          }
        }
      }
      updateCardScales();
      autoScrollRef.current = requestAnimationFrame(tick);
    };

    autoScrollRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(autoScrollRef.current);
    };
  }, [projects.length, updateCardScales]);

  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0, moved: false });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const container = scrollRef.current;
    if (!container) return;
    pausedForDrag.current = true;
    dragState.current.isDown = true;
    dragState.current.startX = e.pageX - container.offsetLeft;
    dragState.current.scrollLeft = container.scrollLeft;
    dragState.current.moved = false;
    lastPausedCardIndexRef.current = -1;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const container = scrollRef.current;
    if (!dragState.current.isDown || !container) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - dragState.current.startX) * 1.5;
    if (Math.abs(walk) > 5) {
      dragState.current.moved = true;
      scrollDirectionRef.current = walk > 0 ? -1 : 1;
    }
    container.scrollLeft = dragState.current.scrollLeft - walk;
  }, []);

  const handleMouseUp = useCallback(() => {
    dragState.current.isDown = false;
    pausedForDrag.current = false;
  }, []);

  const handleCardClick = useCallback((project: Project) => {
    if (dragState.current.moved) return;
    pausedRef.current = true;
    setModalProject(project);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > 0.5) {
      scrollDirectionRef.current = e.deltaX > 0 ? 1 : -1;
      lastPausedCardIndexRef.current = -1;
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
    lastPausedCardIndexRef.current = -1;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartRef.current;
    if (Math.abs(diff) > 5) {
      scrollDirectionRef.current = diff > 0 ? -1 : 1;
      touchStartRef.current = currentX;
    }
  }, []);

  if (projects.length === 0) return null;

  return (
    <section id="projects" className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Featured{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Projects
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            A selection of projects I&apos;ve built with passion and precision.
          </p>
        </div>
      </div>

      <div className="relative mt-16 w-full overflow-x-hidden">
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onScroll={handleScroll}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          className="flex gap-6 items-center overflow-x-auto scrollbar-hide py-12 px-6 select-none"
        >
          {repeatedProjects.map((project, idx) => (
            <div
              key={`${project.id}-${idx}`}
              ref={(el) => { cardRefs.current[idx] = el; }}
              className="shrink-0 w-[400px] max-w-[85vw]"
            >
              <div
                className="glass rounded-2xl flex flex-col overflow-hidden cursor-grab active:cursor-grabbing"
                onClick={() => handleCardClick(project)}
              >
                {project.images && project.images.length > 0 && (
                  <div className="aspect-video w-full overflow-hidden bg-zinc-800/50">
                    <img
                      src={project.images[0].url}
                      alt={project.title}
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-xl font-semibold text-white text-center">
                    {project.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalProject && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 py-8"
          onClick={() => { pausedRef.current = false; setModalProject(null); }}
        >
          <div
            className="glass-strong w-full max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-hide rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">{modalProject.title}</h3>
              <button onClick={() => { pausedRef.current = false; setModalProject(null); }} className="text-zinc-500 transition-colors hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            {modalProject.images && modalProject.images.length > 0 && (
              <ImageGallery images={modalProject.images} title={modalProject.title} />
            )}
            <div className="p-6">
              <MarkdownContent fallback={modalProject.description} />
              {modalProject.tech_stack && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {modalProject.tech_stack.split(",").map((t) => (
                    <span key={t.trim()} className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
                      {t.trim()}
                    </span>
                  ))}
                </div>
              )}
              {modalProject.live_url && (
                <div className="mt-6">
                  <a
                    href={modalProject.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Live Demo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
