"use client";

import { useState, useEffect } from "react";
import { useForm, ValidationError } from "@formspree/react";
import { Mail, MapPin, Phone, Send, CheckCircle } from "lucide-react";
import { FaGithub, FaLinkedin, FaFacebook } from "react-icons/fa";
import ScrollReveal from "./ScrollReveal";

export default function ContactSection() {
  const [state, handleSubmit] = useForm("xqevlqgr");
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

  if (state.succeeded) {
    return (
      <section id="contact" className="border-t border-white/5 px-6 py-24">
        <ScrollReveal className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20">
              <CheckCircle className="h-8 w-8 text-cyan-400" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Message{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Sent!
              </span>
            </h2>
            <p className="text-zinc-400">
              Thanks for reaching out. I&apos;ll get back to you soon.
            </p>
          </div>
        </ScrollReveal>
      </section>
    );
  }

  return (
    <section id="contact" className="border-t border-white/5 px-6 py-24">
      <ScrollReveal className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Get In{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Touch
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            Have a project in mind? Let&apos;s talk about it.
          </p>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          <div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  required
                  className="glass w-full rounded-xl px-5 py-3.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                />
                <ValidationError
                  prefix="Name"
                  field="name"
                  errors={state.errors}
                />
              </div>
              <div>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  required
                  className="glass w-full rounded-xl px-5 py-3.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                />
                <ValidationError
                  prefix="Email"
                  field="email"
                  errors={state.errors}
                />
              </div>
              <div>
                <input
                  id="subject"
                  type="text"
                  name="_subject"
                  placeholder="Subject"
                  className="glass w-full rounded-xl px-5 py-3.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <textarea
                  id="message"
                  rows={5}
                  name="message"
                  placeholder="Your Message"
                  required
                  className="glass w-full resize-none rounded-xl px-5 py-3.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                />
                <ValidationError
                  prefix="Message"
                  field="message"
                  errors={state.errors}
                />
              </div>
              <button
                type="submit"
                disabled={state.submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {state.submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          <div className="flex flex-col justify-center gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl glass">
                  <Mail className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Email</p>
                  <a
                    href="mailto:deejay.cristobal@protonmail.com"
                    className="text-sm text-white transition-colors hover:text-cyan-400"
                  >
                    deejay.cristobal@protonmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl glass">
                  <MapPin className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Location</p>
                  <p className="text-sm text-white">Philippines</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl glass">
                  <Phone className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Phone</p>
                  <p className="text-sm text-white">(+63) 924 1642 251</p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-4 text-sm font-medium text-zinc-300">
                Follow Me
              </p>
              <div className="flex gap-3">
                {socials.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-lg glass text-zinc-400 transition-all glass-hover hover:text-cyan-400"
                      aria-label={s.label}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
