"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { Suspense } from "react";

export default function AuthorizePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    }>
      <AuthorizeContent />
    </Suspense>
  );
}

function AuthorizeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientId = searchParams.get("client_id");
  const scope = searchParams.get("scope") || "";

  const [clientInfo, setClientInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function fetchClient() {
      if (!clientId) {
        setError("Missing client_id");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await authClient.oauth2.publicClient({
          query: { client_id: clientId },
        });

        if (error) {
          setError(error.message || "Failed to fetch client information");
        } else {
          setClientInfo(data);
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchClient();
  }, [clientId]);

  const handleConsent = async (accept: boolean) => {
    setProcessing(true);
    try {
      const { error } = await authClient.oauth2.consent({
        accept,
        scope,
      });

      if (error) {
        setError(error.message || "Failed to process consent");
        setProcessing(false);
      }
      // Better-auth client handles redirect automatically if successful
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Error</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => router.back()} className="w-full">
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const scopes = scope.split(" ").filter(Boolean);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50 dark:bg-slate-900">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            {clientInfo?.icon ? (
              <Image src={clientInfo.icon} alt={clientInfo.name || "App Icon"} width={48} height={48} className="rounded" />
            ) : (
              <CheckCircle2 className="h-10 w-10 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold italic text-primary">Login with Dealio</CardTitle>
          <CardDescription className="text-base mt-2">
            <strong>{clientInfo?.name}</strong> is requesting access to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">This application will be able to:</h3>
            <ul className="space-y-3">
              {scopes.map((s) => (
                <li key={s} className="flex items-start gap-3 text-sm">
                  <div className="mt-1 bg-primary/20 rounded-full p-0.5">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                  </div>
                  <span>
                    {s === "openid" && "Identify you on Dealio"}
                    {s === "profile" && "Access your name, profile picture, and username"}
                    {s === "email" && "Access your email address"}
                    {s === "org_info" && "View details about your organizations"}
                    {s === "membership" && "View your roles and permissions within organizations"}
                    {!["openid", "profile", "email", "org_info", "membership"].includes(s) && `Access ${s}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {clientInfo?.uri && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              You can visit the application at <a href={clientInfo.uri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{new URL(clientInfo.uri).hostname}</a>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleConsent(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => handleConsent(true)}
              disabled={processing}
            >
              {processing ? "Authorizing..." : "Allow Access"}
            </Button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground px-4">
            By clicking Allow Access, you authorize this application to use your data in accordance with their privacy policy and terms of service. You can revoke this access at any time in your Dealio settings.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
