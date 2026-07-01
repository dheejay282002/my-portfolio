"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface WebSettings {
  web_name: string;
  logo_type: "letter" | "image";
  logo_font: string;
  logo_image: string;
  logo_font_file: string;
  logo_color: string;
  accent_color: string;
  bg_color: string;
  body_font: string;
  body_font_size: string;
  body_font_file: string;
}

const defaultSettings: WebSettings = {
  web_name: "Dee Jay.",
  logo_type: "letter",
  logo_font: "Inter",
  logo_image: "",
  logo_font_file: "",
  logo_color: "#ffffff",
  accent_color: "#06b6d4",
  bg_color: "#09090b",
  body_font: "Inter",
  body_font_size: "medium",
  body_font_file: "",
};

interface WebSettingsContextValue {
  settings: WebSettings;
  loading: boolean;
}

const WebSettingsContext = createContext<WebSettingsContextValue>({
  settings: defaultSettings,
  loading: true,
});

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace(/^#/, "");
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    let hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function applyTheme(d: { settings: WebSettings }) {
  const accent = d.settings.accent_color || "#06b6d4";
  const bg = d.settings.bg_color || "#09090b";

  const { h, s, l } = hexToHsl(accent);
  const shade300 = hslToHex(h, s, Math.min(100, l + 12));
  const shade400 = hslToHex(h, s, Math.min(100, l + 6));
  const shade500 = accent;
  const shade600 = hslToHex(h, s, Math.max(0, l - 10));
  const shade700 = hslToHex(h, s, Math.max(0, l - 20));

  let bodyFont = d.settings.body_font || "Inter";
  if (d.settings.body_font_file) {
    bodyFont = "UploadedCustomBodyFont";
    const bodyStyleId = "dynamic-custom-body-font-style";
    let bodyStyle = document.getElementById(bodyStyleId) as HTMLStyleElement;
    if (!bodyStyle) {
      bodyStyle = document.createElement("style");
      bodyStyle.id = bodyStyleId;
      document.head.appendChild(bodyStyle);
    }
    const url = d.settings.body_font_file;
    let format = "woff2";
    if (url.toLowerCase().endsWith(".ttf")) format = "truetype";
    else if (url.toLowerCase().endsWith(".otf")) format = "opentype";
    else if (url.toLowerCase().endsWith(".woff")) format = "woff";

    bodyStyle.innerHTML = `
      @font-face {
        font-family: 'UploadedCustomBodyFont';
        src: url('${url}') format('${format}');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
    `;
  } else if (d.settings.body_font) {
    const bodyFontName = d.settings.body_font;
    const bodyLinkId = "dynamic-body-font-link";
    let bodyLink = document.getElementById(bodyLinkId) as HTMLLinkElement;
    if (!bodyLink) {
      bodyLink = document.createElement("link");
      bodyLink.id = bodyLinkId;
      bodyLink.rel = "stylesheet";
      document.head.appendChild(bodyLink);
    }
    bodyLink.href = `https://fonts.googleapis.com/css2?family=${bodyFontName.replace(/ /g, "+")}:wght@300;400;500;600;700&display=swap`;
  }

  const themeStyleId = "dynamic-theme-style-overrides";
  let themeStyle = document.getElementById(themeStyleId) as HTMLStyleElement;
  if (!themeStyle) {
    themeStyle = document.createElement("style");
    themeStyle.id = themeStyleId;
    document.head.appendChild(themeStyle);
  }
  themeStyle.innerHTML = `
    :root {
      --color-background: ${bg} !important;
      --color-cyan-300: ${shade300} !important;
      --color-cyan-400: ${shade400} !important;
      --color-cyan-500: ${shade500} !important;
      --color-cyan-600: ${shade600} !important;
      --color-cyan-700: ${shade700} !important;
      --color-blue-500: ${shade500} !important;
      --color-blue-600: ${shade600} !important;
      --color-blue-700: ${shade700} !important;
    }
    body {
      background: var(--color-background) !important;
      font-family: '${bodyFont}', sans-serif !important;
    }
    .font-selector-reset, 
    .font-selector-reset button:not(.font-preview-item), 
    .font-selector-reset input, 
    .font-selector-reset select, 
    .font-selector-reset textarea {
      font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
    }
  `;

  if (d.settings.logo_type === "letter") {
    if (d.settings.logo_font_file) {
      const styleId = "dynamic-custom-font-style";
      let style = document.getElementById(styleId) as HTMLStyleElement;
      if (!style) {
        style = document.createElement("style");
        style.id = styleId;
        document.head.appendChild(style);
      }
      const url = d.settings.logo_font_file;
      let format = "woff2";
      if (url.toLowerCase().endsWith(".ttf")) format = "truetype";
      else if (url.toLowerCase().endsWith(".otf")) format = "opentype";
      else if (url.toLowerCase().endsWith(".woff")) format = "woff";

      style.innerHTML = `
        @font-face {
          font-family: 'UploadedCustomFont';
          src: url('${url}') format('${format}');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;
    } else if (d.settings.logo_font) {
      const fontName = d.settings.logo_font;
      const linkId = "dynamic-logo-font-link";
      let link = document.getElementById(linkId) as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}:wght@400;700&display=swap`;
    }
  }
}

export function WebSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<WebSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    const handler = () => setTrigger((v) => v + 1);
    window.addEventListener("web-settings-updated", handler);
    const interval = setInterval(() => setTrigger((v) => v + 1), 15_000);
    return () => {
      window.removeEventListener("web-settings-updated", handler);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    fetch("/api/web-settings/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.settings) {
          setSettings(d.settings);
          applyTheme(d);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [trigger]);

  return (
    <WebSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </WebSettingsContext.Provider>
  );
}

export function useWebSettings() {
  return useContext(WebSettingsContext);
}
