"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/ui/button";
import { Card } from "@repo/ui/components/ui/card";
import { acceptInvitationByToken } from "@/app/actions/invitations";
import { toast } from "sonner";
import {
  Building2,
  Mail,
  Loader2,
  ArrowRight,
  UserPlus,
  LogIn,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface InvitationCardProps {
  token: string;
  invitation: {
    email: string;
    role: string;
    organization: {
      name: string;
      logo: string | null;
    };
    inviter: {
      name: string | null;
      email: string;
    };
  };
  isAuthenticated: boolean;
  currentUserEmail?: string;
}

export function InvitationCard({
  token,
  invitation,
  isAuthenticated,
  currentUserEmail,
}: InvitationCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const result = await acceptInvitationByToken(token);
      if (result.success) {
        toast.success("Successfully joined the organization!");
        router.push("/dashboard");
      } else {
        toast.error(result.error || "Failed to accept invitation");
      }
    } catch (err) {
      toast.error("An error occurred while accepting the invitation");
    } finally {
      setLoading(false);
    }
  };

  const callbackUrl = `/invite/${token}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-6">
      <Card className="w-full max-w-[450px] p-8 border border-gray-200/80 shadow-lg bg-white rounded-2xl flex flex-col items-center text-center">
        {/* Scryme Wordmark */}
        <div className="flex items-center gap-1.5 mb-8">
          <div className="w-6 h-6 rounded-md bg-[#0F1B2E] flex items-center justify-center">
            <span className="text-white font-black text-[10px] tracking-tight">S</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900">
            scry<span className="text-emerald-600">me</span>
          </span>
        </div>

        {/* Org Logo / Avatar */}
        <div className="relative w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200/60 flex items-center justify-center text-2xl font-bold text-gray-700 shadow-sm mb-6 overflow-hidden">
          {invitation.organization.logo ? (
            <Image
              src={invitation.organization.logo}
              alt={invitation.organization.name}
              fill
              className="object-contain p-2"
            />
          ) : (
            invitation.organization.name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Content */}
        <h1 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
          Join {invitation.organization.name}
        </h1>
        <p className="text-sm text-gray-500 max-w-sm mb-6">
          You&apos;ve been invited to join this organization as a{" "}
          <span className="font-semibold text-gray-800 capitalize">
            {invitation.role.toLowerCase()}
          </span>.
        </p>

        {/* Inviter details info box */}
        <div className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mb-8 text-left space-y-3">
          <div className="flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Invited By
              </p>
              <p className="text-sm font-medium text-gray-800">
                {invitation.inviter.name || invitation.inviter.email}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Target Email Address
              </p>
              <p className="text-sm font-medium text-gray-800">
                {invitation.email}
              </p>
            </div>
          </div>
        </div>

        {/* Flow execution buttons */}
        {isAuthenticated ? (
          <div className="w-full space-y-4">
            {currentUserEmail === invitation.email ? (
              <div className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg py-2.5 px-3 flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>
                  Authenticated as <span className="font-semibold">{currentUserEmail}</span>
                </span>
              </div>
            ) : (
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg py-2.5 px-3 flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Email Address Mismatch</span>
                </div>
                <p className="text-[11px] text-amber-700 font-medium">
                  This invite is for <span className="underline font-bold">{invitation.email}</span>, but you are logged in as <span className="underline font-bold">{currentUserEmail}</span>. Please switch accounts.
                </p>
              </div>
            )}
            <Button
              className="w-full h-11 bg-[#1D1D1F] hover:bg-[#1D1D1F]/90 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              disabled={loading || currentUserEmail !== invitation.email}
              onClick={handleAccept}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Joining Workspace...</span>
                </>
              ) : (
                <>
                  <span>Accept Invitation & Join</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3">
            <p className="text-xs text-gray-400 mb-2">
              To accept this invitation, please authenticate first.
            </p>
            <Button
              asChild
              className="w-full h-11 bg-[#1D1D1F] hover:bg-[#1D1D1F]/90 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
                <LogIn className="w-4 h-4" />
                <span>Log In with Existing Account</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full h-11 border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Link href={`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>Create a New Account</span>
              </Link>
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
