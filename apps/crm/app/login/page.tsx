"use client";

import React, { useState, useEffect } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, requestPasswordReset, authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";

// Zod validation schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

import { GithubIcon } from "@repo/ui/components/icons";

const DealioLogo = () => (
  <div className="flex items-center gap-1">
    <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
      <span className="text-white font-black text-xs tracking-tight">D</span>
    </div>
    <span className="text-xl font-bold tracking-tight text-gray-900">
      deal<span className="text-emerald-600">io</span>
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

// Floating tag for hero panel
const FloatingTag = ({
  name,
  className,
}: {
  name: string;
  className: string;
}) => (
  <div
    className={cn(
      "absolute px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-medium rounded-full shadow-lg hidden lg:block",
      className,
    )}
  >
    {name}
  </div>
);

// Social provider button
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
    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
  >
    {disabled ? (
      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
    ) : (
      icon
    )}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

// Form field wrapper
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
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    {children}
    {error && (
      <p className="text-xs text-red-600 flex items-center gap-1">
        <XCircle className="h-3 w-3 shrink-0" />
        {error}
      </p>
    )}
  </div>
);

// Stat card for hero panel
const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col">
    <span className="text-2xl font-bold text-white">{value}</span>
    <span className="text-xs text-emerald-200 mt-0.5">{label}</span>
  </div>
);

type View = "login" | "forgot-password";

import { Suspense } from "react";

const LoginContent = () => {
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
      router.push(callbackUrl || "/customers");
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
        callbackURL: callbackUrl || "/customers",
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
          router.push("/customers");
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
    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
      <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
      <span className="text-emerald-800 text-sm font-medium">{text}</span>
    </div>
  );

  // Optional styling tweak: Don't render the form visual content if user is already authenticated
  if (session.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Left Panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-[420px]">
          {/* Header row */}
          <div className="flex items-center justify-between mb-10">
            <DealioLogo />
            {currentView === "login" && (
              <p className="text-sm text-gray-500">
                New here?{" "}
                <button
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (callbackUrl) params.set("callbackUrl", callbackUrl);
                    const queryString = params.toString();
                    router.push(
                      `/sign-up${queryString ? `?${queryString}` : ""}`,
                    );
                  }}
                  className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
                >
                  Sign up
                </button>
              </p>
            )}
          </div>

          {currentView === "login" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h1 className="text-[1.75rem] font-bold text-gray-900 leading-tight tracking-tight">
                  Welcome back
                </h1>
                <p className="text-gray-500 text-sm mt-2">
                  Sign in to access your enterprise dashboard.
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
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 font-medium">
                  or continue with email
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <form
                onSubmit={handleSubmitLogin(handleLogin)}
                className="space-y-4"
              >
                <FieldWrapper
                  label="Work email"
                  error={loginErrors.email?.message}
                >
                  <Input
                    type="email"
                    {...registerLogin("email")}
                    placeholder="name@company.com"
                    className={cn(
                      "h-10 text-sm rounded-lg border-gray-200 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500",
                      loginErrors.email &&
                        "border-red-400 focus-visible:ring-red-500/20 focus-visible:border-red-400",
                    )}
                  />
                </FieldWrapper>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setCurrentView("forgot-password")}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      {...registerLogin("password")}
                      placeholder="Enter your password"
                      className={cn(
                        "h-10 text-sm rounded-lg border-gray-200 pr-10 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500",
                        loginErrors.password &&
                          "border-red-400 focus-visible:ring-red-500/20 focus-visible:border-red-400",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <XCircle className="h-3 w-3 shrink-0" />
                      {loginErrors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all duration-150 shadow-sm hover:shadow-md flex items-center justify-center gap-2 group mt-2"
                  disabled={isLoading}
                >
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
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 mb-8 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to login
              </button>

              <div className="mb-8">
                <h1 className="text-[1.75rem] font-bold text-gray-900 leading-tight tracking-tight">
                  Reset password
                </h1>
                <p className="text-gray-500 text-sm mt-2">
                  Enter your email and we&apos;ll send you a link to reset your
                  password.
                </p>
              </div>

              {loginStatus === "reset-email-sent" && (
                <SuccessMessage text="Instructions sent! Please check your inbox." />
              )}

              <form
                onSubmit={handleSubmitForgot(handleForgotPassword)}
                className="space-y-6"
              >
                <FieldWrapper
                  label="Work email"
                  error={forgotErrors.email?.message}
                >
                  <Input
                    type="email"
                    {...registerForgot("email")}
                    placeholder="name@company.com"
                    className={cn(
                      "h-10 text-sm rounded-lg border-gray-200 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500",
                      forgotErrors.email &&
                        "border-red-400 focus-visible:ring-red-500/20 focus-visible:border-red-400",
                    )}
                  />
                </FieldWrapper>

                <Button
                  type="submit"
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all duration-150 shadow-sm hover:shadow-md"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Send reset instructions"}
                </Button>
              </form>
            </div>
          )}

          {/* Trust badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield className="h-3.5 w-3.5 text-gray-300" />
            <span>
              SOC 2 Type II certified · 256-bit encryption · GDPR compliant
            </span>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="hidden lg:flex flex-1 bg-[#0d3d2b] text-white relative overflow-hidden flex-col justify-between p-12">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        <div className="absolute top-[-80px] right-[-80px] w-[360px] h-[360px] rounded-full bg-emerald-400/10 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[280px] h-[280px] rounded-full bg-emerald-500/10 blur-[70px] pointer-events-none" />

        {[
          { name: "Website Design", className: "top-16 right-24" },
          { name: "Blockchain", className: "top-28 left-10" },
          { name: "Crypto", className: "top-36 right-10" },
          { name: "E-Commerce", className: "top-52 right-28" },
          { name: "Golang", className: "bottom-36 left-14" },
          { name: "Automotive", className: "bottom-24 right-14" },
          { name: "Ruby on Rails", className: "bottom-32 left-36" },
        ].map((tag, i) => (
          <FloatingTag key={i} name={tag.name} className={tag.className} />
        ))}

        {[
          { bg: "bg-white", pos: "top-14 left-14" },
          { bg: "bg-orange-400", pos: "top-36 right-44" },
          { bg: "bg-sky-400", pos: "bottom-44 left-20" },
          { bg: "bg-violet-400", pos: "bottom-64 right-36" },
        ].map(({ bg, pos }, i) => (
          <div
            key={i}
            className={cn(
              "absolute w-10 h-10 rounded-full ring-2 ring-white/20 hidden xl:block",
              bg,
              pos,
            )}
          />
        ))}

        <div className="relative z-10 mt-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/20 rounded-full mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-300">
              Trusted by 2,400+ companies
            </span>
          </div>

          <h2 className="text-4xl font-bold leading-tight tracking-tight mb-4">
            Welcome home to
            <br />
            the top 7%
          </h2>
          <p className="text-base text-emerald-100/70 leading-relaxed max-w-sm">
            Access elite dev shops and fractional engineers. Move faster, build
            better, hire smarter.
          </p>

          <div className="flex gap-8 mt-10 pt-8 border-t border-white/10">
            <StatCard value="7,200+" label="Vetted agencies" />
            <StatCard value="94%" label="Client satisfaction" />
            <StatCard value="3 days" label="Avg. time to hire" />
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
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
};

export default LoginPage;
