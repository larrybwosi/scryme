"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/ui/avatar";
import { Badge } from "@repo/ui/components/ui/badge";
import { MemberActions } from "./member-actions";
import { format } from "date-fns";
import Link from "next/link";

interface StaffMember {
  id: string;
  role: string;
  membershipStatus: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  customRoles: { id: string; name: string }[];
  banReason?: string | null;
}

export function StaffTable({ data }: { data: StaffMember[] }) {
  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[300px]">Staff Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Custom Roles</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center py-10 text-muted-foreground">
                No staff members found.
              </TableCell>
            </TableRow>
          ) : (
            data.map(member => (
              <TableRow
                key={member.id}
                className="group hover:bg-muted/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                      <AvatarImage src={member.user.image || ""} />
                      <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                        {member.user.name?.charAt(0) ||
                          member.user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Link
                      href={`/staff/${member.id}`}
                      className="flex flex-col hover:opacity-70 transition-opacity">
                      <span className="font-semibold text-sm text-foreground">
                        {member.user.name || "Unnamed User"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {member.user.email}
                      </span>
                    </Link>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="font-medium bg-muted capitalize">
                    {member.role.toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {member.customRoles.length > 0 ? (
                      member.customRoles.map(role => (
                        <Badge
                          key={role.id}
                          variant="secondary"
                          className="text-[10px] h-5">
                          {role.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge
                      className={
                        member.membershipStatus === "ACTIVE"
                          ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                          : member.membershipStatus === "SUSPENDED"
                            ? "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }>
                      {member.membershipStatus}
                    </Badge>
                    {member.banReason && (
                      <span
                        className="text-[10px] text-destructive font-medium max-w-[150px] truncate"
                        title={member.banReason}>
                        Reason: {member.banReason}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(member.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <MemberActions member={member} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
