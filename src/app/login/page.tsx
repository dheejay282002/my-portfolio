"use client";

import { useState, FormEvent, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWebSettings } from "@/hooks/useWebSettings";
import LoadingOverlay from "@/components/LoadingOverlay";

const HCAPTCHA_SITEKEY = "8986062e-d2ac-452e-ae48-c66a07e8b462";
const SITEVERIFY_URL = "/api/verify-captcha";

type Mode = "login" | "signup" | "forgot" | "forgot-otp" | "reset-success";

export default function LoginPage() {
  const router = useRouter();
  const { settings } = useWebSettings();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [mode, setMode] = useState<Mode>("login");

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [signupOtp, setSignupOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // hCaptcha — shared across login, signup, forgot
  const [captchaContext, setCaptchaContext] = useState<"login" | "signup" | "forgot" | null>(null);
  const [captchaVerifying, setCaptchaVerifying] = useState(false);
  const captchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("hcaptcha-script")) return;
    const script = document.createElement("script");
    script.id = "hcaptcha-script";
    script.src = "https://js.hcaptcha.com/1/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  const runAfterCaptcha = useCallback(async (token: string) => {
    setCaptchaVerifying(true);
    try {
      const verifyRes = await fetch(SITEVERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        const err = "CAPTCHA verification failed. Please try again.";
        if (captchaContext === "login") setLoginError(err);
        else if (captchaContext === "forgot") setForgotError(err);
        else setSignupError(err);
        if ((window as any).hcaptcha) (window as any).hcaptcha.reset();
        setCaptchaVerifying(false);
        return;
      }

      if (captchaContext === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        });
        const data = await res.json();
        if (!res.ok) { setLoginError(data.error || "Login failed"); setCaptchaVerifying(false); return; }
        router.push(data.user.role === "admin" ? "/dashboard/admin" : "/dashboard/client");
        router.refresh();
      } else if (captchaContext === "signup") {
        const res = await fetch("/api/auth/signup/request-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: signupName, email: signupEmail }),
        });
        const data = await res.json();
        if (!res.ok) { setSignupError(data.error || "Signup failed"); setCaptchaVerifying(false); return; }
        setShowOtp(true);
      } else if (captchaContext === "forgot") {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail }),
        });
        const data = await res.json();
        if (!res.ok) { setForgotError(data.error || "Failed"); setCaptchaVerifying(false); return; }
        setMode("forgot-otp");
      }
    } catch {
      const err = "Something went wrong";
      if (captchaContext === "login") setLoginError(err);
      else if (captchaContext === "forgot") setForgotError(err);
      else setSignupError(err);
    }
    finally { setCaptchaVerifying(false); }
  }, [captchaContext, loginEmail, loginPassword, signupName, signupEmail, forgotEmail, router]);

  // Render hCaptcha widget when the captcha step is shown
  useEffect(() => {
    if (!captchaContext || !captchaContainerRef.current) return;
    (window as any).hcaptcha.render(captchaContainerRef.current, {
      sitekey: HCAPTCHA_SITEKEY,
      callback: (token: string) => runAfterCaptcha(token),
      "expired-callback": () => { if ((window as any).hcaptcha) (window as any).hcaptcha.reset(); },
      "error-callback": () => {
        const err = "CAPTCHA error. Please try again.";
        if (captchaContext === "login") setLoginError(err);
        else if (captchaContext === "forgot") setForgotError(err);
        else setSignupError(err);
      },
    });
  }, [captchaContext]);



  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setCaptchaContext("login");
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setSignupError("");
    setCaptchaContext("signup");
  };

  const handleForgotRequest = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setCaptchaContext("forgot");
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setSignupError("");
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword, otp: signupOtp }),
      });
      const data = await res.json();
      if (!res.ok) { setSignupError(data.error || "Verification failed"); return; }
      router.push("/dashboard/client");
      router.refresh();
    } catch { setSignupError("Something went wrong"); }
    finally { setOtpLoading(false); }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      await fetch("/api/auth/signup/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: signupName, email: signupEmail }),
      });
    } finally { setResending(false); }
  };


  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError("");
    if (newPassword !== confirmPassword) { setForgotError("Passwords do not match"); return; }
    if (newPassword.length < 6) { setForgotError("Password must be at least 6 characters"); return; }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setForgotError(data.error || "Reset failed"); return; }
      setMode("reset-success");
    } catch { setForgotError("Something went wrong"); }
    finally { setForgotLoading(false); }
  };

  const inputCls = "glass w-full rounded-xl px-5 py-3.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 transition-all";
  const btnCls = "flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50";

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <LoadingOverlay show={loginLoading || otpLoading} message="Preparing your dashboard..." />
      <div className="glass w-full max-w-md rounded-2xl p-8">

        {/* ── Reset Success ── */}
        {mode === "reset-success" && (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-3xl">✓</div>
            <h2 className="text-2xl font-bold text-white">Password Reset!</h2>
            <p className="text-zinc-400 text-sm">Your password has been updated successfully. You can now sign in.</p>
            <button onClick={() => { setMode("login"); setTab("login"); }} className={btnCls}>Back to Sign In</button>
          </div>
        )}

        {/* ── Forgot OTP + New Password ── */}
        {mode === "forgot-otp" && (
          <>
            <div className="text-center mb-8">
              <Link href="/" className="text-xl font-bold tracking-tight text-white flex items-center justify-center">
                {settings.logo_type === "image" && settings.logo_image ? (
                  <img src={settings.logo_image} alt={settings.web_name} className="h-8 max-w-[200px] object-contain" />
                ) : (
                  <span style={{ 
                    fontFamily: settings.logo_font_file ? 'UploadedCustomFont' : settings.logo_font,
                    color: settings.logo_color || '#ffffff'
                  }}>
                    {settings.web_name}
                  </span>
                )}
              </Link>
              <h2 className="mt-6 text-2xl font-bold text-white">Set New Password</h2>
              <p className="mt-2 text-sm text-zinc-400">Enter the OTP sent to <strong className="text-zinc-200">{forgotEmail}</strong></p>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input
                type="text" maxLength={6} placeholder="Enter OTP code" value={forgotOtp}
                onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                required className={`${inputCls} text-center text-lg font-bold tracking-widest`}
              />
              <input type="password" placeholder="New Password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className={inputCls} />
              <input type="password" placeholder="Confirm New Password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className={inputCls} />
              {forgotError && <p className="text-sm text-red-400 text-center">{forgotError}</p>}
              <button type="submit" disabled={forgotLoading} className={btnCls}>
                {forgotLoading ? "Resetting..." : "Reset Password"}
              </button>
              <div className="text-center space-y-2 pt-1">
                <button type="button" onClick={handleForgotRequest} disabled={forgotLoading}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  Resend OTP
                </button>
                <br />
                <button type="button" onClick={() => { setMode("login"); setForgotError(""); }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  ← Back to Sign In
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── Forgot Email Entry ── */}
        {mode === "forgot" && !captchaContext && (
          <>
            <div className="text-center mb-8">
              <Link href="/" className="text-xl font-bold tracking-tight text-white flex items-center justify-center">
                {settings.logo_type === "image" && settings.logo_image ? (
                  <img src={settings.logo_image} alt={settings.web_name} className="h-8 max-w-[200px] object-contain" />
                ) : (
                  <span style={{ 
                    fontFamily: settings.logo_font_file ? 'UploadedCustomFont' : settings.logo_font,
                    color: settings.logo_color || '#ffffff'
                  }}>
                    {settings.web_name}
                  </span>
                )}
              </Link>
              <h2 className="mt-6 text-2xl font-bold text-white">Forgot Password</h2>
              <p className="mt-2 text-sm text-zinc-400">Enter your email and we'll send you an OTP to reset your password.</p>
            </div>
            <form onSubmit={handleForgotRequest} className="space-y-4">
              <input type="email" placeholder="Your email address" value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)} required className={inputCls} />
              {forgotError && <p className="text-sm text-red-400 text-center">{forgotError}</p>}
              <button type="submit" disabled={forgotLoading} className={btnCls}>
                {forgotLoading ? "Sending..." : "Send OTP"}
              </button>
              <button type="button" onClick={() => { setMode("login"); setForgotError(""); }}
                className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors pt-1">
                ← Back to Sign In
              </button>
            </form>
          </>
        )}

        {/* ── Forgot Email CAPTCHA ── */}
        {mode === "forgot" && captchaContext === "forgot" && (
          <div className="mt-8 space-y-5">
            <p className="text-center text-sm text-zinc-400">Please complete the CAPTCHA to continue.</p>
            <div className="flex justify-center">
              <div ref={captchaContainerRef} />
            </div>
            {captchaVerifying && (
              <p className="text-center text-sm text-cyan-400">Verifying CAPTCHA...</p>
            )}
            {forgotError && <p className="text-sm text-red-400 text-center">{forgotError}</p>}
          </div>
        )}

        {/* ── Login / Signup / OTP ── */}
        {(mode === "login") && (
          <>
            <div className="text-center">
              <Link href="/" className="text-xl font-bold tracking-tight text-white flex items-center justify-center">
                {settings.logo_type === "image" && settings.logo_image ? (
                  <img src={settings.logo_image} alt={settings.web_name} className="h-8 max-w-[200px] object-contain" />
                ) : (
                  <span style={{ 
                    fontFamily: settings.logo_font_file ? 'UploadedCustomFont' : settings.logo_font,
                    color: settings.logo_color || '#ffffff'
                  }}>
                    {settings.web_name}
                  </span>
                )}
              </Link>
              <h2 className="mt-6 text-2xl font-bold text-white">
                {showOtp ? "Email Verification" : tab === "login" ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                {showOtp ? "Verify your registration email" : tab === "login" ? "Sign in to your account" : "Join as a client to get started"}
              </p>
            </div>

            {!showOtp && !captchaContext && (
              <div className="mt-8 flex rounded-xl border border-white/10 p-1">
                {(["login", "signup"] as const).map((t) => (
                  <button key={t} onClick={() => { setTab(t); setSignupError(""); setCaptchaContext(null); }}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      tab === t ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white" : "text-zinc-400 hover:text-white"
                    }`}>
                    {t === "login" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>
            )}

            {/* OTP Verify */}
            {showOtp && (
              <form onSubmit={handleVerifyOtp} className="mt-8 space-y-5">
                <p className="text-xs text-zinc-400 text-center leading-relaxed">
                  We sent a 6-digit code to <strong className="text-zinc-200">{signupEmail}</strong>.
                </p>
                <input type="text" maxLength={6} placeholder="000000" value={signupOtp}
                  onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, ""))} required
                  className={`${inputCls} text-center text-lg font-bold tracking-widest`} />
                {signupError && <p className="text-sm text-red-400 text-center">{signupError}</p>}
                <button type="submit" disabled={otpLoading} className={btnCls}>
                  {otpLoading ? "Verifying..." : "Verify Code & Register"}
                </button>
                <div className="flex flex-col gap-2 items-center text-xs pt-1">
                  <button type="button" disabled={resending} onClick={handleResendOtp}
                    className="text-cyan-400 hover:text-cyan-300 disabled:opacity-50 transition-colors">
                    {resending ? "Resending..." : "Resend Code"}
                  </button>
                  <button type="button" onClick={() => { setShowOtp(false); setCaptchaContext(null); setSignupError(""); }}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors">Back to Edit Info</button>
                </div>
              </form>
            )}

            {/* Login Form */}
            {!showOtp && !captchaContext && tab === "login" && (
              <form onSubmit={handleLogin} className="mt-8 space-y-5">
                <input type="email" placeholder="Email" value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)} required className={inputCls} />
                <input type="password" placeholder="Password" value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)} required className={inputCls} />
                {loginError && <p className="text-sm text-red-400">{loginError}</p>}
                <button type="submit" disabled={loginLoading} className={btnCls}>
                  {loginLoading ? "Signing in..." : "Sign In"}
                </button>
                <div className="text-center pt-1">
                  <button type="button" onClick={() => { setMode("forgot"); setForgotEmail(loginEmail); setForgotError(""); }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                    Forgot your password?
                  </button>
                </div>
              </form>
            )}

            {/* Signup Form */}
            {!showOtp && !captchaContext && tab === "signup" && (
              <form onSubmit={handleSignup} className="mt-8 space-y-5">
                <input type="text" placeholder="Full Name" value={signupName}
                  onChange={(e) => setSignupName(e.target.value)} required className={inputCls} />
                <input type="email" placeholder="Email" value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)} required className={inputCls} />
                <input type="password" placeholder="Password (min 6 characters)" value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)} required minLength={6} className={inputCls} />
                {signupError && <p className="text-sm text-red-400">{signupError}</p>}
                <button type="submit" className={btnCls}>
                  Create Account
                </button>
              </form>
            )}

            {/* CAPTCHA Step — shown after any form submission */}
            {captchaContext && (
              <div className="mt-8 space-y-5">
                <p className="text-center text-sm text-zinc-400">Please complete the CAPTCHA to continue.</p>
                <div className="flex justify-center">
                  <div ref={captchaContainerRef} />
                </div>
                {captchaVerifying && (
                  <p className="text-center text-sm text-cyan-400">Verifying CAPTCHA...</p>
                )}
                {(captchaContext === "login" && loginError) ||
                 (captchaContext === "forgot" && forgotError) ||
                 (captchaContext === "signup" && signupError) ? (
                  <p className="text-sm text-red-400 text-center">
                    {captchaContext === "login" ? loginError : captchaContext === "forgot" ? forgotError : signupError}
                  </p>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
