import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router";
import { authClient } from "@/lib/auth-client";
import { CheckCircle2, AlertCircle, Loader2, ShieldCheck } from "lucide-react";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Verification token is missing.");
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const res = await authClient.verifyEmail({ query: { token } });
        if (res.error) {
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
    <div className="w-full max-w-md p-8 bg-card border border-border/60 rounded-2xl shadow-xl text-center">
      <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
        <ShieldCheck className="h-6 w-6" />
      </div>

      {loading ? (
        <div className="py-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Verifying your email address...</p>
        </div>
      ) : verified ? (
        <div className="space-y-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
          <h1 className="text-2xl font-bold">Email Verified!</h1>
          <p className="text-sm text-muted-foreground">
            Your email address has been successfully verified. You can now sign in to your account.
          </p>
          <Link
            to="/sign-in"
            className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 transition-all mt-4"
          >
            Continue to Sign In
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Verification Failed</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Link
            to="/sign-in"
            className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-secondary text-secondary-foreground font-semibold rounded-xl text-sm hover:bg-secondary/80 transition-all mt-4"
          >
            Return to Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
