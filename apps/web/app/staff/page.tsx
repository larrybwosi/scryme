import { Metadata } from "next";
import React from "react";
import { getStaffMembers } from "../actions/staff";
import { getOrgInvitations } from "../actions/invitations";
import { StaffTable } from "../../components/staff/staff-table";
import { InvitationsTable } from "../../components/staff/invitations-table";
import { PageHeader } from "../../components/page-header";
import { Button } from "@repo/ui/components/ui/button";
import {
  Plus,
  Users,
  Search,
  Filter,
  Download,
  Mail,
  Clock,
} from "lucide-react";
import { AddMemberSheet } from "../../components/staff/add-member-sheet";
import Link from "next/link";
import { Input } from "@repo/ui/components/ui/input";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { RolesManager } from "../../components/staff/roles-manager";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Staff Management",
  description: "Manage employee profiles, role permissions, access tokens, and attendance.",
};


export default async function StaffPage() {
  const [membersResult, invitationsResult] = await Promise.all([
    getStaffMembers(),
    getOrgInvitations(),
  ]);

  const members = (membersResult.success ? membersResult.data : []) || [];
  const invitations =
    (invitationsResult.success ? invitationsResult.data : []) || [];

  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Staff Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your organization&apos;s members and their access levels.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/staff/shifts">
            <Button variant="outline" className="gap-2">
              <Clock size={16} />
              <span>Shift Schedule</span>
            </Button>
          </Link>
          <Button variant="outline" className="gap-2">
            <Download size={16} />
            <span>Export</span>
          </Button>
          <AddMemberSheet>
            <Button className="gap-2">
              <Plus size={16} />
              <span>Add or Invite Staff</span>
            </Button>
          </AddMemberSheet>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
          <div className="bg-card p-4 rounded-xl border shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">
              Total Members
            </p>
            <div className="flex items-center justify-between mt-1">
              <h3 className="text-2xl font-bold text-foreground">
                {members.length}
              </h3>
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Active
              </Badge>
            </div>
          </div>
          <div className="bg-card p-4 rounded-xl border shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Admins</p>
            <div className="flex items-center justify-between mt-1">
              <h3 className="text-2xl font-bold text-foreground">
                {members.filter(m => m.role === "ADMIN").length}
              </h3>
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                Privileged
              </Badge>
            </div>
          </div>
          <div className="bg-card p-4 rounded-xl border shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">
              Pending Invitations
            </p>
            <div className="flex items-center justify-between mt-1">
              <h3 className="text-2xl font-bold text-foreground">
                {invitations.length}
              </h3>
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Awaiting Join
              </Badge>
            </div>
          </div>
          <div className="bg-card p-4 rounded-xl border shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">
              Suspended
            </p>
            <div className="flex items-center justify-between mt-1">
              <h3 className="text-2xl font-bold text-destructive">
                {members.filter(m => m.membershipStatus === "SUSPENDED").length}
              </h3>
              <Badge
                variant="secondary"
                className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                Action Required
              </Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="members" className="w-full">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <TabsList className="bg-card border p-1 h-auto gap-1">
              <TabsTrigger
                value="members"
                className="gap-2 px-4 py-2 data-[state=active]:bg-muted data-[state=active]:text-foreground">
                <Users size={16} />
                Active Staff ({members.length})
              </TabsTrigger>
              <TabsTrigger
                value="invitations"
                className="gap-2 px-4 py-2 data-[state=active]:bg-muted data-[state=active]:text-foreground">
                <Mail size={16} />
                Pending Invitations ({invitations.length})
              </TabsTrigger>
              <TabsTrigger
                value="roles"
                className="gap-2 px-4 py-2 data-[state=active]:bg-muted data-[state=active]:text-foreground">
                <Shield size={16} />
                Roles & Scopes
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={16}
                />
                <Input placeholder="Search..." className="pl-10 h-9 bg-card" />
              </div>
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <Filter size={14} />
                <span>Filters</span>
              </Button>
            </div>
          </div>

          <TabsContent value="members" className="outline-none">
            <StaffTable data={members as any} />
          </TabsContent>

          <TabsContent value="invitations" className="outline-none">
            <InvitationsTable data={invitations as any} />
          </TabsContent>

          <TabsContent value="roles" className="outline-none pt-4">
            <RolesManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
