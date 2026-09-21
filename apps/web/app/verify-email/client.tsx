"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@repo/ui/components/ui/button";
import { Loader2, CheckCircle, AlertCircle, ArrowRight, Shield } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

const ScrymeLogo = () => (
  <div className="flex items-center gap-1">
    <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
      <span className="text-white font-black text-xs tracking-tight">S</span>
    </div>
    <span className="text-xl font-bold tracking-tight text-gray-900">
      scry<span className="text-emerald-600">me</span>
    </span>
  </div>
);

function VerifyEmailContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("Verifying your email address...");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing or invalid.");
      return;
    }

    const verify = async () => {
      try {
        const { error } = await authClient.verifyEmail({ token });
        if (error) {
          setStatus("error");
          setMessage(error.message || "Email verification failed. The link may have expired.");
        } else {
          setStatus("success");
          setMessage("Your email address has been successfully verified!");
          setTimeout(() => {
            router.push("/dashboard");
          }, 3000);
        }
      } catch (e: any) {
        setStatus("error");
        setMessage(e?.message || "An error occurred during email verification.");
      }
    };

    verify();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center animate-in fade-in duration-300">
        <div className="flex justify-center mb-6">
          <ScrymeLogo />
        </div>

        {status === "loading" && (
          <div className="py-8 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">Verifying Email...</h2>
            <p className="text-sm text-gray-500">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
            <p className="text-sm text-gray-600">{message}</p>
            <p className="text-xs text-gray-400">Redirecting to your dashboard in 3 seconds...</p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg mt-4 flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="py-6 space-y-4">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
            <p className="text-sm text-gray-600">{message}</p>
            <Button
              onClick={() => router.push("/login")}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg mt-4"
            >
              Back to Login
            </Button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Shield className="h-3.5 w-3.5 text-gray-400" />
          <span>Secured by Scryme Identity Platform</span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
