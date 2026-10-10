import React, { useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { Eye, EyeOff, XCircle, ArrowLeft, Loader2, AlertCircle, KeyRound } from "lucide-react";
import { toast } from "sonner";

export function ResetPasswordPage() {
  const searchParams = useSearch({ strict: false }) as Record<string, string | undefined>;
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams?.token;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Reset token is missing or invalid.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authClient.resetPassword({
        newPassword,
        token,
      });

      if (res?.error) {
        setError(res.error.message || "Failed to reset password. Token may have expired.");
        toast.error("Password reset failed");
      } else {
        toast.success("Password reset successfully!");
        navigate({ to: "/sign-in" });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full animate-in fade-in duration-300 text-center py-6">
        <AlertCircle className="h-10 w-10 text-[#B3352A] mx-auto mb-3" />
        <h1 className="font-serif text-xl font-medium text-[#0F1B2E] mb-2">
          Invalid Reset Link
        </h1>
        <p className="text-xs text-[#5B6B7C] max-w-xs mx-auto mb-6 leading-relaxed">
          The password reset link is invalid or expired. Please request a new link.
        </p>
        <Link
          to="/forgot-password"
          className="inline-flex items-center justify-center h-10 px-4 bg-[#0F1B2E] text-white text-xs font-semibold rounded-lg hover:bg-[#16283F] transition-all"
        >
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Link
        to="/sign-in"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#5B6B7C] hover:text-[#0F1B2E] mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
      </Link>

      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#A9824C]/10 border border-[#A9824C]/20 rounded-full mb-3 text-[10px] font-mono font-semibold text-[#8A6A3E] uppercase tracking-wider">
          <KeyRound className="w-3 h-3 text-[#A9824C]" /> New Credentials
        </div>
        <h1 className="font-serif text-[1.9rem] font-medium text-[#0F1B2E] leading-tight tracking-tight">
          Set new password
        </h1>
        <p className="text-[#5B6B7C] text-sm mt-1.5 leading-relaxed">
          Enter your new password below to update your security credentials.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-lg bg-[#B3352A]/10 border border-[#B3352A]/20 flex items-start gap-2.5 text-[#B3352A] text-xs font-medium animate-in fade-in duration-150">
          <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleResetPassword} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#33404D]">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full h-10 pl-3.5 pr-10 bg-white border border-[#E7E2D9] rounded-lg text-sm text-[#0F1B2E] placeholder-[#9AA6B2] focus:outline-none focus:ring-2 focus:ring-[#A9824C]/25 focus:border-[#A9824C] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA6B2] hover:text-[#5B6B7C] transition-colors cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-[#0F1B2E] hover:bg-[#16283F] text-white font-semibold rounded-lg transition-all duration-150 shadow-sm hover:shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Resetting password…
            </>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>
    </div>
  );
}
