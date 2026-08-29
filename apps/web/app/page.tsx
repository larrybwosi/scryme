import { Metadata } from "next";
import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Welcome to Scryme — Enterprise Management",
  description: "All-in-one cloud platform for multi-branch inventory, supplier management, POS operations, and enterprise resource planning.",
};

export default async function LandingPage() {
  const auth = await getServerAuth();

  if (auth) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to Scryme</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Your all-in-one platform for inventory and supplier management.
      </p>
      <div className="flex gap-4">
        <a
          href="/login"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90">
          Login
        </a>
        <a
          href="/sign-up"
          className="px-6 py-3 border rounded-full font-bold hover:bg-muted">
          Sign Up
        </a>
      </div>
    </div>
  );
}
