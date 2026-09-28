import React, { useEffect, useState } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

export function VerifyEmailPage() {
  const searchParams = useSearch({ strict: false }) as Record<string, string | undefined>;
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams?.token;

  useEffect(() => {
    if (!token) {
      setError("Verification token is missing.");
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const res = await authClient.verifyEmail({ query: { token } });
        if (res?.error) {
          setError(res.error.message || "Email verification failed.");
        } else {
          setVerified(true);
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300 text-center py-4">
      {loading ? (
        <div className="py-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#0F1B2E]" />
          <p className="text-sm font-medium text-[#5B6B7C]">
            Verifying your email address…
          </p>
        </div>
      ) : verified ? (
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#4FA871]/10 text-[#4FA871] flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-2xl font-medium text-[#0F1B2E]">
            Email verified
          </h1>
          <p className="text-xs text-[#5B6B7C] max-w-xs mx-auto">
            Your email address has been verified successfully. You can now sign in to your workspace.
          </p>
          <Link
            to="/sign-in"
            className="inline-flex items-center justify-center h-10 px-5 bg-[#0F1B2E] text-white text-xs font-semibold rounded-md hover:bg-[#16283F] transition-all gap-2 mt-2"
          >
            Continue to Sign In
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#B3352A]/10 text-[#B3352A] flex items-center justify-center mx-auto">
            <XCircle className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-2xl font-medium text-[#0F1B2E]">
            Verification failed
          </h1>
          <p className="text-xs text-[#5B6B7C] max-w-xs mx-auto">
            {error || "The verification link is invalid or has expired."}
          </p>
          <Link
            to="/sign-in"
            className="inline-flex items-center justify-center h-10 px-5 bg-[#0F1B2E] text-white text-xs font-semibold rounded-md hover:bg-[#16283F] transition-all"
          >
            Return to Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
