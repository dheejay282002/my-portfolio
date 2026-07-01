"use client";

import { useEffect, useState, useRef } from "react";
import { Globe, Type, Image as ImageIcon, Upload, Check, AlertCircle, Search, FileText, Palette, Type as FontIcon, AlignLeft, ChevronDown } from "lucide-react";
import Skeleton from "@/components/Skeleton";

const fallbackFonts = [
  "Inter", "Roboto", "Montserrat", "Poppins", "Outfit", "Open Sans", "Lato",
  "Oswald", "Playfair Display", "Lora", "Raleway", "Nunito", "Merriweather",
  "Ubuntu", "PT Sans", "PT Serif", "Lobster", "Pacifico", "Great Vibes",
  "Sacramento", "Rochester", "Cinzel", "Bebas Neue", "Syne", "Cinzel Decorative",
  "Orbitron", "Press Start 2P", "Righteous", "Comfortaa", "Dancing Script",
  "Satisfy", "Shadows Into Light", "Allura", "Alex Brush", "Pinyon Script"
];

const logoPalettes = [
  { name: "White", hex: "#ffffff" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Purple", hex: "#a855f7" },
];

const accentPresets = [
  { name: "Cyan (Default)", hex: "#06b6d4" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Purple", hex: "#a855f7" },
];

const bgPresets = [
  { name: "Default Zinc", hex: "#09090b" },
  { name: "Pure Black", hex: "#000000" },
  { name: "Charcoal", hex: "#121212" },
  { name: "Midnight Blue", hex: "#0f172a" },
  { name: "Dark Plum", hex: "#181024" },
];

const fontSizes = [
  { label: "Small (14px)", value: "small" },
  { label: "Medium (16px)", value: "medium" },
  { label: "Large (18px)", value: "large" },
  { label: "Extra Large (20px)", value: "xl" },
];

export default function WebSettingsPage() {
  const [form, setForm] = useState({
    web_name: "Dee Jay.",
    logo_type: "letter" as "letter" | "image",
    logo_font: "Inter",
    logo_image: "",
    logo_font_file: "",
    logo_color: "#ffffff",
    accent_color: "#06b6d4",
    bg_color: "#09090b",
    body_font: "Inter",
    body_font_size: "medium",
    body_font_file: "",
  });

  const [initialForm, setInitialForm] = useState<typeof form | null>(null);

  const [fontSource, setFontSource] = useState<"google" | "custom">("google");
  const [bodyFontSource, setBodyFontSource] = useState<"google" | "custom">("google");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [fonts, setFonts] = useState<string[]>(fallbackFonts);
  const [search, setSearch] = useState("");
  const [bodySearch, setBodySearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fontUploading, setFontUploading] = useState(false);
  const [bodyFontUploading, setBodyFontUploading] = useState(false);
  const [uploadedFonts, setUploadedFonts] = useState<{ font_name: string; font_url: string; font_weight: string; font_style: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [logoFontMenuOpen, setLogoFontMenuOpen] = useState(false);
  const [bodyFontMenuOpen, setBodyFontMenuOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fontFileInputRef = useRef<HTMLInputElement>(null);
  const bodyFontFileInputRef = useRef<HTMLInputElement>(null);
  const libraryFileInputRef = useRef<HTMLInputElement>(null);

  const injectLibraryFonts = (fontsList: Array<{ font_name: string; font_url: string; font_weight?: string; font_style?: string }>) => {
    fontsList.forEach((f) => {
      const styleId = `library-font-${f.font_name.replace(/ /g, "-")}`;
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        let format = "woff2";
        const url = f.font_url;
        if (url.toLowerCase().endsWith(".ttf")) format = "truetype";
        else if (url.toLowerCase().endsWith(".otf")) format = "opentype";
        else if (url.toLowerCase().endsWith(".woff")) format = "woff";
        style.innerHTML = `
          @font-face {
            font-family: 'UploadedLibraryFont-${f.font_name}';
            src: url('${url}') format('${format}');
            font-weight: ${f.font_weight || "normal"};
            font-style: ${f.font_style || "normal"};
            font-display: swap;
          }
        `;
        document.head.appendChild(style);
      }
    });
  };

  const updateUploadedFonts = (fontsList: Array<{ font_name: string; font_url: string; font_weight?: string; font_style?: string }>) => {
    setUploadedFonts(fontsList as any);
    injectLibraryFonts(fontsList);
  };

  // Fetch settings from API
  useEffect(() => {
    fetch("/api/admin/web-settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.settings) {
          const hasCustomFont = !!data.settings.logo_font_file;
          const hasCustomBodyFont = !!data.settings.body_font_file;
          const fetchedForm = {
            web_name: data.settings.web_name || "Dee Jay.",
            logo_type: data.settings.logo_type || "letter",
            logo_font: data.settings.logo_font || "Inter",
            logo_image: data.settings.logo_image || "",
            logo_font_file: data.settings.logo_font_file || "",
            logo_color: data.settings.logo_color || "#ffffff",
            accent_color: data.settings.accent_color || "#06b6d4",
            bg_color: data.settings.bg_color || "#09090b",
            body_font: data.settings.body_font || "Inter",
            body_font_size: data.settings.body_font_size || "medium",
            body_font_file: data.settings.body_font_file || "",
          };
          setForm(fetchedForm);
          setInitialForm(fetchedForm);
          setFontSource(hasCustomFont ? "custom" : "google");
          setBodyFontSource(hasCustomBodyFont ? "custom" : "google");

          if (hasCustomFont) {
            loadCustomFont(data.settings.logo_font_file);
          } else {
            loadFont(data.settings.logo_font || "Inter");
          }

          if (hasCustomBodyFont) {
            loadCustomBodyFont(data.settings.body_font_file);
          } else {
            loadBodyFont(data.settings.body_font || "Inter");
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch library of previously uploaded fonts
    const loadLibrary = () => {
      fetch("/api/admin/uploaded-fonts", { credentials: "include" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.fonts) updateUploadedFonts(data.fonts);
        })
        .catch((err) => console.warn("Failed to load uploaded fonts:", err));
    };
    loadLibrary();
  }, []);

  // Fetch fonts list from Google Fonts mirror
  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/gh/hasinhayder/google-fonts/fonts.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          let list: string[] = [];
          if (Array.isArray(data)) {
            list = data.map((f: any) => typeof f === "string" ? f : f.family || f.name);
          } else if (typeof data === "object") {
            list = Object.keys(data);
          }
          if (list.length > 0) {
            const unique = Array.from(new Set([...fallbackFonts, ...list]));
            setFonts(unique.sort());
          }
        }
      })
      .catch((err) => console.warn("Could not fetch online fonts list, using fallbacks:", err));
  }, []);

  const filteredFonts = Array.from(new Set([
    ...uploadedFonts.map((f) => f.font_name),
    ...fonts
  ])).filter((f) =>
    f.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 100);

  const filteredBodyFonts = Array.from(new Set([
    ...uploadedFonts.map((f) => f.font_name),
    ...fonts
  ])).filter((f) =>
    f.toLowerCase().includes(bodySearch.toLowerCase())
  ).slice(0, 100);

  // Dynamically load preview stylesheets for visible logo search results in the dropdown
  useEffect(() => {
    if (filteredFonts.length === 0) return;
    const linkId = "visible-logo-fonts-preview-link";
    let link = document.getElementById(linkId) as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    // Limit to top 20 visible fonts in query to optimize loading
    const families = filteredFonts.slice(0, 20).map((f) => `family=${f.replace(/ /g, "+")}`).join("&");
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  }, [search, filteredFonts.length]);

  // Dynamically load preview stylesheets for visible body search results in the dropdown
  useEffect(() => {
    if (filteredBodyFonts.length === 0) return;
    const linkId = "visible-body-fonts-preview-link";
    let link = document.getElementById(linkId) as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    const families = filteredBodyFonts.slice(0, 20).map((f) => `family=${f.replace(/ /g, "+")}`).join("&");
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  }, [bodySearch, filteredBodyFonts.length]);

  // Helper to dynamically load a Google Font link in the head for Logo
  const loadFont = (fontName: string) => {
    const linkId = "preview-google-font";
    let link = document.getElementById(linkId) as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}:wght@400;700&display=swap`;
  };

  // Helper to load Google Font for Website Body
  const loadBodyFont = (fontName: string) => {
    const linkId = "dynamic-body-font-link";
    let link = document.getElementById(linkId) as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}:wght@300;400;500;600;700&display=swap`;
  };

  // Helper to inject custom font style for Logo
  const loadCustomFont = (url: string) => {
    const styleId = "preview-custom-font";
    let style = document.getElementById(styleId) as HTMLStyleElement;
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }
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
      }
    `;
  };

  // Helper to inject custom font style for Body
  const loadCustomBodyFont = (url: string) => {
    const styleId = "preview-custom-body-font";
    let style = document.getElementById(styleId) as HTMLStyleElement;
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }
    let format = "woff2";
    if (url.toLowerCase().endsWith(".ttf")) format = "truetype";
    else if (url.toLowerCase().endsWith(".otf")) format = "opentype";
    else if (url.toLowerCase().endsWith(".woff")) format = "woff";

    style.innerHTML = `
      @font-face {
        font-family: 'UploadedCustomBodyFont';
        src: url('${url}') format('${format}');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
    `;
  };

  const handleFontSelect = (font: string) => {
    setForm((prev) => ({ ...prev, logo_font: font }));
    loadFont(font);
  };

  const handleBodyFontSelect = (font: string) => {
    setForm((prev) => ({ ...prev, body_font: font }));
    loadBodyFont(font);
  };

  // Real-time live theme preview of accent, background, body font, and body font changes
  useEffect(() => {
    if (loading) return;
    const accent = form.accent_color || "#06b6d4";
    const bg = form.bg_color || "#09090b";

    const { h, s, l } = hexToHsl(accent);
    const shade300 = hslToHex(h, s, Math.min(100, l + 12));
    const shade400 = hslToHex(h, s, Math.min(100, l + 6));
    const shade500 = accent;
    const shade600 = hslToHex(h, s, Math.max(0, l - 10));
    const shade700 = hslToHex(h, s, Math.max(0, l - 20));
    const bodyFont = bodyFontSource === "custom" && form.body_font_file ? "UploadedCustomBodyFont" : form.body_font;
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
        --font-sans: '${bodyFont}', sans-serif !important;
      }
      body {
        background: var(--color-background) !important;
        font-family: var(--font-sans) !important;
      }
      .font-selector-reset, 
      .font-selector-reset button:not(.font-preview-item), 
      .font-selector-reset input, 
      .font-selector-reset select, 
      .font-selector-reset textarea {
        --font-sans: 'Inter', system-ui, -apple-system, sans-serif !important;
        font-family: var(--font-sans) !important;
      }
    `;
  }, [form.accent_color, form.bg_color, form.body_font, form.body_font_file, bodyFontSource, loading]);

  // Image Logo Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setSaveStatus(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm((prev) => ({ ...prev, logo_image: data.url }));
        setSaveStatus({ type: "success", message: "Logo image uploaded to preview! Click 'Save Settings' to apply." });
      } else {
        setSaveStatus({ type: "error", message: data.error || "Upload failed." });
      }
    } catch {
      setSaveStatus({ type: "error", message: "An error occurred while uploading." });
    } finally {
      setUploading(false);
    }
  };

  // Custom Font File Upload handler for Logo
  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFontUploading(true);
    setSaveStatus(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        const originalName = file.name || "Custom Font";
        const fontName = originalName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setForm((prev) => ({
          ...prev,
          logo_font: fontName,
          logo_font_file: data.url
        }));
        loadCustomFont(data.url);
        setSaveStatus({ type: "success", message: "Logo font file uploaded to preview! Click 'Save Settings' to apply." });
        // Add/merge into local uploaded fonts immediately
        setUploadedFonts((prev) => {
          const lower = originalName.replace(/\.[^/.]+$/, "").toLowerCase();
          let fw = "normal", fs = "normal";
          if (/italic/i.test(lower)) fs = "italic";
          if (/bold/i.test(lower)) fw = "bold";
          const entry = { font_name: fontName, font_url: data.url, font_weight: fw, font_style: fs };
          const idx = prev.findIndex((f) => f.font_name === fontName);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = entry;
            return updated;
          }
          return [...prev, entry];
        });
        injectLibraryFonts([{ font_name: fontName, font_url: data.url }]);
        fetch("/api/admin/uploaded-fonts")
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d?.fonts) updateUploadedFonts(d.fonts);
          });
      } else {
        setSaveStatus({ type: "error", message: data.error || "Font upload failed." });
      }
    } catch {
      setSaveStatus({ type: "error", message: "An error occurred while uploading font." });
    } finally {
      setFontUploading(false);
    }
  };

  // Custom Font File Upload handler for Website Body text
  const handleBodyFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBodyFontUploading(true);
    setSaveStatus(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        const nameNoExt = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setForm((prev) => ({ ...prev, body_font: nameNoExt, body_font_file: data.url }));
        loadCustomBodyFont(data.url);
        setSaveStatus({ type: "success", message: "Website custom font file uploaded to preview! Click 'Save Settings' to apply." });
        // Add/merge into local uploaded fonts immediately
        setUploadedFonts((prev) => {
          const lower = file.name.replace(/\.[^/.]+$/, "").toLowerCase();
          let fw = "normal", fs = "normal";
          if (/italic/i.test(lower)) fs = "italic";
          if (/bold/i.test(lower)) fw = "bold";
          const entry = { font_name: nameNoExt, font_url: data.url, font_weight: fw, font_style: fs };
          const idx = prev.findIndex((f) => f.font_name === nameNoExt);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = entry;
            return updated;
          }
          return [...prev, entry];
        });
        injectLibraryFonts([{ font_name: nameNoExt, font_url: data.url }]);
        fetch("/api/admin/uploaded-fonts")
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d?.fonts) updateUploadedFonts(d.fonts);
          });
      } else {
        setSaveStatus({ type: "error", message: data.error || "Website font upload failed." });
      }
    } catch {
      setSaveStatus({ type: "error", message: "An error occurred while uploading website font." });
    } finally {
      setBodyFontUploading(false);
    }
  };

  // Batch Drag-and-Drop library font uploader
  const handleFontFiles = async (files: FileList) => {
    setUploading(true);
    setSaveStatus(null);
    let successCount = 0;
    let failCount = 0;
    const newFonts: Array<{ font_name: string; font_url: string; font_weight: string; font_style: string }> = [];

    const uploadPromises = Array.from(files).map(async (file) => {
      const isFont = /\.(ttf|otf|woff|woff2)$/i.test(file.name);
      if (!isFont) {
        failCount++;
        return;
      }

      const nameNoExt = file.name.replace(/\.[^/.]+$/, "");
      const fontName = nameNoExt.replace(/[-_]/g, " ");
      const lower = nameNoExt.toLowerCase();
      let fontWeight = "normal";
      let fontStyle = "normal";
      if (/italic/i.test(lower)) fontStyle = "italic";
      if (/bold/i.test(lower)) fontWeight = "bold";
      else if (/black/i.test(lower)) fontWeight = "900";
      else if (/extrabold|extra bold/i.test(lower)) fontWeight = "800";
      else if (/semibold|semi bold|demibold|demi bold/i.test(lower)) fontWeight = "600";
      else if (/medium/i.test(lower)) fontWeight = "500";
      else if (/light/i.test(lower)) fontWeight = "300";
      else if (/thin/i.test(lower)) fontWeight = "100";

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.url) {
          successCount++;
          newFonts.push({ font_name: fontName, font_url: data.url, font_weight: fontWeight, font_style: fontStyle });
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    });

    await Promise.all(uploadPromises);

    // Add/merge immediately to local state so library dropdown shows right away
    if (newFonts.length > 0) {
      setUploadedFonts((prev) => {
        const merged = [...prev];
        for (const nf of newFonts) {
          const idx = merged.findIndex((f) => f.font_name === nf.font_name);
          if (idx >= 0) {
            merged[idx] = nf; // replace (merge) with new file
          } else {
            merged.push(nf);
          }
        }
        return merged;
      });
      // Inject @font-face for each new font
      injectLibraryFonts(newFonts);
    }

    // Try refreshing from server as a backup reconciliation
    fetch("/api/admin/uploaded-fonts")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.fonts) updateUploadedFonts(d.fonts);
      })
      .catch(() => {});

    setUploading(false);
    if (successCount > 0) {
      setSaveStatus({
        type: "success",
        message: `Successfully uploaded ${successCount} fonts to your library! ${failCount > 0 ? `(${failCount} files failed)` : ""}`
      });
    } else {
      setSaveStatus({
        type: "error",
        message: "Failed to upload any fonts. Make sure they are valid font files (.ttf, .otf, .woff, .woff2)."
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus(null);

    const updatedForm = {
      ...form,
      logo_font_file: fontSource === "custom" ? form.logo_font_file : "",
      body_font_file: bodyFontSource === "custom" ? form.body_font_file : "",
    };

    try {
      const res = await fetch("/api/admin/web-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedForm),
      });
      const data = await res.json();
      if (res.ok) {
        setForm(updatedForm);
        setInitialForm(updatedForm);
        setSaveStatus({ type: "success", message: "Web configurations saved successfully!" });
        window.dispatchEvent(new CustomEvent("web-settings-updated"));
      } else {
        setSaveStatus({ type: "error", message: data.error || "Failed to save configuration." });
      }
    } catch {
      setSaveStatus({ type: "error", message: "An error occurred while saving." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-10 max-w-2xl mx-auto space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-5">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-24 w-24 rounded-xl" />
            <Skeleton className="h-10 flex-1 rounded-xl" />
          </div>
        </div>
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-5">
          <Skeleton className="h-4 w-36" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-5">
          <Skeleton className="h-4 w-28" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <Skeleton className="h-11 w-40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Globe className="h-6 w-6 text-cyan-400" />
          Web Site Configuration
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Customize your brand logo, name, color themes, backgrounds, typography, and font sizes.
        </p>

        <form onSubmit={handleSave} className="mt-10 space-y-6">
          {/* Section 1: General Brand Info */}
          <div className="glass rounded-2xl p-6 border border-white/5 space-y-6">
            <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">General Brand</h2>

            <div>
              <label className="mb-2 block text-xs text-zinc-500">Website Name / Brand Title</label>
              <input
                type="text"
                required
                value={form.web_name}
                onChange={(e) => setForm({ ...form, web_name: e.target.value })}
                placeholder="Dee Jay."
                className="glass w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Section 2: Logo Style Choice */}
          <div className="glass rounded-2xl p-6 border border-white/5 space-y-6">
            <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Logo Style</h2>

            <div>
              <label className="mb-3 block text-xs text-zinc-500">Logo Type Selection</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, logo_type: "letter" })}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                    form.logo_type === "letter"
                      ? "border-cyan-500/50 bg-cyan-500/5 text-cyan-400"
                      : "border-white/5 bg-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  <Type className="h-6 w-6" />
                  <span className="text-xs font-semibold">Letter / Word Logo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, logo_type: "image" })}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                    form.logo_type === "image"
                      ? "border-cyan-500/50 bg-cyan-500/5 text-cyan-400"
                      : "border-white/5 bg-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-xs font-semibold">Image Logo</span>
                </button>
              </div>
            </div>

            {/* Custom logo settings */}
            {form.logo_type === "letter" && (
              <div className="space-y-6 pt-4 border-t border-white/5 font-selector-reset">
                <div>
                  <label className="mb-3 block text-xs text-zinc-500">Font Source Options</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setFontSource("google")}
                      className={`flex-1 rounded-xl py-2.5 text-xs font-semibold border transition-all ${
                        fontSource === "google"
                          ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                          : "border-white/5 bg-white/5 text-zinc-400 hover:text-white"
                      }`}
                    >
                      Google Fonts CDN
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSource("custom")}
                      className={`flex-1 rounded-xl py-2.5 text-xs font-semibold border transition-all ${
                        fontSource === "custom"
                          ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                          : "border-white/5 bg-white/5 text-zinc-400 hover:text-white"
                      }`}
                    >
                      Upload Custom Font File
                    </button>
                  </div>
                </div>

                {fontSource === "google" ? (
                  <div>
                    <label className="mb-2 block text-xs text-zinc-500">Search and Select Logo Font Family (Rendered in font style)</label>
                    <div className="relative mb-3">
                      <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-500" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search Google Fonts (e.g. Pacifico, Poppins, Syne...)"
                        className="glass w-full rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto rounded-xl border border-white/5 bg-zinc-950/60 p-2 space-y-1 scrollbar-hide">
                      {filteredFonts.map((font) => {
                        const found = uploadedFonts.find((f) => f.font_name === font);
                        const isUploaded = !!found;
                        return (
                          <button
                            key={font}
                            type="button"
                            onClick={() => {
                              if (found) {
                                setForm((prev) => ({
                                  ...prev,
                                  logo_font: found.font_name,
                                  logo_font_file: found.font_url
                                }));
                                setFontSource("custom");
                                loadCustomFont(found.font_url);
                                setSaveStatus({ type: "success", message: `Selected '${found.font_name}' from library. Click 'Save Settings' to apply.` });
                              } else {
                                handleFontSelect(font);
                              }
                            }}
                            className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all font-preview-item ${
                              form.logo_font === font
                                ? "bg-cyan-500/10 text-cyan-400 font-semibold"
                                : "text-zinc-400 hover:bg-white/5 hover:text-white"
                            }`}
                            style={{
                              fontFamily: isUploaded 
                                ? `'UploadedLibraryFont-${font}', sans-serif`
                                : `'${font}', sans-serif`,
                              fontStyle: found?.font_style === "italic" ? "italic" : "normal",
                              fontWeight: found?.font_weight || "normal"
                            }}
                          >
                            <span>{font}</span>
                            {isUploaded && (
                              <span className="flex items-center gap-1.5">
                                {found?.font_style === "italic" && <span className="text-cyan-400 text-[10px] font-semibold italic">Italic</span>}
                                {found?.font_weight !== "normal" && <span className="text-cyan-400 text-[10px] font-semibold">{found?.font_weight}</span>}
                                <span className="italic text-cyan-400 text-xs font-semibold">UPLOADED</span>
                              </span>
                            )}
                          </button>
                        );
                      })}
                      {filteredFonts.length === 0 && (
                        <p className="text-xs text-zinc-600 text-center py-4">No fonts matched search.</p>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 flex items-center gap-1.5">
                      Selected Font: <strong className="text-zinc-300">{form.logo_font}</strong>
                      {form.logo_font_file && <span className="italic text-cyan-400 font-semibold">(Uploaded Font)</span>}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-xs text-zinc-500">Upload Font File (.ttf, .otf, .woff, .woff2)</label>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => fontFileInputRef.current?.click()}
                          className="flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm font-semibold text-white border border-white/5 transition-all"
                        >
                          <Upload className="h-4 w-4" />
                          {fontUploading ? "Uploading..." : "Upload Font File"}
                        </button>
                        <input
                          ref={fontFileInputRef}
                          type="file"
                          accept=".ttf,.otf,.woff,.woff2"
                          onChange={handleFontUpload}
                          className="hidden"
                        />
                        <input
                          type="text"
                          value={form.logo_font_file}
                          onChange={(e) => {
                            setForm({ ...form, logo_font_file: e.target.value });
                            loadCustomFont(e.target.value);
                          }}
                          placeholder="Font URL (Uploaded automatically)"
                          className="glass flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                        />
                      </div>
                    </div>
                    {form.logo_font_file && (
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <FileText className="h-4 w-4 text-cyan-400" />
                        <span>Font file successfully saved to Cloudinary CDN storage.</span>
                      </div>
                    )}

                    {uploadedFonts.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <label className="block text-xs text-zinc-500">Or Select a Previously Uploaded Font</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setLogoFontMenuOpen(!logoFontMenuOpen)}
                            className="glass flex items-center justify-between w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50 text-left"
                          >
                            {form.logo_font_file ? (
                              <div className="flex items-center justify-between w-full">
                                <span style={{
                                  fontFamily: `'UploadedLibraryFont-${form.logo_font}', sans-serif`,
                                  fontStyle: uploadedFonts.find((f) => f.font_name === form.logo_font)?.font_style === "italic" ? "italic" : "normal",
                                  fontWeight: uploadedFonts.find((f) => f.font_name === form.logo_font)?.font_weight || "normal"
                                }}>{form.logo_font}</span>
                                <span className="italic text-cyan-400 text-xs font-semibold">UPLOADED FONTS</span>
                              </div>
                            ) : (
                              <span className="text-zinc-500">-- Choose from uploaded library --</span>
                            )}
                            <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0 ml-2" />
                          </button>

                          {logoFontMenuOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setLogoFontMenuOpen(false)} />
                              <div className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-white/10 bg-zinc-950/95 p-1 max-h-60 overflow-y-auto scrollbar-hide shadow-2xl">
                                {uploadedFonts.map((f) => (
                                  <button
                                    key={f.font_url}
                                    type="button"
                                    onClick={() => {
                                      setForm((prev) => ({
                                        ...prev,
                                        logo_font: f.font_name,
                                        logo_font_file: f.font_url
                                      }));
                                      setFontSource("custom");
                                      loadCustomFont(f.font_url);
                                      setLogoFontMenuOpen(false);
                                      setSaveStatus({ type: "success", message: `Selected '${f.font_name}' from library. Click 'Save Settings' to apply.` });
                                    }}
                                    className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-left hover:bg-white/5 text-zinc-300 hover:text-white transition-all font-preview-item"
                                  >
                                    <span style={{ fontFamily: `'UploadedLibraryFont-${f.font_name}', sans-serif`, fontStyle: f.font_style === "italic" ? "italic" : "normal", fontWeight: f.font_weight }}>{f.font_name}</span>
                                    <span className="flex items-center gap-1.5">
                                      {f.font_style === "italic" && <span className="text-cyan-400 text-xs font-semibold italic">Italic</span>}
                                      {f.font_weight !== "normal" && <span className="text-cyan-400 text-xs font-semibold">{f.font_weight}</span>}
                                      <span className="italic text-zinc-500 text-xs font-normal">UPLOADED</span>
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Color Paletting and Custom Color Picker */}
                <div className="pt-4 border-t border-white/5 space-y-4">
                  <label className="block text-xs text-zinc-500 flex items-center gap-1.5">
                    <Palette className="h-4 w-4 text-cyan-400" />
                    Logo Font Color Settings
                  </label>

                  {/* Quick-select premium palette colors */}
                  <div className="flex flex-wrap gap-2.5">
                    {logoPalettes.map((palette) => (
                      <button
                        key={palette.hex}
                        type="button"
                        onClick={() => setForm({ ...form, logo_color: palette.hex })}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95`}
                        style={{
                          backgroundColor: palette.hex,
                          borderColor: form.logo_color === palette.hex ? "rgba(6, 182, 212, 0.8)" : "rgba(255, 255, 255, 0.15)",
                          boxShadow: form.logo_color === palette.hex ? "0 0 12px rgba(6, 182, 212, 0.4)" : "none"
                        }}
                        title={palette.name}
                      >
                        {form.logo_color === palette.hex && (
                          <Check className={`h-4 w-4 ${palette.hex === "#ffffff" ? "text-black" : "text-white"}`} />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom color picker */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-transparent">
                      <input
                        type="color"
                        value={form.logo_color}
                        onChange={(e) => setForm({ ...form, logo_color: e.target.value })}
                        className="absolute -inset-2 h-14 w-14 cursor-pointer border-0 bg-transparent"
                      />
                    </div>
                    <input
                      type="text"
                      maxLength={7}
                      value={form.logo_color}
                      onChange={(e) => setForm({ ...form, logo_color: e.target.value })}
                      placeholder="#ffffff"
                      className="glass rounded-xl px-4 py-2.5 text-sm text-white max-w-[120px] placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                {/* Font logo preview box */}
                <div>
                  <label className="mb-2 block text-xs text-zinc-500">Logo Live Preview</label>
                  <div className="rounded-xl border border-white/5 p-8 flex items-center justify-center bg-zinc-950/60 min-h-24">
                    <span
                      style={{
                        fontFamily: fontSource === "custom" && form.logo_font_file ? "UploadedCustomFont" : form.logo_font,
                        color: form.logo_color
                      }}
                      className="text-3xl font-bold tracking-tight text-white"
                    >
                      {form.web_name}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {form.logo_type === "image" && (
              <div className="space-y-6 pt-4 border-t border-white/5">
                <div>
                  <label className="mb-2 block text-xs text-zinc-500">Logo Image Upload</label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm font-semibold text-white border border-white/5 transition-all"
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? "Uploading..." : "Upload Logo Image"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <input
                      type="text"
                      value={form.logo_image}
                      onChange={(e) => setForm({ ...form, logo_image: e.target.value })}
                      placeholder="Or paste image URL"
                      className="glass flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                {/* Image logo preview box */}
                {form.logo_image && (
                  <div>
                    <label className="mb-2 block text-xs text-zinc-500">Logo Image Preview</label>
                    <div className="rounded-xl border border-white/5 p-8 flex flex-col items-center justify-center bg-zinc-950/60 min-h-24 gap-4">
                      <img src={form.logo_image} alt="Logo" className="h-10 max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-400 border border-cyan-500/20 transition-all font-selector-reset"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Change Logo Image
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Web Site Theme Customization */}
          <div className="glass rounded-2xl p-6 border border-white/5 space-y-6">
            <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider text-left">Web Site Theme</h2>

            {/* Accent Color */}
            <div className="space-y-3">
              <label className="block text-xs text-zinc-500 flex items-center gap-1.5">
                <Palette className="h-4 w-4 text-cyan-400" />
                Accent Color Highlight (Replaces default Blue/Cyan highlights)
              </label>
              <div className="flex flex-wrap gap-2.5">
                {accentPresets.map((palette) => (
                  <button
                    key={palette.hex}
                    type="button"
                    onClick={() => setForm({ ...form, accent_color: palette.hex })}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: palette.hex,
                      borderColor: form.accent_color === palette.hex ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.15)",
                      boxShadow: form.accent_color === palette.hex ? `0 0 12px ${palette.hex}` : "none"
                    }}
                    title={palette.name}
                  >
                    {form.accent_color === palette.hex && (
                      <Check className="h-4 w-4 text-white drop-shadow" />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-transparent">
                  <input
                    type="color"
                    value={form.accent_color}
                    onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                    className="absolute -inset-2 h-14 w-14 cursor-pointer border-0 bg-transparent"
                  />
                </div>
                <input
                  type="text"
                  maxLength={7}
                  value={form.accent_color}
                  onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                  placeholder="#06b6d4"
                  className="glass rounded-xl px-4 py-2.5 text-sm text-white max-w-[120px] placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* Background Color */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <label className="block text-xs text-zinc-500 flex items-center gap-1.5">
                <Palette className="h-4 w-4 text-cyan-400" />
                Theme Background Color (Replaces default zinc-950 black background)
              </label>
              <div className="flex flex-wrap gap-2.5">
                {bgPresets.map((palette) => (
                  <button
                    key={palette.hex}
                    type="button"
                    onClick={() => setForm({ ...form, bg_color: palette.hex })}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: palette.hex,
                      borderColor: form.bg_color === palette.hex ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.15)",
                      boxShadow: form.bg_color === palette.hex ? `0 0 12px ${palette.hex}` : "none"
                    }}
                    title={palette.name}
                  >
                    {form.bg_color === palette.hex && (
                      <Check className="h-4 w-4 text-white drop-shadow" />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-transparent">
                  <input
                    type="color"
                    value={form.bg_color}
                    onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
                    className="absolute -inset-2 h-14 w-14 cursor-pointer border-0 bg-transparent"
                  />
                </div>
                <input
                  type="text"
                  maxLength={7}
                  value={form.bg_color}
                  onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
                  placeholder="#09090b"
                  className="glass rounded-xl px-4 py-2.5 text-sm text-white max-w-[120px] placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Website Typography Customization */}
          <div className="glass rounded-2xl p-6 border border-white/5 space-y-6 font-selector-reset">
            <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider text-left">Website Typography</h2>

            {/* Font source toggle */}
            <div>
              <label className="mb-3 block text-xs text-zinc-500">Website Font Source Options</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setBodyFontSource("google")}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-semibold border transition-all ${
                    bodyFontSource === "google"
                      ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                      : "border-white/5 bg-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  Google Fonts CDN
                </button>
                <button
                  type="button"
                  onClick={() => setBodyFontSource("custom")}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-semibold border transition-all ${
                    bodyFontSource === "custom"
                      ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                      : "border-white/5 bg-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  Library Fonts
                </button>
              </div>
            </div>

            {/* Body Font Family */}
            {bodyFontSource === "google" ? (
              <div className="space-y-3">
                <label className="block text-xs text-zinc-500 flex items-center gap-1.5">
                  <FontIcon className="h-4 w-4 text-cyan-400" />
                  Global Body Font Family (Rendered in font style)
                </label>

                <div className="relative mb-3">
                  <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={bodySearch}
                    onChange={(e) => setBodySearch(e.target.value)}
                    placeholder="Search and preview body fonts (e.g. Montserrat, Poppins...)"
                    className="glass w-full rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-white/5 bg-zinc-950/60 p-2 space-y-1 scrollbar-hide">
                  {filteredBodyFonts.map((font) => {
                    const found = uploadedFonts.find((f) => f.font_name === font);
                    const isUploaded = !!found;
                    return (
                      <button
                        key={font}
                        type="button"
                        onClick={() => {
                          if (found) {
                            setForm((prev) => ({
                              ...prev,
                              body_font: found.font_name,
                              body_font_file: found.font_url
                            }));
                            setBodyFontSource("custom");
                            loadCustomBodyFont(found.font_url);
                            setSaveStatus({ type: "success", message: `Selected '${found.font_name}' from library. Click 'Save Settings' to apply.` });
                          } else {
                            handleBodyFontSelect(font);
                          }
                        }}
                        className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all font-preview-item ${
                          form.body_font === font
                            ? "bg-cyan-500/10 text-cyan-400 font-semibold"
                            : "text-zinc-400 hover:bg-white/5 hover:text-white"
                        }`}
                        style={{
                          fontFamily: isUploaded 
                            ? `'UploadedLibraryFont-${font}', sans-serif`
                            : `'${font}', sans-serif`,
                          fontStyle: found?.font_style === "italic" ? "italic" : "normal",
                          fontWeight: found?.font_weight || "normal"
                        }}
                      >
                        <span>{font}</span>
                        {isUploaded && (
                          <span className="flex items-center gap-1.5">
                            {found?.font_style === "italic" && <span className="text-cyan-400 text-[10px] font-semibold italic">Italic</span>}
                            {found?.font_weight !== "normal" && <span className="text-cyan-400 text-[10px] font-semibold">{found?.font_weight}</span>}
                            <span className="italic text-cyan-400 text-xs font-semibold">UPLOADED</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {filteredBodyFonts.length === 0 && (
                    <p className="text-xs text-zinc-600 text-center py-4">No fonts matched search.</p>
                  )}
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Active Website Font: <strong className="text-zinc-300">{form.body_font}</strong>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {uploadedFonts.length > 0 ? (
                  <div className="space-y-2">
                    <label className="block text-xs text-zinc-500">Select a Previously Uploaded Font</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setBodyFontMenuOpen(!bodyFontMenuOpen)}
                        className="glass flex items-center justify-between w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50 text-left"
                      >
                        {form.body_font_file ? (
                          <div className="flex items-center justify-between w-full">
                            <span style={{
                              fontFamily: `'UploadedLibraryFont-${form.body_font}', sans-serif`,
                              fontStyle: uploadedFonts.find((f) => f.font_name === form.body_font)?.font_style === "italic" ? "italic" : "normal",
                              fontWeight: uploadedFonts.find((f) => f.font_name === form.body_font)?.font_weight || "normal"
                            }}>{form.body_font}</span>
                            <span className="italic text-cyan-400 text-xs font-semibold">UPLOADED FONTS</span>
                          </div>
                        ) : (
                          <span className="text-zinc-500">-- Choose from uploaded library --</span>
                        )}
                        <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0 ml-2" />
                      </button>

                      {bodyFontMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setBodyFontMenuOpen(false)} />
                          <div className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-white/10 bg-zinc-950/95 p-1 max-h-60 overflow-y-auto scrollbar-hide shadow-2xl">
                            {uploadedFonts.map((f) => (
                              <button
                                key={f.font_url}
                                type="button"
                                onClick={() => {
                                  setForm((prev) => ({
                                    ...prev,
                                    body_font: f.font_name,
                                    body_font_file: f.font_url
                                  }));
                                  setBodyFontSource("custom");
                                  loadCustomBodyFont(f.font_url);
                                  setBodyFontMenuOpen(false);
                                  setSaveStatus({ type: "success", message: `Selected '${f.font_name}' from library. Click 'Save Settings' to apply.` });
                                }}
                                className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-left hover:bg-white/5 text-zinc-300 hover:text-white transition-all font-preview-item"
                              >
                                <span style={{ fontFamily: `'UploadedLibraryFont-${f.font_name}', sans-serif`, fontStyle: f.font_style === "italic" ? "italic" : "normal", fontWeight: f.font_weight }}>{f.font_name}</span>
                                <span className="flex items-center gap-1.5">
                                  {f.font_style === "italic" && <span className="text-cyan-400 text-xs font-semibold italic">Italic</span>}
                                  {f.font_weight !== "normal" && <span className="text-cyan-400 text-xs font-semibold">{f.font_weight}</span>}
                                  <span className="italic text-zinc-500 text-xs font-normal">UPLOADED</span>
                                </span>
                              </button>
                               ))}
                             </div>
                           </>
                         )}
                       </div>
                     </div>
                ) : (
                  <p className="text-xs text-zinc-500 py-4 text-center">No fonts uploaded in library yet. Use the uploader tool below to add fonts.</p>
                )}
                {form.body_font_file && (
                  <p className="mt-2 text-xs text-zinc-500 flex items-center gap-1.5">
                    Active Website Font: <strong className="text-zinc-300">{form.body_font}</strong> <span className="italic text-cyan-400 font-semibold">(Uploaded Font)</span>
                  </p>
                )}
              </div>
            )}

            {/* Drag & Drop Font Library Manager */}
            <div className="pt-6 border-t border-white/5 space-y-4">
              <label className="block text-xs text-zinc-500 flex items-center gap-1.5">
                <Upload className="h-4 w-4 text-cyan-400" />
                Upload New Fonts to Library (Drag & Drop Multiple Files)
              </label>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files) {
                    await handleFontFiles(e.dataTransfer.files);
                  }
                }}
                onClick={() => libraryFileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? "border-cyan-500 bg-cyan-500/10 scale-[0.99]"
                    : "border-white/10 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <div className="rounded-full bg-cyan-500/10 p-3 text-cyan-400 mb-3 animate-pulse">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-white">Drag & drop your font files here</p>
                <p className="text-xs text-zinc-500 mt-1">Supports multiple .ttf, .otf, .woff, .woff2 files (click to browse)</p>
                <input
                  ref={libraryFileInputRef}
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  multiple
                  onChange={async (e) => {
                    if (e.target.files) {
                      await handleFontFiles(e.target.files);
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Alert messages */}
          {saveStatus && (
            <div
              className={`flex items-center gap-3 rounded-xl p-4 text-sm ${
                saveStatus.type === "success"
                  ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}
            >
              {saveStatus.type === "success" ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span>{saveStatus.message}</span>
            </div>
          )}

          {/* Sticky Save Action Bar */}
          {(() => {
            const hasChanges = initialForm ? JSON.stringify(form) !== JSON.stringify(initialForm) : false;
            return (
              <div
                className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl transition-all duration-300 transform ${
                  hasChanges ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
                }`}
              >
                <div className="glass backdrop-blur-xl bg-zinc-950/80 border border-cyan-500/20 shadow-2xl rounded-2xl px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-xs text-zinc-300">You have unsaved changes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (initialForm) {
                          setForm(initialForm);
                          setSaveStatus(null);
                          if (initialForm.logo_font_file) {
                            loadCustomFont(initialForm.logo_font_file);
                          } else {
                            loadFont(initialForm.logo_font);
                          }
                          if (initialForm.body_font_file) {
                            loadCustomBodyFont(initialForm.body_font_file);
                          } else {
                            loadBodyFont(initialForm.body_font);
                          }
                          setFontSource(initialForm.logo_font_file ? "custom" : "google");
                          setBodyFontSource(initialForm.body_font_file ? "custom" : "google");
                        }
                      }}
                      className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-all font-selector-reset"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      disabled={saving || uploading || fontUploading || bodyFontUploading}
                      className="rounded-xl bg-cyan-500 hover:bg-cyan-600 px-5 py-2 text-xs font-bold text-black shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 font-selector-reset"
                    >
                      {saving ? "Saving..." : "Save Settings"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </form>
      </div>
    </div>
  );
}

// Helper utilities for HSL conversions to generate premium themes dynamically in preview mode
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
