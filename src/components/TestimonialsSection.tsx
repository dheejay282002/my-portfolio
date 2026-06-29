"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import Image from "next/image";
import ScrollReveal from "./ScrollReveal";

interface Review {
  rating: number;
  content: string;
  client_name: string;
  client_photo: string | null;
  project_name: string;
}

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reviews/public")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.reviews) {
          setReviews(data.reviews);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section id="testimonials" className="border-t border-white/5 px-6 py-24 text-center">
        <p className="text-zinc-500">Loading reviews...</p>
      </section>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <section id="testimonials" className="border-t border-white/5 px-6 py-24">
      <ScrollReveal className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            What{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Clients Say
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            Feedback from people I&apos;ve worked with.
          </p>
        </div>

        <div className={`mt-16 ${
          reviews.length === 1 
            ? "flex justify-center" 
            : reviews.length === 2 
              ? "grid gap-6 md:grid-cols-2 max-w-4xl mx-auto" 
              : "grid gap-6 md:grid-cols-3"
        }`}>
          {reviews.map((r, idx) => (
            <div
              key={idx}
              className={`glass rounded-2xl p-8 transition-all duration-300 glass-hover flex flex-col ${
                reviews.length === 1 ? "w-full max-w-md" : ""
              }`}
            >
              <div className="flex gap-1">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-cyan-400 text-cyan-400"
                  />
                ))}
              </div>
              <p className="mt-4 flex-1 leading-relaxed text-zinc-400">
                &ldquo;{r.content}&rdquo;
              </p>
              <div className="mt-6 border-t border-white/5 pt-4 flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 overflow-hidden shrink-0">
                  {r.client_photo ? (
                    <Image src={r.client_photo} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white uppercase">
                      {r.client_name?.charAt(0) || "C"}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{r.client_name}</p>
                  <p className="text-xs text-zinc-500">Client, Project: {r.project_name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
