"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Eye,
  EyeOff,
  XCircle,
  ArrowRight,
  Shield,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { Newsreader, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, requestPasswordReset, authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { GithubIcon } from "@repo/ui/components/icons";

// ─────────────────────────────────────────────────────────────────────────
// Type system
// Display: Newsreader (editorial serif — institutional, not templated)
// Body:    IBM Plex Sans (technical, enterprise-grade grotesk)
// Utility: IBM Plex Mono (ledger data, timestamps, session labels)
// NOTE: for production, move these three next/font calls into the root
// layout.tsx and reference the resulting CSS variables here instead —
// kept local so this file is a drop-in replacement.
// ─────────────────────────────────────────────────────────────────────────
const display = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

// ─────────────────────────────────────────────────────────────────────────
// Design tokens (arbitrary-value Tailwind, no config edits required)
//   ink        #0F1B2E   primary dark / headings
//   ink-2      #16283F   ink hover
//   parchment  #FBFAF7   light surface
//   hairline   #E7E2D9   warm border on parchment
//   slate      #5B6B7C   secondary text
//   brass      #A9824C   accent / seal / focus
//   brass-dark #8A6A3E   accent text on light bg (contrast-safe)
//   success    #2F7A4F   verified state
//   error      #B3352A   error state
// ─────────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ── Wordmark ──
const ScrymeMark = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-8 h-8 rounded-md bg-[#0F1B2E] flex items-center justify-center shrink-0">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="7" stroke="#A9824C" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="2" fill="#A9824C" />
        {[0, 60, 120, 180, 240, 300].map(deg => (
          <line
            key={deg}
            x1="12"
            y1="2.2"
            x2="12"
            y2="4.4"
            stroke="#A9824C"
            strokeWidth="1.2"
            strokeLinecap="round"
            transform={`rotate(${deg} 12 12)`}
          />
        ))}
      </svg>
    </div>
    <span
      className={cn(
        display.className,
        "text-[1.35rem] font-medium tracking-tight text-[#0F1B2E]",
      )}>
      scryme
    </span>
  </div>
);

const MicrosoftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect width="7" height="7" fill="#F25022" />
    <rect x="9" width="7" height="7" fill="#7FBA00" />
    <rect y="9" width="7" height="7" fill="#00A4EF" />
    <rect x="9" y="9" width="7" height="7" fill="#FFB900" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M15.68 8.18c0-.57-.05-1.13-.15-1.68H8.16v3.18h4.24c-.18.97-.75 1.79-1.6 2.34v1.93h2.6c1.52-1.4 2.4-3.47 2.4-5.91l-.17.14z"
      fill="#4285F4"
    />
    <path
      d="M8.16 16c2.16 0 3.97-.72 5.3-1.94l-2.6-1.93c-.72.48-1.64.77-2.7.77-2.07 0-3.83-1.4-4.46-3.28H1.04v1.98C2.35 13.75 5.07 16 8.16 16z"
      fill="#34A853"
    />
    <path
      d="M3.7 9.62c-.16-.48-.25-.99-.25-1.51s.09-1.03.25-1.51V4.62H1.04C.38 5.93 0 7.42 0 8.11s.38 3.18 1.04 4.49l2.66-1.98z"
      fill="#FBBC04"
    />
    <path
      d="M8.16 3.18c1.17 0 2.22.4 3.05 1.19l2.29-2.29C11.11.71 9.31 0 8.16 0 5.07 0 2.35 2.25 1.04 4.62l2.66 1.98c.63-1.88 2.39-3.28 4.46-3.28z"
      fill="#EA4335"
    />
  </svg>
);

// ── Compliance chip for hero panel ──
const ComplianceBadge = ({
  label,
  className,
}: {
  label: string;
  className: string;
}) => (
  <div
    className={cn(
      "absolute px-3 py-1.5 bg-white/[0.06] backdrop-blur-sm border border-white/15 rounded-md shadow-lg hidden lg:block",
      mono.className,
      className,
    )}>
    <span className="text-[10px] tracking-wider text-white/80 uppercase">
      {label}
    </span>
  </div>
);

// ── Signature element: verification ledger ──
const VERIFICATION_STEPS = [
  { label: "Identity verified", time: "00:02" },
  { label: "Financials reviewed", time: "00:41" },
  { label: "Compliance confirmed", time: "01:18" },
  { label: "Contract executed", time: "02:05" },
];

