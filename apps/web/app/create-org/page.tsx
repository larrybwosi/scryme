import { Metadata } from "next";
import { Suspense } from "react";
import ClientPage from "./client";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Create Organization",
  description: "Set up a new organization on Scryme to begin managing inventory, branches, and point-of-sale systems.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <ClientPage />
    </Suspense>
  );
}
