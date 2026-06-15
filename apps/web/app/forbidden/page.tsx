"use client";
import { useState } from "react";
import {
  ShieldAlert,
  ArrowLeft,
  LogOut,
  Copy,
  CheckCircle2,
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
import { Separator } from "@repo/ui/components/ui/separator";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/ui/components/ui/alert";
import { Button } from "@repo/ui/components/ui/button";

const ForbiddenPage = () => {
  const [copied, setCopied] = useState(false);

  // Mock data - in a real app, retrieve these from your auth context
  const requestID =
    "REQ-" + Math.random().toString(36).substr(2, 9).toUpperCase();
  const currentRole = "Viewer";
  const requiredRole = "Administrator";

  const handleCopyTrace = () => {
    navigator.clipboard.writeText(requestID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full shadow-lg border-muted">
        {/* Header Section */}
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-4">
            <ShieldAlert className="w-10 h-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Access Restricted
          </CardTitle>
          <CardDescription className="text-base mt-2">
            You do not have the required permissions to access this resource.
          </CardDescription>
        </CardHeader>

        {/* Body Content */}
        <CardContent className="space-y-4">
          {/* Contextual Info Box */}
          <div className="bg-muted/50 rounded-md p-4 text-sm border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Error Code:</span>
              <span className="font-mono font-medium">403_FORBIDDEN</span>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Role:</span>
              <span className="font-medium">{currentRole}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-muted-foreground">Required Role:</span>
              <span className="font-medium text-destructive">
                {requiredRole}
              </span>
            </div>
          </div>

          {/* Technical Support Alert */}
          <Alert
            variant="default"
            className="bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900">
            <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300">
              Need access?
            </AlertTitle>
            <AlertDescription className="text-blue-700/80 dark:text-blue-400/80 text-xs mt-1">
              Please contact your system administrator or IT support with the ID
              below.
            </AlertDescription>
          </Alert>

          {/* Trace ID Copy Section */}
          <div className="flex items-center space-x-2">
            <code className="relative rounded bg-muted px-[0.5rem] py-[0.3rem] font-mono text-xs font-medium w-full text-center border">
              Trace ID: {requestID}
            </code>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleCopyTrace}
              title="Copy Trace ID">
              {copied ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </CardContent>

        <Separator />

        {/* Footer Actions */}
        <CardFooter className="flex-col gap-2 pt-6">
          <Button
            className="w-full gap-2"
            size="default"
            onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" />
            Return to Previous Page
          </Button>

          <Button
            variant="ghost"
            className="w-full gap-2 text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4" />
            Switch Account
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForbiddenPage;
