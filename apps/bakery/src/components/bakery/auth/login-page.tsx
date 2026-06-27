"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useNavigate as useRouter } from "react-router";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Alert, AlertDescription } from "@repo/ui/components/ui/alert";
import { Separator } from "@repo/ui/components/ui/separator";
import { Eye, EyeOff, Lock, Mail, User, Utensils } from "lucide-react";
// // import Image from 'next/image';
import { signIn } from "@/lib/auth/authClient";

// Google icon component
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export function BakeryLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const navigate = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error } = await signIn.email({
        email,
        password,
        callbackURL: "/",
      });

      if (error) {
        setError(
          error.message || "Login failed. Please check your credentials.",
        );
        return;
      }

      if (data) {
        // Successful login - redirect to bakery dashboard
        console.log("Login successful:", data);
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "github") => {
    setError("");
    setSocialLoading(provider);

    try {
      const { error } = await signIn.social({ provider });

      if (error) {
        setError(
          error.message || `${provider} login failed. Please try again.`,
        );
        return;
      }

      // Social login will redirect to provider, then callback will handle the rest
      // The auth callback should redirect to bakery dashboard after successful authentication
    } catch (err: any) {
      setError(err.message || `${provider} login failed. Please try again.`);
      setSocialLoading(null);
    }
  };

  const handleSignUp = () => {
    // navigate('/bakery/signup');
  };

  const handleForgotPassword = () => {
    // navigate('/bakery/forgot-password');
  };

  const handleBakerApplication = () => {
    // navigate('/bakery/apply');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-2xl shadow-lg mb-4 border-primary/20 overflow-hidden">
            <img
              src="/logo.jpeg"
              alt="Scryme Bakery Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Scryme Bakery
          </h1>
          <p className="text-primary/70">Fresh breads & pastries daily</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-2 text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Welcome back, Baker
            </CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to manage your bakery operations
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Social Login Buttons */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-amber-200 hover:bg-amber-50 transition-colors"
                onClick={() => handleSocialLogin("google")}
                disabled={socialLoading !== null || isLoading}
              >
                {socialLoading === "google" ? (
                  <div className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin mr-2" />
                ) : (
                  <GoogleIcon className="w-5 h-5 mr-2" />
                )}
                Continue with Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-amber-200 hover:bg-amber-50 transition-colors"
                onClick={() => handleSocialLogin("github")}
                disabled={socialLoading !== null || isLoading}
              >
                {socialLoading === "github" ? (
                  <div className="w-4 h-4 border-2 border-amber-300 border-t-gray-900 rounded-full animate-spin mr-2" />
                ) : (
                  <User className="w-5 h-5 mr-2" />
                )}
                Baker Account
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Or sign in with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50"
                >
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Baker Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="baker@artisanbake.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                    required
                    disabled={isLoading || socialLoading !== null}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700"
                  >
                    Password
                  </Label>
                  <button
                    type="button"
                    className="text-sm text-amber-600 hover:text-amber-500 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                    onClick={handleForgotPassword}
                    disabled={isLoading || socialLoading !== null}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your secret recipe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                    required
                    disabled={isLoading || socialLoading !== null}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600 transition-colors disabled:text-amber-300 disabled:cursor-not-allowed"
                    disabled={isLoading || socialLoading !== null}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg text-primary-foreground"
                disabled={isLoading || socialLoading !== null}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Baking your access...
                  </>
                ) : (
                  "Sign In to Kitchen"
                )}
              </Button>
            </form>

            {/* Sign up and application links */}
            <div className="text-center pt-4 border-t border-amber-100 space-y-3">
              <p className="text-sm text-gray-600">
                New to Scryme Bakery?{" "}
                <button
                  type="button"
                  className="font-medium text-amber-600 hover:text-amber-500 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                  onClick={handleSignUp}
                  disabled={isLoading || socialLoading !== null}
                >
                  Start baking with us
                </button>
              </p>
              <p className="text-xs text-gray-500">
                Want to become a baker?{" "}
                <button
                  type="button"
                  className="font-medium text-orange-600 hover:text-orange-500 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                  onClick={handleBakerApplication}
                  disabled={isLoading || socialLoading !== null}
                >
                  Apply now
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{" "}
            <button className="underline hover:text-gray-700">
              Baker Agreement
            </button>{" "}
            and{" "}
            <button className="underline hover:text-gray-700">
              Kitchen Policies
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
