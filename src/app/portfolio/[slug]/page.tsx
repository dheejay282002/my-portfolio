"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import SkillsSection from "@/components/SkillsSection";
import MyServicesSection from "@/components/MyServicesSection";
import ServicesSection from "@/components/ServicesSection";
import ProjectsSection from "@/components/ProjectsSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function PublicPortfolioPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/portfolio/${slug}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(() => setLoading(false))
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <p className="text-lg text-zinc-400 mb-6">This portfolio doesn&apos;t exist or isn&apos;t published yet.</p>
          <a href="/" className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-medium text-white hover:opacity-90">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <main>
        <HeroSection />
        <AboutSection />
        <SkillsSection />
        <MyServicesSection />
        <ServicesSection />
        <ProjectsSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
