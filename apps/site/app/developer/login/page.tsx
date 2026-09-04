"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookText, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { colors, fonts } from "@/lib/scryme-tokens";
import { useDeveloperAuth } from "@/lib/developer-auth";

export default function DeveloperLoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useDeveloperAuth();

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

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await login(email, password);
      if (res.success) {
        router.push("/developer/dashboard");
      } else {
        setError(res.error || "Invalid developer credentials.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to log into developer account.");
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
          <Link href="/developer" className="inline-flex items-center gap-2 mb-4">
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center"
              style={{
                backgroundColor: colors.brass,
                boxShadow: "0 0 16px rgba(200, 154, 75, 0.25)",
              }}
            >
              <BookText size={18} style={{ color: colors.inkBg }} />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#F1E9D8]" style={{ fontFamily: fonts.display }}>
              Scryme Devs
            </span>
          </Link>
          <h1 className="text-xl font-bold text-[#F1E9D8] tracking-tight">Sign in to Developer Console</h1>
          <p className="text-xs text-[rgba(241,233,216,0.6)] mt-1.5">
            Manage your API Keys, OAuth 2.0 Client credentials & Webhooks
          </p>
        </div>

        {/* Login Form Card */}
        <div className="p-6 rounded-lg bg-[#121B2E] border border-[rgba(241,233,216,0.12)] shadow-xl">
          {error && (
            <div className="mb-5 p-3 rounded-md border bg-rose-500/10 border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[rgba(241,233,216,0.8)] mb-1.5">
                Developer Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-[rgba(241,233,216,0.4)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@company.com"
                  required
                  className="w-full pl-9 pr-3.5 py-2 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.15)] text-sm text-[#F1E9D8] placeholder-[rgba(241,233,216,0.3)] focus:outline-none focus:border-[#C89A4B] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[rgba(241,233,216,0.8)]">
                  Account Password
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
                  className="w-full pl-9 pr-3.5 py-2 rounded-md bg-[#0B1220] border border-[rgba(241,233,216,0.15)] text-sm text-[#F1E9D8] placeholder-[rgba(241,233,216,0.3)] focus:outline-none focus:border-[#C89A4B] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || authLoading}
              className="w-full mt-2 py-2.5 rounded-md font-semibold text-sm bg-[#C89A4B] text-[#0B1220] hover:bg-[#d4a859] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[rgba(241,233,216,0.1)] text-center text-xs text-[rgba(241,233,216,0.6)]">
            Don&apos;t have a developer account yet?{" "}
            <Link href="/developer/register" className="text-[#C89A4B] font-semibold hover:underline">
              Create Developer Workspace
            </Link>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[rgba(241,233,216,0.5)]">
          <ShieldCheck size={14} className="text-[#C89A4B]" />
          <span>OAuth 2.0 & Timing-Safe Hashed Authorization</span>
        </div>
      </div>
    </div>
  );
}
