import React, { useState } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { requestPasswordReset } from "@/lib/auth-client";
import { ArrowLeft, XCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ForgotPasswordPage() {
  const searchParams = useSearch({ strict: false }) as Record<string, string | undefined>;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await requestPasswordReset(
        email,
        `${window.location.origin}/reset-password`
      );

      if (res?.error) {
        setError(res.error.message || "Failed to send reset email.");
        toast.error("Request failed");
      } else {
        setSubmitted(true);
        toast.success("Password reset instructions sent!");
      }
    } catch (err: any) {
      setError("An unexpected error occurred sending instructions.");
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Link
        to="/sign-in"
        search={searchParams}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#5B6B7C] hover:text-[#0F1B2E] mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
      </Link>

      <div className="mb-6">
        <h1 className="font-serif text-[1.9rem] font-medium text-[#0F1B2E] leading-tight tracking-tight">
          Reset password
        </h1>
        <p className="text-[#5B6B7C] text-sm mt-1.5">
          Enter your work email and we&apos;ll send you instructions to reset your password.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-md bg-[#B3352A]/10 border border-[#B3352A]/20 flex items-start gap-2.5 text-[#B3352A] text-xs font-medium">
          <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {submitted ? (
        <div className="p-4 rounded-md bg-[#4FA871]/10 border border-[#4FA871]/20 text-[#0F1B2E] space-y-3">
          <div className="flex items-center gap-2 text-[#4FA871] font-semibold text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>Instructions sent</span>
          </div>
          <p className="text-xs text-[#5B6B7C] leading-relaxed">
            If an account exists for <strong>{email}</strong>, you will receive an email with password reset instructions shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleResetRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#33404D] mb-1.5">
              Work Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full h-10 px-3.5 bg-white border border-[#E7E2D9] rounded-md text-sm text-[#0F1B2E] placeholder-[#9AA6B2] focus:outline-none focus:ring-2 focus:ring-[#A9824C]/25 focus:border-[#A9824C] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#0F1B2E] hover:bg-[#16283F] text-white font-semibold rounded-md transition-all duration-150 shadow-sm hover:shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending instructions…
              </>
            ) : (
              "Send reset instructions"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
