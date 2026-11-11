import React, { useEffect, useState } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { customerAuthClient } from "@/lib/customer-auth-client";
import { resolveTenantContext } from "@/lib/tenant";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

export function VerifyEmailPage() {
  const searchParams = useSearch({ strict: false }) as Record<string, string | undefined>;
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tenantContext = resolveTenantContext(undefined, searchParams);
  const isCustomer = tenantContext.isCustomer;

  const token = searchParams?.token;
  const callbackUrl =
    searchParams?.callbackURL ||
    searchParams?.callbackUrl ||
    searchParams?.redirect_uri ||
    searchParams?.returnTo;

  useEffect(() => {
    if (!token) {
      setError("Verification token is missing.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    const verify = async () => {
      try {
        let res;
        if (isCustomer) {
          res = await customerAuthClient.verifyEmail({ query: { token } });
        } else {
          res = await authClient.verifyEmail({ query: { token } });
        }

        if (res?.error) {
          if (isMounted) setError(res.error.message || "Email verification failed.");
        } else {
          if (isMounted) {
            setVerified(true);
            if (callbackUrl) {
              setTimeout(() => {
                window.location.href = callbackUrl;
              }, 2000);
            }
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "An unexpected error occurred.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verify();
    return () => {
      isMounted = false;
    };
  }, [token, isCustomer, callbackUrl]);

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300 text-center py-4">
      {loading ? (
        <div className="py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#A9824C]" />
          <p className="text-xs font-mono tracking-wide text-[#5B6B7C] uppercase">
            Verifying your email address…
          </p>
        </div>
      ) : verified ? (
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-none bg-[#4FA871]/10 text-[#4FA871] flex items-center justify-center mx-auto border border-[#4FA871]/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-2xl font-medium text-[#0F1B2E]">
            Email verified
          </h1>
          <p className="text-xs text-[#5B6B7C] max-w-xs mx-auto leading-relaxed">
            Your email address has been verified successfully. You can now sign in to your workspace.
          </p>
          {callbackUrl ? (
            <a
              href={callbackUrl}
              className="inline-flex items-center justify-center h-10 px-5 bg-[#0F1B2E] text-white text-xs font-semibold rounded-none hover:bg-[#16283F] transition-all gap-2 mt-2 cursor-pointer shadow-sm"
            >
              Continue to Application
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          ) : (
            <Link
              to="/sign-in"
              search={searchParams}
              className="inline-flex items-center justify-center h-10 px-5 bg-[#0F1B2E] text-white text-xs font-semibold rounded-none hover:bg-[#16283F] transition-all gap-2 mt-2 cursor-pointer shadow-sm"
            >
              Continue to Sign In
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-none bg-[#B3352A]/10 text-[#B3352A] flex items-center justify-center mx-auto border border-[#B3352A]/20">
            <XCircle className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-2xl font-medium text-[#0F1B2E]">
            Verification failed
          </h1>
          <p className="text-xs text-[#5B6B7C] max-w-xs mx-auto leading-relaxed">
            {error || "The verification link is invalid or has expired."}
          </p>
          <Link
            to="/sign-in"
            className="inline-flex items-center justify-center h-10 px-5 bg-[#0F1B2E] text-white text-xs font-semibold rounded-none hover:bg-[#16283F] transition-all cursor-pointer shadow-sm"
          >
            Return to Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
