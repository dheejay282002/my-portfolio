"use client";

import { useState, useEffect } from "react";

export function useLocalCurrency() {
  const [currency, setCurrency] = useState("USD");
  const [rate, setRate] = useState(1);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
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
            setLoaded(true);
          })
          .catch(() => setLoaded(true));
      })
      .catch(() => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const fallbackCur = tz === "Asia/Manila" ? "PHP" : "USD";
        setCurrency(fallbackCur);
        if (fallbackCur !== "USD") {
          fetch("https://open.er-api.com/v6/latest/USD")
            .then((r) => r.json())
            .then((ratesData) => {
              if (ratesData.rates && ratesData.rates[fallbackCur]) {
                setRate(ratesData.rates[fallbackCur]);
              }
              setLoaded(true);
            })
            .catch(() => setLoaded(true));
        } else {
          setLoaded(true);
        }
      });
  }, []);

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

  const formatDownpayment = (baseline: string) => {
    const nums = baseline.replace(/[$,]/g, "").match(/\d+/g);
    if (!nums) return null;
    const minPrice = parseInt(nums[0], 10);
    const half = Math.round(minPrice / 2);
    if (currency === "USD" || rate === 1) {
      return `$${half.toLocaleString()}`;
    }
    const converted = Math.round(half * rate);
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(converted);
  };

  return { currency, rate, loaded, formatPrice, formatDownpayment };
}
