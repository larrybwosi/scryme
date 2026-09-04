import { Metadata } from "next";
import React from "react";
import { redirect } from "next/navigation";
import { getServerAuth } from "@repo/auth/server";
import { db } from "@repo/db";
import { ShiftsManager } from "../../../components/staff/shifts-manager";
import { getStaffShifts } from "../../actions/shifts";
import { getStaffMembers } from "../../actions/staff";
import { Button } from "@repo/ui/components/ui/button";
import { Calendar, ChevronLeft, Clock } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shift Roster & Schedules",
  description: "Schedule staff shifts, breaks, working hours, and view check-in activity.",
};


export default async function ShiftsPage() {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    redirect("/login");
  }

  // Get organization settings
  const settings = await db.organizationSettings.findUnique({
    where: { organizationId: session.organizationId },
    select: { managersCanManageShifts: true },
  });

  // Check management permissions
  const role = session.role as string;
  const canManage =
    role === "OWNER" ||
    role === "ADMIN" ||
    (role === "MANAGER" && !!settings?.managersCanManageShifts);

  // Fetch shifts and members
  const [shiftsResult, membersResult] = await Promise.all([
    getStaffShifts(),
    getStaffMembers(),
  ]);

  const shifts = (shiftsResult.success ? shiftsResult.data : []) || [];
  const members = (membersResult.success ? membersResult.data : []) || [];

  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/staff"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <ChevronLeft size={14} />
            <span>Back to Staff</span>
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Clock size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Shifts & Scheduling
              </h1>
              <p className="text-sm text-muted-foreground font-normal">
                Define and schedule weekly recurring shifts and break times for
                your team.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shifts Manager Client Component */}
      <ShiftsManager
        initialShifts={shifts as any}
        allMembers={members as any}
        canManage={canManage}
      />
    </div>
  );
}
