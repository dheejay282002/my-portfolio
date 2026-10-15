"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cyber "Secure Portal" lock screen shown when PayContract reports the site
 * as locked. The passphrase is static and checked client-side; it only gates
 * the UI — PayContract remains the source of truth for locked/unlocked.
 */
const PASSCODE = "0628200210182005";

const LOADING_PHASES = [
  "Initiating RSA-4096 handshake...",
  "Bypassing firewall rules...",
  "Resolving DNS gateway...",
  "Decrypting payload...",
  "Authenticating token...",
];

function getRandomHex() {
  return (
    "0x" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")
      .toUpperCase()
  );
}

export default function SecurePortal({ onUnlock }: { onUnlock: () => void }) {
  const [phase, setPhase] = useState<"login" | "loading" | "success">("login");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const [terminalText, setTerminalText] = useState("Initializing...");
  const [hex1, setHex1] = useState("0x000000");
  const [hex2, setHex2] = useState("0x000000");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const unlockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cyber particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let raf = 0;
    const particleCount = 70;
    const connectionDistance = 150;
    const particleSpeed = 0.5;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    };

    const particles: Particle[] = [];

    const spawn = () => {
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * particleSpeed,
          vy: (Math.random() - 0.5) * particleSpeed,
          radius: Math.random() * 1.5 + 0.5,
        });
      }
    };

    resize();
    spawn();
    window.addEventListener("resize", resize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const opacity = 1 - distance / connectionDistance;
            ctx.strokeStyle = `rgba(6, 182, 212, ${opacity * 0.2})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(6, 182, 212, 0.5)";
        ctx.fill();
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    // Prevent scrolling the site behind the portal.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      if (unlockTimer.current) clearTimeout(unlockTimer.current);
    };
  }, []);

  const startLoadingSequence = () => {
    setPhase("loading");
    setProgress(0);
    setTerminalText(LOADING_PHASES[0]);

    let pct = 0;
    let phaseIndex = 0;
    const totalDuration = 3500;
    const intervalTime = 30;
    const step = 100 / (totalDuration / intervalTime);

    const id = setInterval(() => {
      pct += step;

      if (pct >= 100) {
        pct = 100;
        clearInterval(id);
        setProgress(100);
        unlockTimer.current = setTimeout(() => {
          setPhase("success");
          unlockTimer.current = setTimeout(onUnlock, 1400);
        }, 300);
        return;
      }

      setProgress(pct);

      if (Math.random() > 0.2) {
        setHex1(getRandomHex());
        setHex2(getRandomHex());
      }

      const expectedPhase = Math.floor((pct / 100) * LOADING_PHASES.length);
      if (expectedPhase > phaseIndex && expectedPhase < LOADING_PHASES.length) {
        phaseIndex = expectedPhase;
        setTerminalText(LOADING_PHASES[phaseIndex]);
      }
    }, intervalTime);

    return () => clearInterval(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === PASSCODE) {
      setError(false);
      setPassword("");
      startLoadingSequence();
    } else {
      setError(true);
      setShakeKey((k) => k + 1);
      setPassword("");
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-[#030712] font-mono text-slate-300">
      {/* Moving-node canvas background */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" aria-hidden />

      {/* Depth gradient overlay */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-transparent to-gray-950/80" aria-hidden />

      {/* Central card */}
      <div className="relative z-10 mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-900/60 p-8 shadow-[0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-xl sm:mx-0 sm:p-10">
        <div className="scanner-line" aria-hidden />

        {phase === "login" && (
          <div>
            <div className="flex flex-col items-center space-y-5 text-center">
              {/* Lock icon */}
              <div className="glow-icon flex h-16 w-16 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>

              {/* Warning badge */}
              <div className="rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                Restricted Access
              </div>

              <h1 className="text-2xl font-bold tracking-wide text-white drop-shadow-md sm:text-3xl">
                System Is Locked
              </h1>

              <p className="px-2 text-sm leading-relaxed text-slate-400">
                Access to this classified terminal is restricted. Enter the decryption passphrase to proceed.
              </p>
            </div>

            {/* Form */}
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="portal-code" className="block text-[0.70rem] font-bold uppercase tracking-widest text-cyan-500">
                  Authorization Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="portal-code"
                    autoComplete="off"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full rounded-lg border border-slate-700 bg-slate-950/80 px-4 py-3 font-mono tracking-widest text-cyan-400 transition-all placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${shakeKey % 2 ? "shake" : ""}`}
                  />
                  <div className="pointer-events-none absolute left-0 top-0 h-2 w-2 rounded-tl border-l border-t border-cyan-500/50" />
                  <div className="pointer-events-none absolute bottom-0 right-0 h-2 w-2 rounded-br border-b border-r border-cyan-500/50" />
                </div>
                <p className="mt-1 text-center text-[0.65rem] uppercase tracking-widest text-slate-500">
                  OVERRIDE CODE: <span className="font-bold text-cyan-400">CLASSIFIED</span>
                </p>
                <p
                  className={`mt-2 text-center text-[0.70rem] font-bold uppercase tracking-widest text-red-500 glitch-error ${error ? "" : "hidden"}`}
                  role="alert"
                >
                  ACCESS DENIED - INVALID KEY
                </p>
              </div>

              <button
                type="submit"
                className="cyber-btn group flex w-full items-center justify-center space-x-2 rounded-lg px-4 py-3.5 font-bold text-cyan-300 transition-all duration-300 hover:text-white"
              >
                <div className="relative z-10 flex items-center space-x-2">
                  <span className="text-sm uppercase tracking-[0.2em]">Authenticate</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform text-emerald-400 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 flex flex-col items-center justify-center space-y-2 border-t border-slate-700/50 pt-6">
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <div className="blink-dot h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
                <span>Awaiting security clearance...</span>
              </div>
              <div className="text-[0.65rem] tracking-wider text-slate-600">
                NODE: 192.168.SECURE.01 // ENCRYPTION: AES-256
              </div>
            </div>
          </div>
        )}

        {phase === "loading" && (
          <div className="flex flex-col items-center justify-center space-y-8 py-4">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-emerald-400 border-r-transparent border-b-emerald-400 border-l-transparent" />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-pulse text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>

            <div className="w-full space-y-2">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-cyan-400">{terminalText}</span>
                <span className="text-emerald-400">{Math.floor(progress)}%</span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded bg-slate-800">
                <div
                  className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981] transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between font-mono text-[0.65rem] text-slate-500">
                <span>{hex1}</span>
                <span>{hex2}</span>
              </div>
            </div>
          </div>
        )}

        {phase === "success" && (
          <div className="flex animate-pulse flex-col items-center justify-center space-y-6 py-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-500/80 bg-emerald-950/50 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-center text-3xl font-bold tracking-widest text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)] sm:text-4xl">
              ACCESS
              <br />
              GRANTED
            </h2>
            <p className="font-mono text-xs text-emerald-500/70">Uplink established successfully.</p>
          </div>
        )}
      </div>
    </div>
  );
}
