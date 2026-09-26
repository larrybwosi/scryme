import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import { authClient } from "@/lib/auth-client";
import { Lock, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get("token");

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

      if (res.error) {
        setError(res.error.message || "Failed to reset password. Token may have expired.");
        toast.error("Password reset failed");
      } else {
        toast.success("Password reset successfully!");
        navigate("/sign-in");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md p-8 bg-card border border-border/60 rounded-2xl shadow-xl text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Invalid Reset Link</h1>
        <p className="text-sm text-muted-foreground mb-6">
          This password reset link is invalid or incomplete.
        </p>
        <Link
          to="/forgot-password"
          className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 transition-all"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 bg-card border border-border/60 rounded-2xl shadow-xl backdrop-blur-sm">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Set new password</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your new password below
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleResetPassword} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? "Updating password..." : "Update Password"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
