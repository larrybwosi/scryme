import { Metadata } from "next";
import React from "react";
import { redirect } from "next/navigation";
import { getServerAuth } from "@repo/auth/server";
import { db } from "@repo/db";
import { ShiftsManager } from "../../../components/staff/shifts-manager";
import { getSchedulingWorkspace, getStaffShifts } from "../../actions/shifts";
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

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - now.getUTCDay());
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const [shiftsResult, membersResult, workspaceResult] = await Promise.all([
    getStaffShifts(),
    getStaffMembers(),
    getSchedulingWorkspace(weekStart.toISOString(), weekEnd.toISOString()),
  ]);

  const shifts = (shiftsResult.success ? shiftsResult.data : []) || [];
  const members = (membersResult.success ? membersResult.data : []) || [];
  const workspace = workspaceResult.success ? workspaceResult.data : undefined;

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-background p-4 md:p-8">
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
                Scheduling Command Center
              </h1>
              <p className="text-sm text-muted-foreground font-normal">
                Coordinate bookings, coverage, availability, and staff rosters
                from one operational workspace.
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
        initialWorkspace={workspace as any}
        initialWeekStart={weekStart.toISOString()}
      />
    </main>
  );
}
