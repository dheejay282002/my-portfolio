"use client";

interface LoadingOverlayProps {
  show: boolean;
  message: string;
}

export default function LoadingOverlay({ show, message }: LoadingOverlayProps) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
      <div className="relative flex flex-col items-center p-8 rounded-2xl glass border border-white/10 max-w-sm text-center">
        {/* Loading Spinner */}
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-white text-sm font-semibold tracking-wide animate-pulse">{message}</p>
      </div>
    </div>
  );
}
