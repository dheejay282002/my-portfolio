"use client";

import { useState, useEffect } from "react";

const TZ_CURRENCY_MAP: Record<string, string> = {
  "Asia/Manila": "PHP",
  "Asia/Tokyo": "JPY",
  "Asia/Seoul": "KRW",
  "Asia/Singapore": "SGD",
  "Asia/Hong_Kong": "HKD",
  "Asia/Shanghai": "CNY",
  "Asia/Taipei": "TWD",
  "Asia/Bangkok": "THB",
  "Asia/Jakarta": "IDR",
  "Asia/Kuala_Lumpur": "MYR",
  "Asia/Ho_Chi_Minh": "VND",
  "Asia/New_Delhi": "INR",
  "Asia/Dhaka": "BDT",
  "Asia/Karachi": "PKR",
  "Asia/Dubai": "AED",
  "Asia/Riyadh": "SAR",
  "Asia/Qatar": "QAR",
  "Asia/Kuwait": "KWD",
  "Asia/Bahrain": "BHD",
  "Asia/Muscat": "OMR",
  "Asia/Amman": "JOD",
  "Asia/Jerusalem": "ILS",
  "Asia/Beirut": "LBP",
  "Europe/London": "GBP",
  "Europe/Paris": "EUR",
  "Europe/Berlin": "EUR",
  "Europe/Madrid": "EUR",
  "Europe/Rome": "EUR",
  "Europe/Amsterdam": "EUR",
  "Europe/Brussels": "EUR",
  "Europe/Vienna": "EUR",
  "Europe/Stockholm": "SEK",
  "Europe/Oslo": "NOK",
  "Europe/Copenhagen": "DKK",
  "Europe/Warsaw": "PLN",
  "Europe/Prague": "CZK",
  "Europe/Budapest": "HUF",
  "Europe/Moscow": "RUB",
  "Europe/Istanbul": "TRY",
  "Europe/Kiev": "UAH",
  "America/New_York": "USD",
  "America/Chicago": "USD",
  "America/Denver": "USD",
  "America/Los_Angeles": "USD",
  "America/Toronto": "CAD",
  "America/Vancouver": "CAD",
  "America/Mexico_City": "MXN",
  "America/Sao_Paulo": "BRL",
  "America/Argentina/Buenos_Aires": "ARS",
  "America/Santiago": "CLP",
  "America/Bogota": "COP",
  "Australia/Sydney": "AUD",
  "Australia/Melbourne": "AUD",
  "Pacific/Auckland": "NZD",
  "Pacific/Fiji": "FJD",
  "Africa/Johannesburg": "ZAR",
  "Africa/Lagos": "NGN",
  "Africa/Nairobi": "KES",
  "Africa/Cairo": "EGP",
};

function detectCurrency(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TZ_CURRENCY_MAP[tz]) return TZ_CURRENCY_MAP[tz];
    if (tz && tz.startsWith("Asia/")) return "PHP";
    if (tz && tz.startsWith("Europe/")) return "EUR";
    if (tz && tz.startsWith("America/")) return "USD";
    if (tz && tz.startsWith("Australia/")) return "AUD";
    if (tz && tz.startsWith("Pacific/")) return "NZD";
    if (tz && tz.startsWith("Africa/")) return "ZAR";
  } catch {}
  return "USD";
}

async function fetchRate(currency: string): Promise<number> {
  if (currency === "USD") return 1;
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();
    if (data.rates && data.rates[currency]) return data.rates[currency];
  } catch {}
  return 1;
}

export function useLocalCurrency() {
  const [currency, setCurrency] = useState("USD");
  const [rate, setRate] = useState(1);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const cur = detectCurrency();
    setCurrency(cur);
    fetchRate(cur).then((r) => { setRate(r); setLoaded(true); });
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
