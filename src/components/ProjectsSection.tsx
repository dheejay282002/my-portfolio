"use client";

import { useEffect, useState } from "react";
import { ExternalLink, ChevronLeft, ChevronRight, X } from "lucide-react";

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
              className="h-full w-full object-cover"
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

function useIntersectionObserver() {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [ref, setRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.unobserve(ref);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  return [setRef, isIntersecting] as const;
}

export default function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [modalProject, setModalProject] = useState<Project | null>(null);
  const [setRef, isVisible] = useIntersectionObserver();

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []));
  }, []);

  if (projects.length === 0) return null;

  return (
    <section ref={setRef} id="projects" className="border-t border-white/5 px-6 py-24">
      <div className="mx-auto max-w-7xl">
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

        <div className={projects.length === 1 ? "mt-16 flex justify-center" : "mt-16 grid gap-6 sm:grid-cols-2"}>
          {projects.map((project, idx) => {
            const techList = project.tech_stack
              ? project.tech_stack.split(",").map((t) => t.trim())
              : [];

            return (
              <div
                key={project.id}
                style={{
                  transitionDelay: `${idx * 150}ms`,
                }}
                className={`glass rounded-2xl flex flex-col overflow-hidden transition-all duration-700 ease-out glass-hover ${
                  projects.length === 1 ? "w-full max-w-lg" : ""
                } ${
                  isVisible
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-12 scale-95"
                }`}
              >
                {project.images && project.images.length > 0 && (
                  <ImageGallery 
                    images={project.images} 
                    title={project.title} 
                    onImageClick={() => setModalProject(project)}
                  />
                )}
                <div className="flex flex-1 flex-col p-8 pt-6">
                  <h3 className="text-xl font-semibold text-white">
                    {project.title}
                  </h3>
                  <p className="mt-3 flex-1 leading-relaxed text-zinc-400">
                    {project.description}
                  </p>

                  {techList.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {techList.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 flex items-center gap-4">
                    {project.live_url && (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Live Demo
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modalProject && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 py-8"
          onClick={() => setModalProject(null)}
        >
          <div
            className="glass-strong w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">{modalProject.title}</h3>
              <button onClick={() => setModalProject(null)} className="text-zinc-500 transition-colors hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {modalProject.images && modalProject.images.length > 0 && (
                <div className="mb-6">
                  <ImageGallery images={modalProject.images} title={modalProject.title} />
                </div>
              )}
              <p className="leading-relaxed text-zinc-300 whitespace-pre-wrap">
                {modalProject.description}
              </p>
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
