"use client";

import { useEffect, useState } from "react";
import { Code2, Shield, Server, Globe, Database, GitBranch, Smartphone, Palette, Cloud, Braces, Layers, Rocket, Check, Clock } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

interface Product {
  id: number;
  package_tier: string;
  project_baseline: string;
  est_timeline: string;
  deliverables: string;
}

function getAveragePrice(baseline: string): number {
  const matches = baseline.replace(/,/g, "").match(/\d+/g);
  if (!matches || matches.length === 0) return 0;
  const numbers = matches.map(Number);
  const sum = numbers.reduce((a, b) => a + b, 0);
  return sum / numbers.length;
}

export default function ServicesSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [popularId, setPopularId] = useState<number>(-1);
  const [recommendedId, setRecommendedId] = useState<number>(-1);

  const fetchProducts = () => {
    fetch("/api/products", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.products) {
          const prods: Product[] = d.products;
          setProducts(prods);

          // 1. Calculate Popular automatically based on requests count
          let maxCount = 0;
          let popId = -1;
          if (d.requestCounts && d.requestCounts.length > 0) {
            d.requestCounts.forEach((rc: any) => {
              const count = Number(rc.count);
              if (count > maxCount) {
                maxCount = count;
                popId = Number(rc.product_id);
              }
            });
          }
          setPopularId(popId);

          // 2. Calculate Recommended automatically based on average price
          if (prods.length > 0) {
            const productAverages = prods.map(p => ({
              id: p.id,
              avg: getAveragePrice(p.project_baseline)
            }));
            const totalAverage = productAverages.reduce((sum, item) => sum + item.avg, 0) / (prods.length || 1);

            let recId = -1;
            let minDiff = Infinity;
            productAverages.forEach(item => {
              const diff = Math.abs(item.avg - totalAverage);
              if (diff < minDiff) {
                minDiff = diff;
                recId = item.id;
              }
            });
            setRecommendedId(recId);
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchProducts();
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
            const isPopular = p.id === popularId;
            const isRecommended = p.id === recommendedId && !isPopular;
            const items = p.deliverables.split("\n").filter(Boolean);

            return (
              <div
                key={p.id}
                className={`glass rounded-3xl p-8 transition-all duration-300 glass-hover flex flex-col justify-between relative overflow-hidden ${
                  isPopular 
                    ? "border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.18)] md:-translate-y-2" 
                    : isRecommended
                    ? "border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.12)] md:-translate-y-1"
                    : ""
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-1 rounded-bl-xl text-[10px] font-bold text-white uppercase tracking-wider">
                    Popular
                  </div>
                )}
                {isRecommended && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-1 rounded-bl-xl text-[10px] font-bold text-white uppercase tracking-wider">
                    Recommended
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white">
                    {p.package_tier}
                  </h3>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-white tracking-tight">
                      {p.project_baseline}
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
                    className={`w-full rounded-2xl py-3 text-sm font-semibold text-white transition-all ${
                      isPopular 
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 shadow-md shadow-cyan-500/10" 
                        : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                    }`}
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
