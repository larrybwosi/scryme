"use client";

import React from "react";
import {
  CreditCard,
  LogOut,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  UserCheck,
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

interface PaymentExpiredClientProps {
  userRole?: string;
  isOwnerOrAdmin: boolean;
  userEmail?: string;
}

export default function PaymentExpiredClient({
  userRole,
  isOwnerOrAdmin,
  userEmail,
}: PaymentExpiredClientProps) {
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
      <Card className="max-w-lg w-full shadow-lg border-muted">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-amber-500/10 p-3 rounded-full w-fit mb-4">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Subscription / Free Trial Expired
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Your organization&apos;s free trial or active subscription period has ended.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert
            variant="default"
            className="bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200">
            <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="font-semibold">Read-Only Mode Enabled</AlertTitle>
            <AlertDescription className="text-xs mt-1">
              Changes, new sales, and updates are currently disabled across the workspace until the subscription is renewed or updated.
            </AlertDescription>
          </Alert>

          {isOwnerOrAdmin ? (
            <div className="bg-muted/50 rounded-lg p-4 text-sm border space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-foreground">
                <CreditCard className="w-4 h-4 text-primary" /> Administrator Action Required
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                As an Organization Administrator or Owner, you can update payment credentials or choose a subscription plan to immediately reactivate full feature access.
              </p>
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-4 text-sm border space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-foreground">
                <UserCheck className="w-4 h-4 text-amber-500" /> Contact Your Administrator
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                Your role is <strong>{userRole || "Member"}</strong>. Please reach out to your organization&apos;s owner or administrator to upgrade the subscription and restore full access.
              </p>
            </div>
          )}
        </CardContent>

        <Separator />

        <CardFooter className="flex-col gap-2 pt-6">
          {isOwnerOrAdmin && (
            <Button
              className="w-full gap-2 text-white font-medium"
              onClick={() => router.push("/settings?tab=pricing")}>
              <CreditCard className="w-4 h-4" />
              Update Subscription & Billing
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
          )}

          <Button
            variant="ghost"
            className="w-full gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
            onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Sign Out ({userEmail || "User"})
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
