"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { ArrowLeft, Mail, Calendar, Shield, MapPin } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export function StaffDetailHeader({ member }: { member: any }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="-ml-2">
          <Link href="/staff">
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-[#1D1D1F]">Staff Member Profile</h1>
      </div>

      <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-white shadow-md">
            <AvatarImage src={member.user.image || ""} />
            <AvatarFallback className="bg-gray-100 text-gray-400 text-2xl font-bold">
              {member.user.name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-[#1D1D1F]">
                {member.user.name || "Unnamed User"}
              </h2>
              <Badge
                className={
                  member.membershipStatus === "ACTIVE"
                    ? "bg-green-100 text-green-700 hover:bg-green-100"
                    : member.membershipStatus === "SUSPENDED"
                    ? "bg-red-100 text-red-700 hover:bg-red-100"
                    : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                }
              >
                {member.membershipStatus}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
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
                <Badge key={role.id} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
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
