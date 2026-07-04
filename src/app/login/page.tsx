"use client";

import { useState, FormEvent, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWebSettings } from "@/hooks/useWebSettings";
import LoadingOverlay from "@/components/LoadingOverlay";

const HCAPTCHA_SITEKEY = "8986062e-d2ac-452e-ae48-c66a07e8b462";
const SITEVERIFY_URL = "/api/verify-captcha";

import { Eye, EyeOff, X } from "lucide-react";

type Mode = "login" | "signup" | "forgot" | "forgot-otp" | "reset-success";

export default function LoginPage() {
  const router = useRouter();
  const { settings } = useWebSettings();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [mode, setMode] = useState<Mode>("login");

  // Show/Hide password toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, _setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, _setSignupError] = useState("");
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
  const [forgotError, _setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const [errorModalMsg, setErrorModalMsg] = useState("");

  const setLoginError = (msg: string) => {
    _setLoginError(msg);
    if (msg) setErrorModalMsg(msg);
  };

  const setSignupError = (msg: string) => {
    _setSignupError(msg);
    if (msg) setErrorModalMsg(msg);
  };

  const setForgotError = (msg: string) => {
    _setForgotError(msg);
    if (msg) setErrorModalMsg(msg);
  };

  // hCaptcha — shared across login, signup, forgot
  const [captchaContext, setCaptchaContext] = useState<"login" | "signup" | "forgot" | "google" | "github" | null>(null);
  const [captchaVerifying, setCaptchaVerifying] = useState(false);
  const captchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!document.getElementById("hcaptcha-script")) {
      const script = document.createElement("script");
      script.id = "hcaptcha-script";
      script.src = "https://js.hcaptcha.com/1/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam === "signup") {
      setTab("signup");
    } else if (tabParam === "login") {
      setTab("login");
    }
    const oauthError = params.get("error");
    if (oauthError) {
      const messages: Record<string, string> = {
        oauth_denied: "You cancelled the authentication. Please try again.",
        missing_code: "Authentication failed. Please try again.",
        no_email: "We couldn't retrieve your email from that provider. Please use a different method.",
        oauth_failed: "Authentication failed. Please try again or use email sign in.",
        google_not_configured: "Google OAuth is not configured yet. Set it up in the admin panel.",
        github_not_configured: "GitHub OAuth is not configured yet. Set it up in the admin panel.",
      };
      setLoginError(messages[oauthError] || "Authentication failed. Please try again.");
      window.history.replaceState({}, "", window.location.pathname);
    }
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
        else if (captchaContext === "google" || captchaContext === "github") setLoginError(err);
        else setSignupError(err);
        if ((window as any).hcaptcha) (window as any).hcaptcha.reset();
        setCaptchaVerifying(false);
        setCaptchaContext(null);
        return;
      }

      if (captchaContext === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        });
        const data = await res.json();
        if (!res.ok) {
          setLoginError(data.error || "Login failed");
          setCaptchaVerifying(false);
          setCaptchaContext(null);
          return;
        }
        router.push(data.user.role === "admin" ? "/dashboard/admin" : "/dashboard/client");
        router.refresh();
      } else if (captchaContext === "signup") {
        const res = await fetch("/api/auth/signup/request-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: signupName, email: signupEmail }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSignupError(data.error || "Signup failed");
          setCaptchaVerifying(false);
          setCaptchaContext(null);
          return;
        }
        setShowOtp(true);
        setCaptchaContext(null);
      } else if (captchaContext === "google" || captchaContext === "github") {
        window.location.href = `/api/auth/oauth/${captchaContext}`;
        return;
      } else if (captchaContext === "forgot") {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail }),
        });
        const data = await res.json();
        if (!res.ok) {
          setForgotError(data.error || "Failed");
          setCaptchaVerifying(false);
          setCaptchaContext(null);
          return;
        }
        setMode("forgot-otp");
        setCaptchaContext(null);
      }
    } catch {
      const err = "Something went wrong";
      if (captchaContext === "login") setLoginError(err);
      else if (captchaContext === "forgot") setForgotError(err);
      else setSignupError(err);
      setCaptchaContext(null);
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
              <div className="relative">
                <input type={showResetNewPassword ? "text" : "password"} placeholder="New Password" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="glass w-full rounded-xl pl-5 pr-11 py-3.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 transition-all" />
                <button
                  type="button"
                  onClick={() => setShowResetNewPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  {showResetNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="relative">
                <input type={showResetConfirmPassword ? "text" : "password"} placeholder="Confirm New Password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="glass w-full rounded-xl pl-5 pr-11 py-3.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 transition-all" />
                <button
                  type="button"
                  onClick={() => setShowResetConfirmPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  {showResetConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
              <div className="mt-8 relative flex rounded-xl border border-white/10 p-1 bg-white/[0.02]">
                {/* Sliding active pill indicator */}
                <div
                  className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300 ease-out"
                  style={{
                    left: tab === "login" ? "4px" : "50%",
                    width: "calc(50% - 4px)",
                  }}
                />
                {(["login", "signup"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTab(t);
                      _setSignupError("");
                      _setLoginError("");
                      setCaptchaContext(null);
                    }}
                    className={`relative z-10 flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                      tab === t ? "text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
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
                <button type="submit" disabled={otpLoading} className={btnCls}>
                  {otpLoading ? "Verifying..." : "Verify Code & Register"}
                </button>
                <div className="flex flex-col gap-2 items-center text-xs pt-1">
                  <button type="button" disabled={resending} onClick={handleResendOtp}
                    className="text-cyan-400 hover:text-cyan-300 disabled:opacity-50 transition-colors">
                    {resending ? "Resending..." : "Resend Code"}
                  </button>
                  <button type="button" onClick={() => { setShowOtp(false); setCaptchaContext(null); _setSignupError(""); }}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors">Back to Edit Info</button>
                </div>
              </form>
            )}

            {/* Transition Container for Login / Signup Forms */}
            {!showOtp && !captchaContext && (
              <div className="relative mt-8">
                {/* Login Form wrapper */}
                <div
                  className={`transition-all duration-300 transform ${
                    tab === "login"
                      ? "opacity-100 translate-x-0 relative"
                      : "opacity-0 -translate-x-8 absolute pointer-events-none inset-x-0 top-0"
                  }`}
                >
                  <form onSubmit={handleLogin} className="space-y-5">
                    <input type="email" placeholder="Email" value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)} required className={inputCls} />
                    <div className="relative">
                      <input type={showLoginPassword ? "text" : "password"} placeholder="Password" value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)} required className="glass w-full rounded-xl pl-5 pr-11 py-3.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 transition-all" />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                      >
                        {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <button type="submit" disabled={loginLoading} className={btnCls}>
                      {loginLoading ? "Signing in..." : "Sign In"}
                    </button>
                    <div className="text-center pt-1">
                      <button type="button" onClick={() => { setMode("forgot"); setForgotEmail(loginEmail); _setForgotError(""); }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                        Forgot your password?
                      </button>
                    </div>
                  </form>
                </div>

                {/* Signup Form wrapper */}
                <div
                  className={`transition-all duration-300 transform ${
                    tab === "signup"
                      ? "opacity-100 translate-x-0 relative"
                      : "opacity-0 translate-x-8 absolute pointer-events-none inset-x-0 top-0"
                  }`}
                >
                  <form onSubmit={handleSignup} className="space-y-5">
                    <input type="text" placeholder="Full Name" value={signupName}
                      onChange={(e) => setSignupName(e.target.value)} required className={inputCls} />
                    <input type="email" placeholder="Email" value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)} required className={inputCls} />
                    <div className="relative">
                      <input type={showSignupPassword ? "text" : "password"} placeholder="Password (min 6 characters)" value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)} required minLength={6} className="glass w-full rounded-xl pl-5 pr-11 py-3.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 transition-all" />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                      >
                        {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <button type="submit" className={btnCls}>
                      Create Account
                    </button>
                  </form>
                </div>
              </div>
            )}

            {!showOtp && !captchaContext && (
              <div className="mt-6">
                <div className="relative flex items-center gap-3 mb-4">
                  <div className="flex-1 border-t border-white/10" />
                  <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">or continue with</span>
                  <div className="flex-1 border-t border-white/10" />
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => { setCaptchaContext("google"); }}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCaptchaContext("github"); }}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                    GitHub
                  </button>
                </div>
              </div>
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
              </div>
            )}
          </>
        )}
      </div>

      {/* Authentication Error Modal Overlay */}
      {errorModalMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-strong mx-4 w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl animate-in scale-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <X className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Authentication Error</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{errorModalMsg}</p>
            <button
              type="button"
              onClick={() => setErrorModalMsg("")}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
