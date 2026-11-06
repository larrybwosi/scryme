"use client";

import { useState } from "react";
import { UserSearch, ArrowLeftRight, Loader2 } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { authClient, useSession } from "@/lib/auth-client";
import { stopImpersonatingAction } from "@/app/actions/users";
import { toast } from "sonner";

export function ImpersonationBanner() {
  const { data: sessionData, isPending } = useSession();
  const [isStopping, setIsStopping] = useState(false);

  const session = sessionData?.session as any;
  const user = sessionData?.user;

  if (isPending || !session?.impersonatedBy) {
    return null;
  }

  const handleStop = async () => {
    try {
      setIsStopping(true);
      const res = await stopImpersonatingAction();
      const authRes = await authClient.admin.stopImpersonating();
      if (authRes.error) {
        throw new Error(authRes.error.message || "Failed to stop impersonation");
      }
      toast.success("Impersonation stopped. Restored admin session.");
      window.location.href = res.redirectUrl;
    } catch (error: any) {
      toast.error(error.message || "Failed to stop impersonation");
      setIsStopping(false);
    }
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 px-4 py-2 text-white shadow-md">
      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
        <UserSearch className="size-4 shrink-0 animate-pulse text-purple-200" aria-hidden="true" />
        <span>
          Impersonation active: viewing as{" "}
          <strong className="underline underline-offset-2">
            {user?.name || user?.email || "User"}
          </strong>{" "}
          ({user?.email})
        </span>
      </div>

      <Button
        size="sm"
        variant="secondary"
        disabled={isStopping}
        onClick={handleStop}
        className="h-7 gap-1.5 bg-white text-xs font-semibold text-purple-900 hover:bg-purple-50"
      >
        {isStopping ? (
          <Loader2 className="size-3 animate-spin" aria-hidden="true" />
        ) : (
          <ArrowLeftRight className="size-3" aria-hidden="true" />
        )}
        Stop Impersonating
      </Button>
    </div>
  );
}
