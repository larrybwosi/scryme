"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export function WebClientRedirect() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session) {
      router.replace("/dashboard");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Loading Scryme ERP...
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Please wait while we check your session status.
        </p>
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Redirecting to Workspace...
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Navigating to your enterprise dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center max-w-2xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
        Scryme Enterprise Resource Planning
      </div>
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
        Welcome to Scryme
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
        Your all-in-one cloud platform for multi-branch inventory control, supplier management, POS operations, and enterprise administration.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <a
          href="/login"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold shadow hover:bg-primary/90 transition-colors"
        >
          Sign In
        </a>
        <a
          href="/sign-up"
          className="px-6 py-3 border border-border bg-background text-foreground rounded-full font-semibold hover:bg-accent transition-colors"
        >
          Create Account
        </a>
      </div>
    </div>
  );
}