const VerificationLedger = () => (
  <div className="relative pl-1">
    {VERIFICATION_STEPS.map((step, i) => (
      <div
        key={step.label}
        className="relative flex items-center gap-3 py-2.5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 motion-safe:fill-mode-both"
        style={{
          animationDelay: `${i * 180 + 300}ms`,
          animationDuration: "600ms",
        }}>
        {i < VERIFICATION_STEPS.length - 1 && (
          <span className="absolute left-[9px] top-8 w-px h-[calc(100%-0.5rem)] bg-white/10" />
        )}
        <span className="relative z-10 flex items-center justify-center w-[19px] h-[19px] rounded-full bg-[#16283F] border border-[#A9824C]/40 shrink-0">
          <CheckCircle className="w-3 h-3 text-[#C9A876]" strokeWidth={2.5} />
        </span>
        <span className={cn(sans.className, "text-sm text-white/85 flex-1")}>
          {step.label}
        </span>
        <span
          className={cn(
            mono.className,
            "text-[10px] text-[#7F93A8] tracking-wider tabular-nums",
          )}>
          {step.time}
        </span>
      </div>
    ))}
  </div>
);

// ── Decorative seal watermark ──
const SealMark = () => (
  <svg
    className="absolute -bottom-16 -right-16 w-[280px] h-[280px] opacity-[0.05] pointer-events-none hidden lg:block"
    viewBox="0 0 200 200"
    fill="none">
    <circle
      cx="100"
      cy="100"
      r="92"
      stroke="white"
      strokeWidth="1"
      strokeDasharray="2 5"
    />
    <circle cx="100" cy="100" r="72" stroke="white" strokeWidth="1" />
    <path
      d="M78 100l14 14 30-30"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SocialButton = ({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md border border-[#E7E2D9] bg-white hover:bg-[#FBFAF7] hover:border-[#A9824C]/40 transition-all duration-150 text-sm font-medium text-[#33404D] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm">
    {disabled ? (
      <Loader2 className="h-4 w-4 animate-spin text-[#9AA6B2]" />
    ) : (
      icon
    )}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const FieldWrapper = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-[#33404D]">{label}</label>
    {children}
    {error && (
      <p className="text-xs text-[#B3352A] flex items-center gap-1">
        <XCircle className="h-3 w-3 shrink-0" />
        {error}
      </p>
    )}
  </div>
);

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col">
    <span className={cn(display.className, "text-2xl font-medium text-white")}>
      {value}
    </span>
    <span
      className={cn(
        mono.className,
        "text-[10px] tracking-wider uppercase text-[#C9A876] mt-1",
      )}>
      {label}
    </span>
  </div>
);

type View = "login" | "forgot-password";

const LoginPageContent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentView, setCurrentView] = useState<View>("login");
  const [loginStatus, setLoginStatus] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  const session = authClient.useSession();

  const callbackUrl =
    searchParams.get("callbackUrl") ||
    searchParams.get("redirect") ||
    searchParams.get("returnTo");

  useEffect(() => {
    if (session.data) {
      router.push(callbackUrl || "/dashboard");
    }
  }, [session.data, router, callbackUrl]);

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerForgot,
    handleSubmit: handleSubmitForgot,
    formState: { errors: forgotErrors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const handleSocialLogin = async (
    provider: "microsoft" | "google" | "github",
  ) => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider,
        callbackURL: callbackUrl || "/dashboard",
      });
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginStatus(null);
    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: callbackUrl || undefined,
      });

      if (result.data) {
        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          router.push("/dashboard");
        }
      } else if (result.error) {
        setLoginStatus("error");
        toast.error(result.error.message || "Invalid credentials");
      }
    } catch (error) {
      setLoginStatus("error");
      toast.error("A system error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await requestPasswordReset({
        email: data.email,
        redirectTo: "/reset-password",
      });
      setLoginStatus("reset-email-sent");
      toast.success("Reset email sent!");
    } catch (error) {
      toast.error("Failed to send reset email. Please contact support.");
    } finally {
      setIsLoading(false);
    }
  };

  const SuccessMessage = ({ text }: { text: string }) => (
    <div className="mb-6 p-4 bg-[#F3F6F1] border border-[#C7D9C0] rounded-md flex items-start gap-3">
      <CheckCircle className="w-5 h-5 text-[#2F7A4F] mt-0.5 shrink-0" />
      <span className="text-[#2F5B3F] text-sm font-medium">{text}</span>
    </div>
  );

  return (
    <div
      className={cn(
        sans.className,
        display.variable,
        sans.variable,
        mono.variable,
        "min-h-screen flex bg-[#FBFAF7]",
      )}>
      {/* ── Left Panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-[420px]">
          {/* Header row */}
          <div className="flex items-center justify-between mb-10">
            <ScrymeMark />
            {currentView === "login" && (
              <p className="text-sm text-[#5B6B7C]">
                Need an account?{" "}
                <button
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (callbackUrl) params.set("callbackUrl", callbackUrl);
                    const queryString = params.toString();
                    router.push(
                      `/sign-up${queryString ? `?${queryString}` : ""}`,
                    );
                  }}
                  className="text-[#8A6A3E] font-semibold hover:text-[#0F1B2E] transition-colors cursor-pointer">
                  Request access
                </button>
              </p>
            )}
          </div>

          {currentView === "login" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h1
                  className={cn(
                    display.className,
                    "text-[1.9rem] font-medium text-[#0F1B2E] leading-tight tracking-tight",
                  )}>
                  Welcome back
                </h1>
                <p className="text-[#5B6B7C] text-sm mt-2">
                  Sign in to your Scryme workspace.
                </p>
              </div>

              {/* Social buttons */}
              <div className="flex gap-2 mb-6">
                <SocialButton
                  icon={<MicrosoftIcon />}
                  label="Microsoft"
                  onClick={() => handleSocialLogin("microsoft")}
                  disabled={isLoading}
                />
                <SocialButton
                  icon={<GoogleIcon />}
                  label="Google"
                  onClick={() => handleSocialLogin("google")}
                  disabled={isLoading}
                />
                <SocialButton
                  icon={<GithubIcon className="w-4 h-4" />}
                  label="GitHub"
                  onClick={() => handleSocialLogin("github")}
                  disabled={isLoading}
                />
              </div>

              {/* Divider */}
              <div className="relative flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-[#E7E2D9]" />
                <span
                  className={cn(
                    mono.className,
                    "text-[10px] text-[#9AA6B2] tracking-wider uppercase",
                  )}>
                  or continue with email
                </span>
                <div className="flex-1 h-px bg-[#E7E2D9]" />
              </div>

              <form
                onSubmit={handleSubmitLogin(handleLogin)}
                className="space-y-4">
                <FieldWrapper
                  label="Work email"
                  error={loginErrors.email?.message}>
                  <Input
                    type="email"
                    {...registerLogin("email")}
                    placeholder="name@company.com"
                    className={cn(
                      "h-10 text-sm rounded-md border-[#E7E2D9] focus-visible:ring-[#A9824C]/25 focus-visible:border-[#A9824C]",
                      loginErrors.email &&
                        "border-[#B3352A] focus-visible:ring-[#B3352A]/20 focus-visible:border-[#B3352A]",
                    )}
                  />
                </FieldWrapper>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-[#33404D]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setCurrentView("forgot-password")}
                      className="text-xs text-[#8A6A3E] hover:text-[#0F1B2E] font-semibold transition-colors cursor-pointer">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      {...registerLogin("password")}
                      placeholder="Enter your password"
                      className={cn(
                        "h-10 text-sm rounded-md border-[#E7E2D9] pr-10 focus-visible:ring-[#A9824C]/25 focus-visible:border-[#A9824C]",
                        loginErrors.password &&
                          "border-[#B3352A] focus-visible:ring-[#B3352A]/20 focus-visible:border-[#B3352A]",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA6B2] hover:text-[#5B6B7C] transition-colors cursor-pointer"
                      tabIndex={-1}>
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-xs text-[#B3352A] flex items-center gap-1">
                      <XCircle className="h-3 w-3 shrink-0" />
                      {loginErrors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-[#0F1B2E] hover:bg-[#16283F] text-white font-semibold rounded-md transition-all duration-150 shadow-sm hover:shadow-md flex items-center justify-center gap-2 group mt-2 cursor-pointer"
                  disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          {currentView === "forgot-password" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button
                onClick={() => setCurrentView("login")}
                className="flex items-center gap-2 text-sm font-medium text-[#5B6B7C] hover:text-[#0F1B2E] mb-8 transition-colors cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </button>

              <div className="mb-8">
                <h1
                  className={cn(
                    display.className,
                    "text-[1.9rem] font-medium text-[#0F1B2E] leading-tight tracking-tight",
                  )}>
                  Reset password
                </h1>
                <p className="text-[#5B6B7C] text-sm mt-2">
                  Enter your email and we&apos;ll send you a link to reset your
                  password.
                </p>
              </div>

              {loginStatus === "reset-email-sent" && (
                <SuccessMessage text="Instructions sent! Please check your inbox." />
              )}

              <form
                onSubmit={handleSubmitForgot(handleForgotPassword)}
                className="space-y-6">
                <FieldWrapper
                  label="Work email"
                  error={forgotErrors.email?.message}>
                  <Input
                    type="email"
                    {...registerForgot("email")}
                    placeholder="name@company.com"
                    className={cn(
                      "h-10 text-sm rounded-md border-[#E7E2D9] focus-visible:ring-[#A9824C]/25 focus-visible:border-[#A9824C]",
                      forgotErrors.email &&
                        "border-[#B3352A] focus-visible:ring-[#B3352A]/20 focus-visible:border-[#B3352A]",
                    )}
                  />
                </FieldWrapper>

                <Button
                  type="submit"
                  className="w-full h-11 bg-[#0F1B2E] hover:bg-[#16283F] text-white font-semibold rounded-md transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer"
                  disabled={isLoading}>
                  {isLoading ? "Processing..." : "Send reset instructions"}
                </Button>
              </form>
            </div>
          )}

          {/* Trust badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-[#9AA6B2]">
            <Shield className="h-3.5 w-3.5 text-[#A9824C]" />
            <span className={cn(mono.className, "tracking-wide")}>
              SOC 2 TYPE II · 256-BIT ENCRYPTION · GDPR COMPLIANT
            </span>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="hidden lg:flex flex-1 bg-[#0F1B2E] text-white relative overflow-hidden flex-col justify-between p-12">
        {/* Dot-grid instrument texture */}
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)`,
            backgroundSize: "22px 22px",
          }}
        />

        {/* Glow blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-[360px] h-[360px] rounded-full bg-[#A9824C]/10 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[280px] h-[280px] rounded-full bg-[#2F5D8A]/15 blur-[70px] pointer-events-none" />

        <SealMark />

        {/* Compliance credentials */}
        <ComplianceBadge label="SOC 2 Type II" className="top-16 right-16" />
        <ComplianceBadge label="ISO 27001" className="top-40 right-32" />
        <ComplianceBadge
          label="GDPR Ready"
          className="bottom-[19rem] left-12"
        />
        <ComplianceBadge label="KYB Verified" className="top-[15rem] left-16" />

        {/* Session micro-label */}
        <div
          className={cn(
            mono.className,
            "relative z-10 flex items-center gap-2 text-[10px] tracking-wider text-white/40 uppercase",
          )}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#4FA871] animate-pulse" />
          Secure session · TLS 1.3
        </div>

        {/* Main copy */}
        <div className="relative z-10 mt-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#A9824C]/15 border border-[#A9824C]/25 rounded-full mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A876] animate-pulse" />
            <span
              className={cn(
                mono.className,
                "text-[10px] tracking-wider uppercase text-[#DDC49B]",
              )}>
              2,400+ enterprise procurement teams
            </span>
          </div>

          <h2
            className={cn(
              display.className,
              "text-[2.5rem] font-medium leading-[1.1] tracking-tight mb-4",
            )}>
            Every vendor.
            <br />
            <span className="italic text-[#C9A876]">Fully verified.</span>
          </h2>
          <p className="text-base text-[#AEBBCB] leading-relaxed max-w-sm mb-8">
            Scryme gives enterprise teams one system of record for vendor
            diligence, contracts, and compliance — from first review to final
            signature.
          </p>

          <VerificationLedger />

          {/* Stats row */}
          <div className="flex gap-8 mt-8 pt-8 border-t border-white/10">
            <StatCard value="7,200+" label="Vetted vendors" />
            <StatCard value="94%" label="Audit pass rate" />
            <StatCard value="3 days" label="Time to approval" />
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FBFAF7]">
          <Loader2 className="h-8 w-8 animate-spin text-[#0F1B2E]" />
        </div>
      }>
      <LoginPageContent />
    </Suspense>
  );
};

export default LoginPage;
