import React, { useState } from "react";
import { useSearchParams, Link } from "react-router";
import { requestPasswordReset } from "@/lib/auth-client";
import { Mail, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await requestPasswordReset(
        email,
        `${window.location.origin}/reset-password`
      );

      if (res.error) {
        toast.error(res.error.message || "Failed to send reset email.");
      } else {
        setSubmitted(true);
        toast.success("Password reset instructions sent!");
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-card border border-border/60 rounded-2xl shadow-xl backdrop-blur-sm">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your email and we'll send you instructions
        </p>
      </div>

      {submitted ? (
        <div className="text-center space-y-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Reset link sent to {email}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Please check your inbox and follow the instructions to reset your password.
          </p>
          <Link
            to={`/sign-in${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
            className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-secondary text-secondary-foreground font-semibold rounded-xl text-sm hover:bg-secondary/80 transition-colors mt-4"
          >
            Return to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleResetRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Sending link..." : "Send Reset Link"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link
          to={`/sign-in${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
          className="text-primary font-semibold hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
