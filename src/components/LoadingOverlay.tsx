"use client";

import Skeleton from "@/components/Skeleton";

interface LoadingOverlayProps {
  show: boolean;
  message: string;
}

export default function LoadingOverlay({ show, message }: LoadingOverlayProps) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col items-center p-8 rounded-2xl glass border border-white/10 max-w-sm text-center">
        <div className="space-y-3 w-full">
          <Skeleton className="h-12 w-12 mx-auto rounded-full" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-3 w-36 mx-auto" />
        </div>
        <p className="mt-5 text-white text-sm font-semibold tracking-wide">{message}</p>
      </div>
    </div>
  );
}
