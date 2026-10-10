import React, { useState } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { authClient, signInWithPasskey, DEFAULT_WEB_URL } from "@/lib/auth-client";
import {
  Eye,
  EyeOff,
  XCircle,
  Loader2,
  ArrowRight,
  Lock,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="shrink-0">
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

const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-[#0F1B2E]">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export function SignUpPage() {
  const searchParams = useSearch({ strict: false }) as Record<string, string | undefined>;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl =
    searchParams?.callbackUrl ||
    searchParams?.redirect_uri ||
    DEFAULT_WEB_URL;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (res?.error) {
        setError(res.error.message || "Failed to create account. Please try again.");
        toast.error("Sign up failed");
      } else {
        toast.success("Account created successfully!");
        window.location.href = callbackUrl;
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "github" | "google") => {
    setSocialLoading(provider);
    setError(null);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: callbackUrl,
      });
    } catch (err: any) {
      toast.error(`Failed to initiate ${provider} sign-up`);
      setSocialLoading(null);
    }
  };

  const handlePasskeySignIn = async () => {
    setPasskeyLoading(true);
    setError(null);
    try {
      const res = await signInWithPasskey({
        callbackURL: callbackUrl,
      });
      if (res?.error) {
        setError(res.error.message || "Passkey authentication failed.");
      } else if (res?.data) {
        toast.success("Signed in with Passkey!");
        window.location.href = callbackUrl;
      }
    } catch (err: any) {
      if (err?.name === "NotAllowedError" || err?.message?.includes("cancelled")) {
        return;
      }
      setError(err?.message || "Passkey authentication failed.");
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E7E2D9]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0F1B2E] flex items-center justify-center text-white font-bold text-[#DDC49B] shadow-sm">
            S
          </div>
          <div>
            <span className="text-[#0F1B2E] font-bold text-lg tracking-tight block leading-none">
              Scryme
            </span>
            <span className="text-[10px] font-mono text-[#A9824C] uppercase tracking-wider block mt-0.5">
              Registration Portal
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#A9824C]/10 border border-[#A9824C]/20 rounded-full text-[10px] font-mono text-[#8A6A3E]">
          <Lock className="w-3 h-3 text-[#A9824C]" />
          <span>Verified Account</span>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="font-serif text-[1.9rem] font-medium text-[#0F1B2E] leading-tight tracking-tight">
          Create your account
        </h1>
        <p className="text-[#5B6B7C] text-sm mt-1.5 leading-relaxed">
          Get started with Scryme unified authentication and enterprise tools.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-lg bg-[#B3352A]/10 border border-[#B3352A]/20 flex items-start gap-2.5 text-[#B3352A] text-xs font-medium animate-in fade-in duration-150">
          <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Social Registration */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          type="button"
          onClick={() => handleSocialSignIn("google")}
          disabled={socialLoading !== null || loading}
          className="h-10 border border-[#E7E2D9] hover:border-[#0F1B2E]/30 bg-white hover:bg-[#FBFAF7] text-[#0F1B2E] text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
        >
          {socialLoading === "google" ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#A9824C]" />
          ) : (
            <GoogleIcon />
          )}
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => handleSocialSignIn("github")}
          disabled={socialLoading !== null || loading}
          className="h-10 border border-[#E7E2D9] hover:border-[#0F1B2E]/30 bg-white hover:bg-[#FBFAF7] text-[#0F1B2E] text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
        >
          {socialLoading === "github" ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#A9824C]" />
          ) : (
            <GithubIcon />
          )}
          <span>GitHub</span>
        </button>
      </div>

      {/* Existing Passkey Shortcut */}
      <button
        type="button"
        onClick={handlePasskeySignIn}
        disabled={passkeyLoading || loading}
        className="w-full h-10 border border-[#E7E2D9] hover:border-[#A9824C]/50 bg-white hover:bg-[#F2EFE9] text-[#5B6B7C] hover:text-[#0F1B2E] text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 mb-4 cursor-pointer shadow-sm"
      >
        {passkeyLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#A9824C]" />
        ) : (
          <KeyRound className="h-3.5 w-3.5 text-[#A9824C]" />
        )}
        <span>Already registered a Passkey? Sign in</span>
      </button>

      <div className="relative my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-[#E7E2D9]" />
        <span className="text-[10px] font-mono text-[#9AA6B2] uppercase tracking-wider bg-[#FBFAF7] px-1">
          or sign up with email
        </span>
        <div className="flex-1 h-px bg-[#E7E2D9]" />
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#33404D] mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full h-10 px-3.5 bg-white border border-[#E7E2D9] rounded-lg text-sm text-[#0F1B2E] placeholder-[#9AA6B2] focus:outline-none focus:ring-2 focus:ring-[#A9824C]/25 focus:border-[#A9824C] transition-all"
          />
        </div>

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
            className="w-full h-10 px-3.5 bg-white border border-[#E7E2D9] rounded-lg text-sm text-[#0F1B2E] placeholder-[#9AA6B2] focus:outline-none focus:ring-2 focus:ring-[#A9824C]/25 focus:border-[#A9824C] transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#33404D]">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          className="w-full h-11 bg-[#0F1B2E] hover:bg-[#16283F] text-white font-semibold rounded-lg transition-all duration-150 shadow-sm hover:shadow-md flex items-center justify-center gap-2 group mt-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[#5B6B7C]">
        Already have an account?{" "}
        <Link
          to="/sign-in"
          search={searchParams}
          className="text-[#8A6A3E] font-semibold hover:text-[#0F1B2E] transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
