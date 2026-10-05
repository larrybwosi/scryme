import { Metadata } from "next";
import React from "react";
import { getStaffMembers } from "../actions/staff";
import { getOrgInvitations } from "../actions/invitations";
import { StaffClientView } from "../../components/staff/staff-client-view";
import { Button } from "@repo/ui/components/ui/button";
import {
  Plus,
  Users,
  Download,
  Clock,
} from "lucide-react";
import { AddMemberSheet } from "../../components/staff/add-member-sheet";
import Link from "next/link";

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

      <StaffClientView members={members} invitations={invitations} />
    </div>
  );
}
