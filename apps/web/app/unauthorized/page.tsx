import {
  LogIn,
  History,
  LockKeyhole,
  HelpCircle,
  ShieldCheck,
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

const UnauthorizedPage = () => {
  // This 401 Unauthorized page is distinct from the 403 page. While 403 means "permission denied," 401 means "identity unverified" (usually a Session Timeout).

  // Mock data - In reality, pull this from your persisted local state or cookie
  // to show the user who *was* logged in before the timeout.
  const lastKnownUser = {
    name: "Sarah Jenkins",
    email: "s.jenkins@enterprise-erp.com",
    initials: "SJ",
    avatarUrl: "", // Add URL if available
  };

  const handleLogin = () => {
    // Redirect to login provider (e.g., Auth0, Azure AD, or custom route)
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-[400px] w-full shadow-xl border-muted ring-1 ring-slate-900/5">
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
              <div className="grid gap-0.5 overflow-hidden">
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
            <AlertTitle className="text-slate-800 dark:text-slate-300 text-xs font-semibold">
              Data Protected
            </AlertTitle>
            <AlertDescription className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
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
            onClick={handleLogin}
          >
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

export default UnauthorizedPage;
