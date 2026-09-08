"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookText,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { colors, fonts } from "@/lib/scryme-tokens";
import { authClient, signUp } from "@/lib/auth-client";

function SignUpFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || searchParams.get("redirect");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await signUp.email({
        name: name.trim(),
        email,
        password,
      });

      if (res.error) {
        setError(res.error.message || "Registration failed. Please try again.");
      } else {
        if (callbackUrl) {
          if (callbackUrl.startsWith("/")) {
            router.push(callbackUrl);
          } else {
            window.location.href = callbackUrl;
          }
        } else {
          router.push("/login");
        }
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred during account creation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen pt-24 pb-20 flex items-center justify-center px-4"
      style={{
        background: `radial-gradient(circle at 50% 20%, rgba(200, 154, 75, 0.08) 0%, ${colors.inkBg} 70%)`,
        fontFamily: fonts.body,
      }}
    >
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: colors.brass,
                boxShadow: "0 0 20px rgba(200, 154, 75, 0.3)",
              }}
            >
              <BookText size={20} style={{ color: colors.inkBg }} />
            </div>
            <span
              className="text-2xl font-bold tracking-tight text-[#F1E9D8]"
              style={{ fontFamily: fonts.display }}
            >
              Scryme
            </span>
          </Link>
          <h1 className="text-xl font-bold text-[#F1E9D8] tracking-tight">
            Create your Scryme Account
          </h1>
          <p className="text-xs text-[rgba(241,233,216,0.6)] mt-1.5">
            Get instant access to Scryme Web, CRM, POS & Developer APIs
          </p>
        </div>

        {/* Sign Up Card */}
        <div className="p-6 rounded-xl bg-[#121B2E] border border-[rgba(241,233,216,0.12)] shadow-2xl">
          {error && (
            <div className="mb-5 p-3 rounded-md border bg-rose-500/10 border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[rgba(241,233,216,0.8)] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-[rgba(241,233,216,0.4)]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.15)] text-sm text-[#F1E9D8] placeholder-[rgba(241,233,216,0.3)] focus:outline-none focus:border-[#C89A4B] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[rgba(241,233,216,0.8)] mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-[rgba(241,233,216,0.4)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.15)] text-sm text-[#F1E9D8] placeholder-[rgba(241,233,216,0.3)] focus:outline-none focus:border-[#C89A4B] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[rgba(241,233,216,0.8)] mb-1.5">
                Password (min. 8 characters)
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-[rgba(241,233,216,0.4)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={8}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.15)] text-sm text-[#F1E9D8] placeholder-[rgba(241,233,216,0.3)] focus:outline-none focus:border-[#C89A4B] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 rounded-md font-semibold text-sm bg-[#C89A4B] text-[#0B1220] hover:bg-[#d4a859] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[rgba(241,233,216,0.1)] text-center text-xs text-[rgba(241,233,216,0.6)]">
            Already have an account?{" "}
            <Link
              href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
              className="text-[#C89A4B] font-semibold hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[rgba(241,233,216,0.5)]">
          <ShieldCheck size={14} className="text-[#C89A4B]" />
          <span>Encrypted Session Credentials & Cross-Domain Auth</span>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-[#F1E9D8]">
          <span>Loading...</span>
        </div>
      }
    >
      <SignUpFormContent />
    </Suspense>
  );
}
