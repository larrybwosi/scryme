import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Toaster } from "sonner";
import { SignInPage } from "@/pages/SignIn";
import { SignUpPage } from "@/pages/SignUp";
import { ForgotPasswordPage } from "@/pages/ForgotPassword";
import { ResetPasswordPage } from "@/pages/ResetPassword";
import { VerifyEmailPage } from "@/pages/VerifyEmail";
import { ConsentPage } from "@/pages/Consent";
import { ErrorPage } from "@/pages/Error";

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen w-full flex flex-col justify-between items-center p-4 bg-gradient-to-b from-background via-background to-muted/30">
        <header className="w-full max-w-6xl py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
              S
            </div>
            <span className="font-bold text-xl tracking-tight">Scryme</span>
          </div>
        </header>

        <main className="w-full flex items-center justify-center my-auto py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/sign-in" replace />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/consent" element={<ConsentPage />} />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="*" element={<Navigate to="/sign-in" replace />} />
          </Routes>
        </main>

        <footer className="w-full max-w-6xl py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Scryme Inc. All rights reserved. Unified OAuth2 & Authentication Provider.
        </footer>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
