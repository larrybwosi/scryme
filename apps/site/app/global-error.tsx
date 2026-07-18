"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="flex items-center justify-center min-h-screen bg-slate-50 font-sans">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h1>
          <p className="text-slate-600 mb-4">An unexpected system error occurred. Our team has been notified and is looking into it.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors"
          >
            Reload Page
          </button>
        </div>
      </body>
    </html>
  );
}
