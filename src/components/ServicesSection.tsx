"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Clock, Check, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [currency, setCurrency] = useState("USD");
  const [rate, setRate] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const dragStartX = useRef(0);
  const dragOffset = useRef(0);
  const isDragging = useRef(false);

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
          const prods: Product[] = d.products;
          setProducts(prods);

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

  const handleChoosePackage = (p: Product) => {
    window.dispatchEvent(new CustomEvent("open-project-request", {
      detail: { productName: p.package_tier, productId: p.id }
    }));
  };

  const goTo = useCallback((index: number) => {
    setActiveIndex((prev) => {
      const max = products.length - 1;
      if (index < 0) return max;
      if (index > max) return 0;
      return index;
    });
  }, [products.length]);

  useEffect(() => {
    const timer = setInterval(() => goTo(activeIndex + 1), 6000);
    return () => clearInterval(timer);
  }, [activeIndex, goTo]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragOffset.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    dragOffset.current = e.clientX - dragStartX.current;
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (Math.abs(dragOffset.current) > 50) {
      goTo(dragOffset.current > 0 ? activeIndex - 1 : activeIndex + 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
    dragOffset.current = 0;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - dragStartX.current;
    if (Math.abs(dx) > 50) {
      goTo(dx > 0 ? activeIndex - 1 : activeIndex + 1);
    }
  };

  if (products.length === 0) return null;

  const getTransform = (index: number) => {
    const diff = index - activeIndex;
    const abs = Math.abs(diff);
    const scale = Math.max(0.55, 1 - abs * 0.2);
    const translateX = diff * 120;
    const translateZ = abs === 0 ? 80 : -abs * 60;
    const rotateY = diff * 20;
    const opacity = abs <= 2 ? (abs === 0 ? 1 : abs === 1 ? 0.85 : 0.5) : 0;
    const zIndex = products.length - abs;

    return {
      transform: `perspective(900px) translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity,
      zIndex,
      transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
      pointerEvents: (abs <= 2 ? "auto" : "none") as React.CSSProperties["pointerEvents"],
    };
  };

  return (
    <section id="offers" className="border-t border-white/5 px-6 py-24 overflow-hidden">
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

        <div className="relative mt-16">
          <div
            className="relative mx-auto flex h-[520px] items-center justify-center select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="pointer-events-none absolute left-0 top-0 z-20 h-full w-24 bg-gradient-to-r from-[#0b0b10] to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 z-20 h-full w-24 bg-gradient-to-l from-[#0b0b10] to-transparent" />

            <div className="relative flex h-full w-full items-center justify-center" style={{ perspective: "900px" }}>
              {products.map((p, i) => {
                const isPopular = p.id === popularId;
                const isRecommended = p.id === recommendedId && !isPopular;
                const items = p.deliverables.split("\n").filter(Boolean);
                const style = getTransform(i);
                const isCenter = i === activeIndex;

                return (
                  <div
                    key={p.id}
                    className="absolute cursor-pointer"
                    style={style}
                    onClick={() => goTo(i)}
                  >
                    <div
                      className={`glass rounded-2xl p-6 flex flex-col overflow-hidden text-left w-[280px] sm:w-[320px] h-[480px] transition-shadow duration-500 relative ${
                        isCenter
                          ? (isPopular
                            ? "shadow-2xl shadow-cyan-500/10 ring-1 ring-cyan-500/20"
                            : isRecommended
                            ? "shadow-2xl shadow-blue-500/10 ring-1 ring-blue-500/20"
                            : "shadow-2xl shadow-white/5")
                          : ""
                      }`}
                    >
                      {isPopular && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-0.5 rounded-bl-xl text-[9px] font-bold text-white uppercase tracking-wider z-10">
                          Popular
                        </div>
                      )}
                      {isRecommended && !isPopular && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-0.5 rounded-bl-xl text-[9px] font-bold text-white uppercase tracking-wider z-10">
                          Recommended
                        </div>
                      )}

                      <h3 className="text-lg font-bold text-white pr-16 truncate">
                        {p.package_tier}
                      </h3>

                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-xl font-extrabold text-white tracking-tight">
                          {formatPrice(p.project_baseline)}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1 text-[11px] text-zinc-400">
                        <Clock className="h-3 w-3 text-cyan-400" />
                        <span>Est. Timeline: {p.est_timeline}</span>
                      </div>

                      <div className="mt-4 flex-1 border-t border-white/5 pt-4 min-h-0 overflow-hidden">
                        <h4 className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                          Key Deliverables
                        </h4>
                        <ul className="space-y-1.5 overflow-y-auto max-h-[180px] scrollbar-thin pr-1">
                          {items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed">
                              <Check className="h-3 w-3 shrink-0 text-cyan-400 mt-0.5" />
                              <span className="line-clamp-2">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleChoosePackage(p); }}
                        className={`mt-4 w-full rounded-xl py-2.5 text-xs font-semibold text-white transition-all shrink-0 ${
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
          </div>

          <button
            onClick={() => goTo(activeIndex - 1)}
            className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-400 transition-all hover:bg-zinc-700 hover:text-white backdrop-blur-sm border border-white/10"
            aria-label="Previous package"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => goTo(activeIndex + 1)}
            className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-400 transition-all hover:bg-zinc-700 hover:text-white backdrop-blur-sm border border-white/10"
            aria-label="Next package"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="mt-6 flex items-center justify-center gap-2">
            {products.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIndex ? "w-6 bg-cyan-400" : "w-1.5 bg-zinc-600 hover:bg-zinc-500"
                }`}
                aria-label={`Go to package ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
