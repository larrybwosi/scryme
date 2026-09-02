"use client";

import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/ui/avatar";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { ArrowLeft, Mail, Calendar, Shield, MapPin } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export function StaffDetailHeader({ member }: { member: any }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="-ml-2 text-muted-foreground hover:text-foreground hover:bg-accent">
          <Link href="/staff">
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          Staff Member Profile
        </h1>
      </div>

      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-background shadow-md">
            <AvatarImage src={member.user.image || ""} />
            <AvatarFallback className="bg-muted text-muted-foreground text-2xl font-bold">
              {member.user.name?.charAt(0) ||
                member.user.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground">
                {member.user.name || "Unnamed User"}
              </h2>
              <Badge
                className={
                  member.membershipStatus === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20"
                    : member.membershipStatus === "SUSPENDED"
                      ? "bg-destructive/10 text-destructive hover:bg-destructive/10 border-destructive/20"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 border-amber-500/20"
                }>
                {member.membershipStatus}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Mail size={14} />
                {member.user.email}
              </div>
              <div className="flex items-center gap-1">
                <Shield size={14} />
                {member.role}
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                Joined {format(new Date(member.createdAt), "MMM d, yyyy")}
              </div>
              {member.address && (
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  {member.address}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {member.customRoles.map((role: any) => (
                <Badge
                  key={role.id}
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                  {role.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* We can add quick actions here if needed */}
        </div>
      </div>
    </div>
  );
}
