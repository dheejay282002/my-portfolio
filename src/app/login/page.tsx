"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "signup">("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  const [showOtp, setShowOtp] = useState(false);
  const [signupOtp, setSignupOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || "Login failed");
        return;
      }

      router.push(
        data.user.role === "admin" ? "/dashboard/admin" : "/dashboard/client"
      );
      router.refresh();
    } catch {
      setLoginError("Something went wrong");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setSignupError("");
    setSignupLoading(true);

    try {
      const res = await fetch("/api/auth/signup/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSignupError(data.error || "Signup failed");
        return;
      }

      setShowOtp(true);
      setSignupOtp("");
    } catch {
      setSignupError("Something went wrong");
    } finally {
      setSignupLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setSignupError("");
    setOtpLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          otp: signupOtp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSignupError(data.error || "Verification failed");
        return;
      }

      router.push("/dashboard/client");
      router.refresh();
    } catch {
      setSignupError("Something went wrong");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setSignupError("");
    setResending(true);

    try {
      const res = await fetch("/api/auth/signup/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSignupError(data.error || "Failed to resend code");
        return;
      }

      alert("Verification code resent successfully!");
    } catch {
      setSignupError("Something went wrong");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="glass w-full max-w-md rounded-2xl p-8">
        <div className="text-center">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-white"
          >
            Dee Jay
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-white">
            {showOtp ? "Email Verification" : tab === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {showOtp
              ? "Verify your registration email"
              : tab === "login"
              ? "Sign in to your account"
              : "Join as a client to get started"}
          </p>
        </div>

        {!showOtp && (
          <div className="mt-8 flex rounded-xl border border-white/10 p-1">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                tab === "login"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                tab === "signup"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {showOtp ? (
          <form onSubmit={handleVerifyOtp} className="mt-8 space-y-5">
            <p className="text-xs text-zinc-400 text-center leading-relaxed">
              We sent a 6-digit verification code to <strong className="text-zinc-200">{signupEmail}</strong>.
            </p>
            <div>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={signupOtp}
                onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, ""))}
                required
                className="glass w-full rounded-xl px-5 py-3.5 text-center text-lg font-bold tracking-widest text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
              />
            </div>

            {signupError && <p className="text-sm text-red-400 text-center">{signupError}</p>}

            <button
              type="submit"
              disabled={otpLoading}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {otpLoading ? "Verifying..." : "Verify Code & Register"}
            </button>

            <div className="flex flex-col gap-2.5 items-center justify-center text-xs pt-2">
              <button
                type="button"
                disabled={resending}
                onClick={handleResendOtp}
                className="text-cyan-400 hover:text-cyan-300 disabled:opacity-50 transition-colors font-medium"
              >
                {resending ? "Resending..." : "Resend Code"}
              </button>
              <button
                type="button"
                onClick={() => { setShowOtp(false); setSignupError(""); }}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Back to Edit Info
              </button>
            </div>
          </form>
        ) : tab === "login" ? (
          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="glass w-full rounded-xl px-5 py-3.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="glass w-full rounded-xl px-5 py-3.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
              />
            </div>

            {loginError && <p className="text-sm text-red-400">{loginError}</p>}

            <button
              type="submit"
              disabled={loginLoading}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loginLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="mt-8 space-y-5">
            <div>
              <input
                type="text"
                placeholder="Full Name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                required
                className="glass w-full rounded-xl px-5 py-3.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
                className="glass w-full rounded-xl px-5 py-3.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
                minLength={6}
                className="glass w-full rounded-xl px-5 py-3.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50"
              />
            </div>

            {signupError && (
              <p className="text-sm text-red-400">{signupError}</p>
            )}

            <button
              type="submit"
              disabled={signupLoading}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {signupLoading ? "Sending Code..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
