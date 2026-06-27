"use client";

import React from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/lib/providers/auth-context";
import SessionSkeleton from "./session-loader";

interface BakeryAuthGuardProps {
  children: React.ReactNode;
}

export function BakeryAuthGuard({ children }: BakeryAuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <SessionSkeleton />;
  }

  if (!isAuthenticated) {
    // Redirect to login but save the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
