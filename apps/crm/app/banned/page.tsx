"use client";

import React from "react";
import {
  ShieldAlert,
  ArrowLeft,
  LogOut,
  UserX,
  MessageSquare,
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
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/ui/components/ui/alert";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const BannedPage = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full shadow-lg border-muted">
        {/* Header Section */}
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-4">
            <UserX className="w-10 h-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Account Access Restricted
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Your access to this platform has been suspended.
          </CardDescription>
        </CardHeader>

        {/* Body Content */}
        <CardContent className="space-y-4">
          <Alert
            variant="destructive"
            className="bg-destructive/5 border-destructive/20 text-destructive"
          >
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Suspension Active</AlertTitle>
            <AlertDescription className="text-xs mt-1">
              This account has been flagged for security reasons or policy
              violations.
            </AlertDescription>
          </Alert>

          <div className="bg-muted/50 rounded-md p-4 text-sm border">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" /> What does this mean?
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              You can no longer access your dashboard, manage resources, or
              perform any actions within the organization.
            </p>
          </div>

          <Alert
            variant="default"
            className="bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900"
          >
            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300">
              How to restore access?
            </AlertTitle>
            <AlertDescription className="text-blue-700/80 dark:text-blue-400/80 text-xs mt-1">
              Please contact your system administrator or your organization&apos;s
              owner to request a review of your account status.
            </AlertDescription>
          </Alert>
        </CardContent>

        <Separator />

        {/* Footer Actions */}
        <CardFooter className="flex-col gap-2 pt-6">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>

          <Button
            variant="ghost"
            className="w-full gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BannedPage;
