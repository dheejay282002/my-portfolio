"use client";

import { useEffect, useState } from "react";
import { FaGithub, FaLinkedin, FaFacebook } from "react-icons/fa";
import { useWebSettings } from "@/hooks/useWebSettings";

export default function Footer() {
  const { settings } = useWebSettings();
  const [links, setLinks] = useState({
    github: "https://github.com/deejay-cristobal",
    linkedin: "https://linkedin.com/in/deejay-cristobal",
    facebook: "https://facebook.com/deejay_cristobal",
  });

  useEffect(() => {
    fetch("/api/profile/public")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.admin) {
          setLinks({
            github: data.admin.github_url || "https://github.com/deejay-cristobal",
            linkedin: data.admin.linkedin_url || "https://linkedin.com/in/deejay-cristobal",
            facebook: data.admin.twitter_url || "https://facebook.com/deejay_cristobal",
          });
        }
      })
      .catch(() => {});
  }, []);

  const socials = [
    { icon: FaGithub, href: links.github, label: "GitHub" },
    { icon: FaLinkedin, href: links.linkedin, label: "LinkedIn" },
    { icon: FaFacebook, href: links.facebook, label: "Facebook" },
  ];

  return (
    <footer className="border-t border-white/5 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <a href="#home" className="text-xl font-bold tracking-tight text-white flex items-center">
            {settings.logo_type === "image" && settings.logo_image ? (
              <img src={settings.logo_image} alt={settings.web_name} className="h-7 max-w-[180px] object-contain" />
            ) : (
              <span style={{ 
                fontFamily: settings.logo_font_file ? 'UploadedCustomFont' : settings.logo_font,
                color: settings.logo_color || '#ffffff'
              }}>
                {settings.web_name}
              </span>
            )}
          </a>

          <nav className="flex gap-6">
            {["Home", "About", "Skills", "Services", "Projects", "Contact"].map(
              (label) => (
                <a
                  key={label}
                  href={`#${label.toLowerCase()}`}
                  className="text-sm text-zinc-500 transition-colors hover:text-white"
                >
                  {label}
                </a>
              )
            )}
          </nav>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <a
              href="https://ko-fi.com/itsmeyourdeejay"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 text-xs font-semibold text-amber-400 transition-all hover:bg-amber-500/20 hover:border-amber-500/30"
            >
              <span>☕</span> Buy me a coffee
            </a>

            <div className="flex gap-3">
              {socials.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:text-cyan-400"
                    aria-label={s.label}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/5 pt-6 text-center">
          <p className="text-sm text-zinc-600">
            &copy; {new Date().getFullYear()} {settings.web_name} All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
