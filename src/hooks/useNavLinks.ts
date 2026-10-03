"use client";

import { useEffect, useMemo, useState } from "react";

export type NavLink = {
  label: string;
  href: string;
  desktopClassName?: string;
};

const baseLinks: NavLink[] = [
  { label: "Home", href: "/#home" },
  { label: "About", href: "/#about" },
  { label: "Skills", href: "/#skills" },
  { label: "Education", href: "/#education" },
  { label: "Experience", href: "/#experience" },
  { label: "Services", href: "/#services" },
  { label: "Projects", href: "/#projects" },
  { label: "Certificates", href: "/#certificates" },
  { label: "Contact", href: "/#contact" },
];

const offersLink: NavLink = { label: "What I Offer", href: "/#offers" };

// Shared across Header/Footer so the products endpoint is fetched once per page load.
let offersEnabled: boolean | null = null;
let inflight: Promise<boolean> | null = null;

function loadOffersEnabled(): Promise<boolean> {
  if (offersEnabled !== null) return Promise.resolve(offersEnabled);
  if (!inflight) {
    inflight = fetch("/api/products", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const products: { display_on_homepage?: boolean }[] = data?.products || [];
        offersEnabled = products.some((p) => p.display_on_homepage);
        return offersEnabled;
      })
      .catch(() => {
        offersEnabled = false;
        return false;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useNavLinks(): NavLink[] {
  const [showOffers, setShowOffers] = useState(offersEnabled ?? false);

  useEffect(() => {
    let active = true;
    loadOffersEnabled().then((enabled) => {
      if (active) setShowOffers(enabled);
    });
    return () => {
      active = false;
    };
  }, []);

  return useMemo(() => {
    if (!showOffers) return baseLinks;
    const index = baseLinks.findIndex((link) => link.label === "Projects");
    return [...baseLinks.slice(0, index), offersLink, ...baseLinks.slice(index)];
  }, [showOffers]);
}
