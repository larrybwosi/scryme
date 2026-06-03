"use client";

import React, { useState, useEffect, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Loader2,
  Eye,
  EyeOff,
  XCircle,
  ArrowRight,
  Shield,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "sonner";

// Zod validation schemas
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Logos
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

import { Suspense } from "react";

const PasswordResetPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    }>
      <PasswordResetForm />
    </Suspense>
  );
};

const PasswordResetForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) {
      setMessage("Invalid or missing reset token");
      setStatus("error");
      return;
    }
    setToken(tokenFromUrl);
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setMessage("Reset token is missing");
      setStatus("error");
      return;
    }

    setIsLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const { data: result, error } = await authClient.resetPassword({
        newPassword: data.password,
        token,
      });

      if (error) {
        setStatus("error");
        setMessage(
          error.message ||
            "Failed to reset password. The link may have expired.",
        );
        toast.error(error.message || "Failed to reset password.");
      } else if (result) {
        setStatus("success");
        setMessage("Password reset successfully! Redirecting to login...");
        toast.success("Password reset successfully!");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (error) {
      setStatus("error");
      setMessage("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred.");
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

  const ErrorMessage = ({ text }: { text: string }) => (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
      <span className="text-red-800 text-sm font-medium">{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Left Panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-[420px]">
          {/* Header row */}
          <div className="flex items-center justify-between mb-10">
            <DealioLogo />
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={() => router.push("/login")}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to login
            </button>

            <div className="mb-8">
              <h1 className="text-[1.75rem] font-bold text-gray-900 leading-tight tracking-tight">
                Create new password
              </h1>
              <p className="text-gray-500 text-sm mt-2">
                Enter your new password below. Make sure it&#39;s strong and
                secure.
              </p>
            </div>

            {status === "success" && <SuccessMessage text={message} />}
            {status === "error" && <ErrorMessage text={message} />}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FieldWrapper
                label="New password"
                error={errors.password?.message}
              >
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="At least 8 characters"
                    className={cn(
                      "h-10 text-sm rounded-lg border-gray-200 pr-10 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500",
                      errors.password &&
                        "border-red-400 focus-visible:ring-red-500/20 focus-visible:border-red-400",
                    )}
                    disabled={isLoading || status === "success"}
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
              </FieldWrapper>

              <FieldWrapper
                label="Confirm password"
                error={errors.confirmPassword?.message}
              >
                <Input
                  type="password"
                  {...register("confirmPassword")}
                  placeholder="Confirm your new password"
                  className={cn(
                    "h-10 text-sm rounded-lg border-gray-200 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500",
                    errors.confirmPassword &&
                      "border-red-400 focus-visible:ring-red-500/20 focus-visible:border-red-400",
                  )}
                  disabled={isLoading || status === "success"}
                />
              </FieldWrapper>

              <Button
                type="submit"
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all duration-150 shadow-sm hover:shadow-md flex items-center justify-center gap-2 group mt-2"
                disabled={isLoading || status === "success"}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    Reset password
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </div>

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
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow blob */}
        <div className="absolute top-[-80px] right-[-80px] w-[360px] h-[360px] rounded-full bg-emerald-400/10 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[280px] h-[280px] rounded-full bg-emerald-500/10 blur-[70px] pointer-events-none" />

        {/* Floating skill tags */}
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

        {/* Avatars */}
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

        {/* Main copy */}
        <div className="relative z-10 mt-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/20 rounded-full mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-300">
              Trusted by 2,400+ companies
            </span>
          </div>

          <h2 className="text-4xl font-bold leading-tight tracking-tight mb-4">
            Secure your account
            <br />
            with Dealio
          </h2>
          <p className="text-base text-emerald-100/70 leading-relaxed max-w-sm">
            Create a strong password to protect your ecommerce empire. Sync
            inventory, automate workflows, and drive unparalleled revenue
            growth.
          </p>

          {/* Stats row */}
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

export default PasswordResetPage;
