"use client";

import { useEffect, useState } from "react";
import { Check, Clock } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

interface Product {
  id: number;
  package_tier: string;
  project_baseline: string;
  est_timeline: string;
  deliverables: string;
}

export default function ServicesSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [rate, setRate] = useState(1);

  const formatPrice = (baseline: string) => {
    if (currency === "USD" || rate === 1) return baseline;
    const numbers = baseline.replace(/,/g, "").match(/\d+/g);
    if (!numbers || numbers.length === 0) return baseline;

    const convertedNumbers = numbers.map((n) => {
      const num = Number(n);
      const converted = Math.round(num * rate);
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(converted);
    });

    if (convertedNumbers.length === 2) {
      return `${convertedNumbers[0]} – ${convertedNumbers[1]}${baseline.includes("+") ? "+" : ""}`;
    } else if (convertedNumbers.length === 1) {
      return `${convertedNumbers[0]}${baseline.includes("+") ? "+" : ""}`;
    }
    return baseline;
  };

  const fetchProducts = () => {
    fetch("/api/products", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.products) {
          setProducts(d.products);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchProducts();

    // Live Geolocation check
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        const cur = data.currency || "USD";
        setCurrency(cur);
        fetch("https://open.er-api.com/v6/latest/USD")
          .then((r) => r.json())
          .then((ratesData) => {
            if (ratesData.rates && ratesData.rates[cur]) {
              setRate(ratesData.rates[cur]);
            }
          });
      })
      .catch(() => {
        // Safe time-zone fallback detection
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz === "Asia/Manila") {
          setCurrency("PHP");
          fetch("https://open.er-api.com/v6/latest/USD")
            .then((r) => r.json())
            .then((ratesData) => {
              if (ratesData.rates && ratesData.rates["PHP"]) {
                setRate(ratesData.rates["PHP"]);
              }
            });
        }
      });
  }, []);

  if (products.length === 0) return null;

  const handleChoosePackage = (p: Product) => {
    window.dispatchEvent(new CustomEvent("open-project-request", {
      detail: { productName: p.package_tier, productId: p.id }
    }));
  };

  return (
    <section id="offers" className="border-t border-white/5 px-6 py-24">
      <ScrollReveal className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            What I{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Offer
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            From custom development to ongoing maintenance, select the package that fits your goals.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {products.map((p) => {
            const items = p.deliverables.split("\n").filter(Boolean);

            return (
              <div
                key={p.id}
                className="glass rounded-3xl p-8 transition-all duration-300 glass-hover flex flex-col justify-between relative overflow-hidden"
              >

                <div>
                  <h3 className="text-xl font-bold text-white">
                    {p.package_tier}
                  </h3>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-white tracking-tight animate-fade-in">
                      {formatPrice(p.project_baseline)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Est. Timeline: {p.est_timeline}</span>
                  </div>

                  <div className="mt-8 border-t border-white/5 pt-6">
                    <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                      Key Deliverables & Included Features
                    </h4>
                    <ul className="space-y-3">
                      {items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-zinc-300 leading-normal">
                          <Check className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <button
                    onClick={() => handleChoosePackage(p)}
                    className="w-full rounded-2xl py-3 text-sm font-semibold text-white transition-all bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                  >
                    Choose Package
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollReveal>
    </section>
  );
}
