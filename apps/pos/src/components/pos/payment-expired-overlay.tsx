"use client";

import { useAuthStore } from "@/store/pos-auth-store";
import {
  AlertTriangle,
  RefreshCw,
  LogOut,
  UserCheck,
  Building2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/ui/alert";

export function PaymentExpiredOverlay() {
  const {
    isSubscriptionExpired,
    subscriptionExpireReason,
    currentMember,
    setSubscriptionExpired,
    clearMemberSession,
  } = useAuthStore();

  if (!isSubscriptionExpired) return null;

  const role = (currentMember as any)?.role || (currentMember as any)?.orgRole || "EMPLOYEE";
  const isOwnerOrAdmin = role === "OWNER" || role === "ADMIN" || role === "SUPER_ADMIN";

  const handleRetry = () => {
    setSubscriptionExpired(false);
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-md p-4">
      <Card className="max-w-lg w-full shadow-2xl border-amber-500/30">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-amber-500/10 p-4 rounded-full w-fit mb-4 border border-amber-500/20">
            <AlertTriangle className="w-12 h-12 text-amber-500 animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Free Trial / Subscription Expired
          </CardTitle>
          <CardDescription className="text-base mt-2">
            This organization&apos;s free trial or active subscription period has ended.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert
            variant="default"
            className="bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
          >
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="font-semibold text-sm">Sales Processing Blocked</AlertTitle>
            <AlertDescription className="text-xs mt-1 leading-relaxed">
              {subscriptionExpireReason ||
                "Checkout and transaction recording are disabled until the subscription is updated."}
            </AlertDescription>
          </Alert>

          {isOwnerOrAdmin ? (
            <div className="bg-muted/50 rounded-xl p-4 text-sm border space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-foreground">
                <Building2 className="w-4 h-4 text-primary" /> Administrator Action Required
              </h4>
              <p className="text-muted-foreground leading-relaxed text-xs">
                As an Administrator, please log into the Web Dashboard settings and update your payment method or select a subscription plan to immediately re-enable POS transactions.
              </p>
            </div>
          ) : (
            <div className="bg-muted/50 rounded-xl p-4 text-sm border space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-foreground">
                <UserCheck className="w-4 h-4 text-amber-500" /> Contact Your Administrator
              </h4>
              <p className="text-muted-foreground leading-relaxed text-xs">
                Your role is <strong>{role}</strong>. Please inform your organization owner or manager to upgrade the subscription plan to resume terminal operations.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-4 border-t">
          <Button onClick={handleRetry} className="w-full gap-2 font-medium">
            <RefreshCw className="w-4 h-4" />
            Check Subscription Status
          </Button>

          <Button
            variant="ghost"
            onClick={clearMemberSession}
            className="w-full gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
          >
            <LogOut className="w-4 h-4" />
            Switch / Sign Out Member ({currentMember?.name || "Staff"})
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
