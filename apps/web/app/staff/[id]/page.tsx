import { Metadata } from "next";
import React, { Suspense } from "react";
import { getStaffMemberDetail, getStaffMembers } from "../../actions/staff";
import { getMemberDepartments } from "../../actions/department";
import { getOrganizationSettings } from "../../actions/organization";
import { getStaffShifts } from "../../actions/shifts";
import { getServerAuth } from "@repo/auth/server";
import { db } from "@repo/db";
import { notFound } from "next/navigation";
import { StaffDetailHeader } from "@/components/staff/detail/staff-detail-header";
import { StaffOverview } from "@/components/staff/detail/staff-overview";
import { StaffActivity } from "@/components/staff/detail/staff-activity";
import { StaffSettings } from "@/components/staff/detail/staff-settings";
import { StaffPerformance } from "@/components/staff/detail/staff-performance";
import { StaffDepartments } from "@/components/staff/detail/staff-departments";
import { StaffMemberShiftsTab } from "@/components/staff/detail/staff-shifts";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import {
  BarChart3,
  Activity,
  Settings,
  LayoutDashboard,
  Building2,
  Clock,
} from "lucide-react";

export default async function StaffMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerAuth();
  // ⚡ Bolt Optimization: Fetch organization settings concurrently in the main Promise.all block
  // to avoid blocking the page rendering on sequential network roundtrips.
  const [result, membersResult, departmentsResult, organization, shiftsResult, settings] =
    await Promise.all([
      getStaffMemberDetail(id),
      getStaffMembers(),
      getMemberDepartments(id),
      getOrganizationSettings(),
      getStaffShifts(id),
      session?.organizationId
        ? db.organizationSettings.findUnique({
            where: { organizationId: session.organizationId },
            select: { managersCanManageShifts: true },
          })
        : Promise.resolve(null),
    ]);
  const currency = organization?.settings?.defaultCurrency || "USD";
  const memberShifts = (shiftsResult.success ? shiftsResult.data : []) || [];

  const role = session?.role as string;
  const canManage =
    role === "OWNER" ||
    role === "ADMIN" ||
    (role === "MANAGER" && !!settings?.managersCanManageShifts);

  if (!result.success || !result.data) {
    if (result.error === "Member not found") {
      notFound();
    }
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">Error</h2>
        <p className="text-gray-500">{result.error}</p>
      </div>
    );
  }

  const member = result.data;
  const stats = result.stats;

  return (
    <Suspense>
      <div className="flex flex-col gap-8 p-8 bg-background min-h-screen overflow-y-scroll">
        <StaffDetailHeader member={member} />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card border p-1 h-auto gap-1 overflow-x-auto">
            <TabsTrigger
              value="overview"
              className="gap-2 px-4 py-2 data-[state=active]:bg-muted data-[state=active]:text-[#1D1D1F]">
              <LayoutDashboard size={16} />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="gap-2 px-4 py-2 data-[state=active]:bg-muted data-[state=active]:text-[#1D1D1F]">
              <BarChart3 size={16} />
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="gap-2 px-4 py-2 data-[state=active]:bg-muted data-[state=active]:text-[#1D1D1F]">
              <Activity size={16} />
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="gap-2 px-4 py-2 data-[state=active]:bg-muted data-[state=active]:text-[#1D1D1F]">
              <Settings size={16} />
              Settings
            </TabsTrigger>
            <TabsTrigger
              value="shifts"
              className="gap-2 px-4 py-2 data-[state=active]:bg-muted data-[state=active]:text-[#1D1D1F]">
              <Clock size={16} />
              Shifts
            </TabsTrigger>
            <TabsTrigger
              value="departments"
              className="gap-2 px-4 py-2 data-[state=active]:bg-muted data-[state=active]:text-[#1D1D1F]">
              <Building2 size={16} />
              Departments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 outline-none">
            <StaffOverview stats={stats} currency={currency} />
            <StaffDepartments
              memberships={
                (departmentsResult.success ? departmentsResult.data : []) ?? []
              }
            />
            <StaffActivity
              transactions={member.transactions}
              attendanceLogs={member.attendanceLogs}
            />
          </TabsContent>

          <TabsContent value="performance" className="outline-none">
            <StaffPerformance
              stats={stats}
              transactions={member.transactions}
              currency={currency}
            />
          </TabsContent>

          <TabsContent value="activity" className="outline-none">
            <StaffActivity
              transactions={member.transactions}
              attendanceLogs={member.attendanceLogs}
            />
          </TabsContent>

          <TabsContent value="settings" className="outline-none">
            <StaffSettings
              member={member}
              allMembers={membersResult.success ? membersResult.data : []}
            />
          </TabsContent>

          <TabsContent value="shifts" className="outline-none">
            <StaffMemberShiftsTab
              member={member}
              shifts={memberShifts as any}
              canManage={canManage}
            />
          </TabsContent>

          <TabsContent value="departments" className="outline-none">
            <StaffDepartments
              memberships={
                (departmentsResult.success ? departmentsResult.data : []) ?? []
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </Suspense>
  );
}

export const metadata: Metadata = {
  title: "Staff Profile",
  description: "Employee profile details, active roles, shift assignments, and activity history.",
};
