"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  LogIn,
  History,
  LockKeyhole,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Send,
  Loader2,
  Lock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Separator } from "@repo/ui/components/ui/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/ui/avatar";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/ui/components/ui/alert";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { toast } from "sonner";
import {
  getCurrentUserContext,
  requestPermissionsAction,
} from "../actions/permissions";

const UnauthorizedContent = () => {
  const searchParams = useSearchParams();
  const reasonParam = searchParams.get("reason");

  const [isLoading, setIsLoading] = useState(true);
  const [userContext, setUserContext] = useState<any>(null);

  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    getCurrentUserContext()
      .then(context => {
        setUserContext(context);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load user context:", err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (reasonParam === "insufficient_permissions") {
      toast.error("Access Restricted: Insufficient permissions.", {
        duration: 5000,
      });
    }
  }, [reasonParam]);

  const handleLogin = () => {
    window.location.href = "/login";
  };

  const handleRequestPermission = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a brief reason or explanation.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestPermissionsAction({
        reason,
        requestedPage: window.location.pathname,
      });

      if (res.success) {
        setRequestSent(true);
        toast.success("Permission request successfully sent to admins!");
      } else {
        toast.error(res.error || "Failed to submit request.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // State 1: Authenticated, but Access Restricted (Insufficient Permissions)
  const isAccessRestricted = !!userContext;

  if (isAccessRestricted) {
    const initials = userContext.user.name
      ? userContext.user.name
          .split(" ")
          .map((n: any) => n[0])
          .join("")
          .toUpperCase()
      : userContext.user.email[0].toUpperCase();

    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-105 w-full shadow-xl border-muted ring-1 ring-slate-900/5">
          {/* Header Section */}
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-4 border border-destructive/20">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">
              Access Restricted
            </CardTitle>
            <CardDescription className="text-sm mt-2">
              You do not have the required permissions to view this resource.
            </CardDescription>
          </CardHeader>

          {/* Body Content */}
          <CardContent className="space-y-4">
            {/* User Profile Info */}
            <div className="flex items-center gap-4 p-3 rounded-lg border bg-card/50 shadow-sm">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={userContext.user.image || ""} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-0.5 overflow-hidden text-left">
                <p className="text-sm font-medium leading-none truncate">
                  {userContext.user.name || "Logged In User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {userContext.user.email}
                </p>
              </div>
              <div className="ml-auto text-xs font-semibold px-2 py-1 bg-muted rounded border">
                {userContext.role}
              </div>
            </div>

            {/* Request Permission Form */}
            {!requestSent ? (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left">
                  Request Permission from Admins
                </div>
                <Textarea
                  placeholder="Explain why you need access (e.g. 'I need to check yesterday's transaction logs for reconciliation')"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="min-h-20"
                />
                <Button
                  className="w-full gap-2 font-medium"
                  size="default"
                  onClick={handleRequestPermission}
                  disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Ask Admins for Permissions
                </Button>
              </div>
            ) : (
              <Alert className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900">
                <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <AlertTitle className="text-emerald-800 dark:text-emerald-300 text-left">
                  Request Dispatched!
                </AlertTitle>
                <AlertDescription className="text-emerald-700/80 dark:text-emerald-400/80 text-xs mt-1 text-left">
                  Your request has been successfully broadcast to administrators
                  (Owners & Admins) via Scryme Chat.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          <Separator />

          {/* Footer Actions */}
          <CardFooter className="flex-col gap-3 pt-6">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = "/dashboard";
                }
              }}>
              <ArrowLeft className="w-4 h-4" />
              Return to Safety
            </Button>

            <div className="flex items-center justify-between w-full text-xs text-muted-foreground mt-2 px-1">
              <button
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                onClick={() => {
                  window.location.href = "/dashboard";
                }}>
                <History className="w-3 h-3" />
                Dashboard Home
              </button>
              <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                <HelpCircle className="w-3 h-3" />
                Help Center
              </button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // State 2: Unauthenticated (Session Expired / Timeout)
  const lastKnownUser = {
    name: "Sarah Jenkins",
    email: "s.jenkins@enterprise-erp.com",
    initials: "SJ",
    avatarUrl: "",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-100 w-full shadow-xl border-muted ring-1 ring-slate-900/5">
        {/* Header Section */}
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-amber-100 dark:bg-amber-900/20 p-3 rounded-full w-fit mb-4 border border-amber-200 dark:border-amber-900">
            <LockKeyhole className="w-8 h-8 text-amber-600 dark:text-amber-500" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">
            Session Expired
          </CardTitle>
          <CardDescription className="text-sm mt-2">
            For your security, your session has timed out due to inactivity.
          </CardDescription>
        </CardHeader>

        {/* Body Content */}
        <CardContent className="space-y-5 pt-4">
          {/* Last Known User Profile - High-End Touch */}
          {lastKnownUser && (
            <div className="flex items-center gap-4 p-3 rounded-lg border bg-card/50 shadow-sm">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={lastKnownUser.avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {lastKnownUser.initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-0.5 overflow-hidden text-left">
                <p className="text-sm font-medium leading-none truncate">
                  {lastKnownUser.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {lastKnownUser.email}
                </p>
              </div>
            </div>
          )}

          {/* Security Assurance */}
          <Alert className="bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">
            <ShieldCheck className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <AlertTitle className="text-slate-800 dark:text-slate-300 text-xs font-semibold text-left">
              Data Protected
            </AlertTitle>
            <AlertDescription className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 text-left">
              Any unsaved changes may have been drafted locally. Please log in
              to resume.
            </AlertDescription>
          </Alert>
        </CardContent>

        <Separator />

        {/* Footer Actions */}
        <CardFooter className="flex-col gap-3 pt-6">
          <Button
            className="w-full gap-2 font-medium"
            size="lg"
            onClick={handleLogin}>
            <LogIn className="w-4 h-4" />
            Log In to Continue
          </Button>

          <div className="flex items-center justify-between w-full text-xs text-muted-foreground mt-2 px-1">
            <button className="flex items-center gap-1 hover:text-foreground transition-colors">
              <History className="w-3 h-3" />
              Recent Activity
            </button>
            <button className="flex items-center gap-1 hover:text-foreground transition-colors">
              <HelpCircle className="w-3 h-3" />
              Help Center
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
      <UnauthorizedContent />
    </Suspense>
  );
}
