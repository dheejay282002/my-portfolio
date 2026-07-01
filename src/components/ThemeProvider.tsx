"use client";

import Skeleton from "@/components/Skeleton";
import { WebSettingsProvider, useWebSettings } from "@/contexts/WebSettingsContext";

function LoadingOverlay({ children }: { children: React.ReactNode }) {
  const { loading } = useWebSettings();

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ backgroundColor: "#09090b" }}>
          <div className="mx-auto max-w-6xl px-6 py-24 space-y-10">
            {/* Header skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl p-5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-7 w-12" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Content skeletons */}
            <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
              <div className="xl:col-span-2 space-y-4">
                <Skeleton className="h-6 w-48" />
                <div className="glass rounded-2xl divide-y divide-white/5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="glass rounded-2xl divide-y divide-white/5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                      <Skeleton className="h-5 w-12 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
