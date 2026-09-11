"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookText,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  LayoutDashboard,
  Users,
  Code2,
  ExternalLink,
  LogOut,
  CheckCircle2,
} from "lucide-react";
import { colors, fonts } from "@/lib/scryme-tokens";
import { authClient, signIn } from "@/lib/auth-client";

const defaultWebUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://app.scryme.tech";

const defaultCrmUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : "https://crm.scryme.tech";

const webUrl =
  process.env.NEXT_PUBLIC_WEB_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  defaultWebUrl;

const crmUrl = process.env.NEXT_PUBLIC_CRM_URL || defaultCrmUrl;

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || searchParams.get("redirect");

  const session = authClient.useSession();
  const user = session?.data?.user;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await signIn.email({
        email,
        password,
      });

      if (res.error) {
        const isRateLimit =
          res.error.status === 429 ||
          res.error.message?.includes("TOO_MANY_REQUESTS") ||
          res.error.message?.includes("429") ||
          res.error.message?.includes("Too many requests");
        setError(
          isRateLimit
            ? "Too many login attempts. Please wait a moment and try again."
            : res.error.message || "Invalid credentials."
        );
      } else {
        if (callbackUrl) {
          if (callbackUrl.startsWith("/")) {
            router.push(callbackUrl);
          } else {
            window.location.href = callbackUrl;
          }
        } else {
          router.refresh();
        }
      }
    } catch (err: any) {
      const isRateLimit =
        err?.status === 429 ||
        err?.message?.includes("TOO_MANY_REQUESTS") ||
        err?.message?.includes("429") ||
        err?.message?.includes("Too many requests");
      setError(
        isRateLimit
          ? "Too many login attempts. Please wait a moment and try again."
          : err?.message || "An authentication error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  return (
    <div
      className="min-h-screen pt-24 pb-20 flex items-center justify-center px-4"
      style={{
        background: `radial-gradient(circle at 50% 20%, rgba(200, 154, 75, 0.08) 0%, ${colors.inkBg} 70%)`,
        fontFamily: fonts.body,
      }}
    >
      <div className="w-full max-w-lg">
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
            {user ? `Welcome back, ${user.name || user.email.split("@")[0]}` : "Sign in to Scryme Account"}
          </h1>
          <p className="text-xs text-[rgba(241,233,216,0.6)] mt-1.5">
            {user
              ? "Select an application below to access your workspace"
              : "Unified single sign-on across Scryme Web, CRM, and Developer services"}
          </p>
        </div>

        {/* Authenticated User Workspace Navigator */}
        {user ? (
          <div className="p-6 rounded-xl bg-[#121B2E] border border-[rgba(241,233,216,0.12)] shadow-2xl space-y-5">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0B1220] border border-[rgba(241,233,216,0.08)] text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#C89A4B] text-[#0B1220] flex items-center justify-center font-bold font-mono">
                  {(user.name || user.email || "U").substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-[#F1E9D8]">{user.name || "Logged In User"}</div>
                  <div className="text-[11px] text-[rgba(241,233,216,0.5)]">{user.email}</div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#C89A4B] block font-mono">
                Your Workspaces
              </span>

              {/* Web App Access */}
              <a
                href={`${webUrl}/dashboard`}
                className="group flex items-center justify-between p-4 rounded-lg bg-[#0B1220] border border-[rgba(241,233,216,0.1)] hover:border-[#C89A4B] transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(200,154,75,0.12)] border border-[rgba(200,154,75,0.25)] flex items-center justify-center text-[#C89A4B]">
                    <LayoutDashboard size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#F1E9D8] group-hover:text-[#C89A4B] transition-colors flex items-center gap-2">
                      <span>Scryme Operating Suite</span>
                      <ExternalLink size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-[rgba(241,233,216,0.6)] mt-0.5">
                      POS, inventory management, registers, and financial reporting
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-[rgba(241,233,216,0.4)] group-hover:text-[#C89A4B] group-hover:translate-x-0.5 transition-all" />
              </a>

              {/* CRM App Access */}
              <a
                href={crmUrl}
                className="group flex items-center justify-between p-4 rounded-lg bg-[#0B1220] border border-[rgba(241,233,216,0.1)] hover:border-[#C89A4B] transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.25)] flex items-center justify-center text-indigo-400">
                    <Users size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#F1E9D8] group-hover:text-[#C89A4B] transition-colors flex items-center gap-2">
                      <span>Scryme CRM & Marketing</span>
                      <ExternalLink size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-[rgba(241,233,216,0.6)] mt-0.5">
                      Customer leads, automated outreach, campaigns, and contacts
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-[rgba(241,233,216,0.4)] group-hover:text-[#C89A4B] group-hover:translate-x-0.5 transition-all" />
              </a>

              {/* Developer Console Access */}
              <Link
                href="/developer/dashboard"
                className="group flex items-center justify-between p-4 rounded-lg bg-[#0B1220] border border-[rgba(241,233,216,0.1)] hover:border-[#C89A4B] transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.25)] flex items-center justify-center text-emerald-400">
                    <Code2 size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#F1E9D8] group-hover:text-[#C89A4B] transition-colors">
                      Developer Console
                    </div>
                    <p className="text-xs text-[rgba(241,233,216,0.6)] mt-0.5">
                      API secret keys, OAuth 2.0 app credentials, and webhooks
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-[rgba(241,233,216,0.4)] group-hover:text-[#C89A4B] group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>
        ) : (
          /* Login Form Card */
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
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-[rgba(241,233,216,0.4)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@company.com"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.15)] text-sm text-[#F1E9D8] placeholder-[rgba(241,233,216,0.3)] focus:outline-none focus:border-[#C89A4B] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-[rgba(241,233,216,0.8)]">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-[rgba(241,233,216,0.4)]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
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
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-[rgba(241,233,216,0.1)] text-center text-xs text-[rgba(241,233,216,0.6)]">
              Don&apos;t have an account yet?{" "}
              <Link
                href={callbackUrl ? `/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/sign-up"}
                className="text-[#C89A4B] font-semibold hover:underline"
              >
                Create an Account
              </Link>
            </div>
          </div>
        )}

        {/* Security Footer Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[rgba(241,233,216,0.5)]">
          <ShieldCheck size={14} className="text-[#C89A4B]" />
          <span>Unified Cross-App Authentication & Enterprise Security</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-[#F1E9D8]">
          <span>Loading...</span>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
