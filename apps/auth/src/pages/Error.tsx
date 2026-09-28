import React from "react";
import { useSearchParams, Link } from "react-router";
import { AlertCircle, ArrowLeft } from "lucide-react";

export function ErrorPage() {
  const [searchParams] = useSearchParams();
  const error =
    searchParams.get("error") ||
    searchParams.get("error_description") ||
    "An unknown authentication error occurred.";

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300 text-center py-4">
      <div className="w-12 h-12 rounded-full bg-[#B3352A]/10 text-[#B3352A] flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>

      <h1 className="font-serif text-2xl font-medium text-[#0F1B2E] mb-2">
        Authentication Error
      </h1>

      <p className="text-xs text-[#5B6B7C] max-w-xs mx-auto mb-6 break-words leading-relaxed">
        {error}
      </p>

      <Link
        to="/sign-in"
        className="inline-flex items-center justify-center h-10 px-5 bg-[#0F1B2E] text-white text-xs font-semibold rounded-md hover:bg-[#16283F] transition-all gap-2"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Return to Sign In
      </Link>
    </div>
  );
}
