"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function CrmClientRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
      <div className="relative flex items-center justify-center mb-6">
        <div className="w-12 h-12 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
      </div>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
        Redirecting to CRM Dashboard...
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        Please wait a moment while we set up your workspace environment.
      </p>
      <noscript>
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 text-sm">
          JavaScript is required for automatic redirect. Click below to continue:
          <div className="mt-2">
            <a
              href="/dashboard"
              className="inline-block px-4 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </noscript>
    </div>
  );
}
