import React from "react";
import { getInvitationByToken } from "@/app/actions/invitations";
import { getServerAuth } from "@repo/auth/server";
import { InvitationCard } from "./invitation-card";
import { Card } from "@repo/ui/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@repo/ui/components/ui/button";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;
  const result = await getInvitationByToken(token);
  const session = await getServerAuth();

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-6">
        <Card className="w-full max-w-[450px] p-8 border border-gray-200/80 shadow-lg bg-white rounded-2xl flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-6">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
            Invalid or Expired Invitation
          </h1>
          <p className="text-sm text-gray-500 max-w-sm mb-6">
            {result.error || "This invitation link is invalid, has expired, or was already accepted."}
          </p>
          <Button asChild className="w-full h-11 bg-[#1D1D1F] hover:bg-[#1D1D1F]/90 text-white font-semibold rounded-xl">
            <Link href="/">
              Go to Homepage
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const invitation = result.data;

  return (
    <InvitationCard
      token={token}
      invitation={invitation}
      isAuthenticated={!!session}
      currentUserEmail={session?.user?.email}
    />
  );
}
