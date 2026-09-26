import React, { useState } from "react";
import { useSearchParams, Link } from "react-router";
import { authClient, signInWithPasskey } from "@/lib/auth-client";
import { KeyRound, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function SignInPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") || searchParams.get("redirect_uri") || "/";

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await authClient.signIn.email({
        email,
        password,
      });

      if (res.error) {
        setError(res.error.message || "Failed to sign in. Please check your credentials.");
        toast.error("Sign in failed");
      } else {
        toast.success("Signed in successfully!");
        window.location.href = callbackUrl;
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "github" | "google") => {
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: callbackUrl,
      });
    } catch (err: any) {
      toast.error(`Failed to initiate ${provider} sign-in`);
    }
  };

  const handlePasskeySignIn = async () => {
    try {
      setLoading(true);
      const res = await signInWithPasskey();
      if (res?.error) {
        toast.error(res.error.message || "Passkey sign-in failed");
      } else {
        toast.success("Signed in with Passkey!");
        window.location.href = callbackUrl;
      }
    } catch (err: any) {
      toast.error("Passkey sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-card border border-border/60 rounded-2xl shadow-xl backdrop-blur-sm">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Sign in to Scryme</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your credentials to access your account
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <Link
              to={`/forgot-password${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
              className="text-xs text-primary hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Continue"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground font-medium">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          type="button"
          onClick={() => handleSocialSignIn("github")}
          className="py-2.5 px-4 bg-background hover:bg-muted border border-border rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          GitHub
        </button>
        <button
          type="button"
          onClick={() => handleSocialSignIn("google")}
          className="py-2.5 px-4 bg-background hover:bg-muted border border-border rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          Google
        </button>
      </div>

      <button
        type="button"
        onClick={handlePasskeySignIn}
        className="w-full py-2.5 px-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        <KeyRound className="h-4 w-4" />
        Sign in with Passkey
      </button>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          to={`/sign-up${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
          className="text-primary font-semibold hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
