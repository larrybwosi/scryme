import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router";
import { authClient, signInWithPasskey, signInWithSSO, DEFAULT_WEB_URL } from "@/lib/auth-client";
import {
  Building2,
  KeyRound,
  Eye,
  EyeOff,
  XCircle,
  Loader2,
  ArrowRight,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

export function SignInPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [domain, setDomain] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<"standard" | "sso">("standard");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl =
    searchParams.get("callbackUrl") ||
    searchParams.get("redirect_uri") ||
    DEFAULT_WEB_URL;

  useEffect(() => {
    let isMounted = true;
    async function checkExistingSession() {
      try {
        const sessionRes = await authClient.getSession();
        if (sessionRes?.data?.session || sessionRes?.session) {
          window.location.href = callbackUrl;
          return;
        }
      } catch (err) {
        // No active session or network error; proceed with sign in form
      } finally {
        if (isMounted) setCheckingSession(false);
      }
    }
    checkExistingSession();
    return () => {
      isMounted = false;
    };
  }, [callbackUrl]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await authClient.signIn.email({
        email,
        password,
      });

      if (res?.error) {
        setError(res.error.message || "Failed to sign in. Please check your credentials.");
        toast.error("Sign in failed");
      } else {
        toast.success("Signed in successfully!");
        window.location.href = callbackUrl;
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSsoSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) {
      setError("Please enter your organization domain or SSO slug.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await signInWithSSO(domain.trim(), callbackUrl);
      if (res?.error) {
        setError(res.error.message || "Failed to initiate Enterprise SSO sign-in.");
        toast.error("SSO sign in failed");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during SSO authentication.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "github" | "google") => {
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: callbackUrl,
      });
    } catch (err: any) {
      toast.error(`Failed to initiate ${provider} sign-in`);
    }
  };

  const handlePasskeySignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await signInWithPasskey();
      if (res?.error) {
        setError(res.error.message || "Passkey authentication failed.");
        toast.error("Passkey sign in failed");
      } else {
        toast.success("Signed in with Passkey!");
        window.location.href = callbackUrl;
      }
    } catch (err: any) {
      setError("Passkey authentication failed or was cancelled.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-8 w-8 text-[#A9824C] animate-spin" />
        <p className="text-sm text-[#5B6B7C] font-medium">Checking active session…</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Brand logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl bg-[#0F1B2E] flex items-center justify-center text-white font-bold text-[#DDC49B] shadow-sm">
          S
        </div>
        <span className="text-[#0F1B2E] font-bold text-xl tracking-tight">
          Scryme
        </span>
      </div>

      <div className="mb-6">
        <h1 className="font-serif text-[1.9rem] font-medium text-[#0F1B2E] leading-tight tracking-tight">
          Sign in to your account
        </h1>
        <p className="text-[#5B6B7C] text-sm mt-1.5">
          Access your Scryme workspace and enterprise integrations.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="grid grid-cols-2 p-1 bg-[#E7E2D9]/50 rounded-lg mb-6 border border-[#E7E2D9]">
        <button
          type="button"
          onClick={() => {
            setLoginMode("standard");
            setError(null);
          }}
          className={`py-2 text-xs font-semibold rounded-md transition-all ${
            loginMode === "standard"
              ? "bg-white text-[#0F1B2E] shadow-sm"
              : "text-[#5B6B7C] hover:text-[#0F1B2E]"
          }`}
        >
          Standard Login
        </button>
        <button
          type="button"
          onClick={() => {
            setLoginMode("sso");
            setError(null);
          }}
          className={`py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
            loginMode === "sso"
              ? "bg-white text-[#0F1B2E] shadow-sm"
              : "text-[#5B6B7C] hover:text-[#0F1B2E]"
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-[#A9824C]" />
          Enterprise SSO
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-md bg-[#B3352A]/10 border border-[#B3352A]/20 flex items-start gap-2.5 text-[#B3352A] text-xs font-medium">
          <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loginMode === "standard" ? (
        <>
          {/* Quick passkey button */}
          <button
            type="button"
            onClick={handlePasskeySignIn}
            disabled={loading}
            className="w-full h-10 border border-[#E7E2D9] hover:border-[#0F1B2E]/30 bg-white hover:bg-[#F2EFE9] text-[#0F1B2E] text-xs font-semibold rounded-md transition-all duration-150 flex items-center justify-center gap-2 mb-4"
          >
            <KeyRound className="h-3.5 w-3.5 text-[#A9824C]" />
            Sign in with Passkey
          </button>

          {/* Social login buttons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => handleSocialSignIn("github")}
              className="h-10 border border-[#E7E2D9] hover:border-[#0F1B2E]/30 bg-white hover:bg-[#F2EFE9] text-[#0F1B2E] text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2"
            >
              GitHub
            </button>
            <button
              type="button"
              onClick={() => handleSocialSignIn("google")}
              className="h-10 border border-[#E7E2D9] hover:border-[#0F1B2E]/30 bg-white hover:bg-[#F2EFE9] text-[#0F1B2E] text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-2"
            >
              Google
            </button>
          </div>

          <div className="relative my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-[#E7E2D9]" />
            <span className="text-[11px] font-mono text-[#9AA6B2] uppercase tracking-wider">
              or continue with email
            </span>
            <div className="flex-1 h-px bg-[#E7E2D9]" />
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#33404D]">
                  Password
                </label>
                <Link
                  to={`/forgot-password${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
                  className="text-xs text-[#8A6A3E] hover:text-[#0F1B2E] font-semibold transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-10 pl-3.5 pr-10 bg-white border border-[#E7E2D9] rounded-md text-sm text-[#0F1B2E] placeholder-[#9AA6B2] focus:outline-none focus:ring-2 focus:ring-[#A9824C]/25 focus:border-[#A9824C] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA6B2] hover:text-[#5B6B7C] transition-colors"
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
              className="w-full h-11 bg-[#0F1B2E] hover:bg-[#16283F] text-white font-semibold rounded-md transition-all duration-150 shadow-sm hover:shadow-md flex items-center justify-center gap-2 group mt-2 disabled:opacity-50"
            >
              {loading ? (
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
            </button>
          </form>
        </>
      ) : (
        <form onSubmit={handleSsoSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#33404D] mb-1.5">
              Organization Domain or SSO Slug
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9AA6B2]" />
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="company.com or org-slug"
                className="w-full h-10 pl-10 pr-3.5 bg-white border border-[#E7E2D9] rounded-md text-sm text-[#0F1B2E] placeholder-[#9AA6B2] focus:outline-none focus:ring-2 focus:ring-[#A9824C]/25 focus:border-[#A9824C] transition-all"
              />
            </div>
            <p className="text-[11px] text-[#5B6B7C] mt-1.5">
              You will be redirected to your company’s identity provider (Okta, SAML 2.0, Azure AD, or OIDC).
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#0F1B2E] hover:bg-[#16283F] text-white font-semibold rounded-md transition-all duration-150 shadow-sm hover:shadow-md flex items-center justify-center gap-2 group mt-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting to SSO…
              </>
            ) : (
              <>
                Continue with SSO
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-[#5B6B7C]">
        Don't have an account?{" "}
        <Link
          to={`/sign-up${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
          className="text-[#8A6A3E] font-semibold hover:text-[#0F1B2E] transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
