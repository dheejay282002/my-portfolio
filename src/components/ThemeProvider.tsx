"use client";

import { WebSettingsProvider, useWebSettings } from "@/contexts/WebSettingsContext";

function LoadingOverlay({ children }: { children: React.ReactNode }) {
  const { loading } = useWebSettings();

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: "#09090b" }}>
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        </div>
      )}
      <div style={{ visibility: loading ? "hidden" : "visible" }}>
        {children}
      </div>
    </>
  );
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WebSettingsProvider>
      <LoadingOverlay>{children}</LoadingOverlay>
    </WebSettingsProvider>
  );
}
