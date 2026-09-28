import React, { useState } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { authClient, DEFAULT_WEB_URL } from "@/lib/auth-client";
import {
  Eye,
  EyeOff,
  XCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export function SignUpPage() {
  const searchParams = useSearch({ strict: false }) as Record<string, string | undefined>;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
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
          Create your account
        </h1>
        <p className="text-[#5B6B7C] text-sm mt-1.5">
          Get started with Scryme unified authentication.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-md bg-[#B3352A]/10 border border-[#B3352A]/20 flex items-start gap-2.5 text-[#B3352A] text-xs font-medium">
          <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

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
            className="w-full h-10 px-3.5 bg-white border border-[#E7E2D9] rounded-md text-sm text-[#0F1B2E] placeholder-[#9AA6B2] focus:outline-none focus:ring-2 focus:ring-[#A9824C]/25 focus:border-[#A9824C] transition-all"
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
            className="w-full h-10 px-3.5 bg-white border border-[#E7E2D9] rounded-md text-sm text-[#0F1B2E] placeholder-[#9AA6B2] focus:outline-none focus:ring-2 focus:ring-[#A9824C]/25 focus:border-[#A9824C] transition-all"
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
