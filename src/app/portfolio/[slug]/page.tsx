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

interface PortfolioSettings {
  slug: string;
  title: string;
  tagline: string;
  bio: string;
  skills: { name: string; level: string }[];
  social_github: string;
  social_linkedin: string;
  social_facebook: string;
  social_twitter: string;
  contact_email: string;
  contact_phone: string;
  contact_location: string;
  hero_visible: boolean;
  about_visible: boolean;
  skills_visible: boolean;
  projects_visible: boolean;
  services_visible: boolean;
  contact_visible: boolean;
  is_published: boolean;
}

export default function PublicPortfolioPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [settings, setSettings] = useState<PortfolioSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/portfolio/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d) => {
        setSettings(d.settings);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <p className="text-sm text-zinc-400">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (notFound || !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <p className="text-lg text-zinc-400 mb-6">This portfolio doesn&apos;t exist or isn&apos;t published yet.</p>
          <a
            href="/"
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <main>
        {settings.hero_visible && <HeroSection />}
        {settings.about_visible && <AboutSection />}
        {settings.skills_visible && <SkillsSection />}
        {settings.services_visible && (
          <>
            <MyServicesSection />
            <ServicesSection />
          </>
        )}
        {settings.projects_visible && <ProjectsSection />}
        {settings.contact_visible && <ContactSection />}
      </main>
      <Footer />
    </>
  );
}
