import React from "react";
import { useSearchParams, Link } from "react-router";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export function ErrorPage() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error") || searchParams.get("error_description") || "An unknown authentication error occurred.";

  return (
    <div className="w-full max-w-md p-8 bg-card border border-border/60 rounded-2xl shadow-xl text-center backdrop-blur-sm">
      <div className="h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4 border border-destructive/20">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Authentication Error</h1>
      <p className="text-sm text-muted-foreground mb-6 break-words">
        {error}
      </p>
      <Link
        to="/sign-in"
        className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 transition-all gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Sign In
      </Link>
    </div>
  );
}
