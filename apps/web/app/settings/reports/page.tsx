import { Metadata } from "next";
import { Suspense } from "react";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";
import {
  getReportSettingsAction,
  getReportsListAction,
  getReportLocationsAndDepartmentsAction,
} from "@/app/actions/reports";
import { ReportsSettingsClient } from "./reports-settings-client";

export const metadata: Metadata = {
  title: "Reporting & Automation Preferences",
  description: "Customize automated reports, output formats, scoping filters, and workflow automations.",
};

export default async function ReportsSettingsPage() {
  const auth = await getServerAuth();
  if (!auth?.organizationId) {
    redirect("/login");
  }

  const [settings, reports, meta] = await Promise.all([
    getReportSettingsAction(),
    getReportsListAction(),
    getReportLocationsAndDepartmentsAction(),
  ]);

  return (
    <div className="w-full space-y-6 p-6">
      <PageHeader
        title="Reports & Automation Preferences"
        subtitle="Manage recurring summaries, notification channels, formats, and automation workflows"
        icon={<FileText className="w-7 h-7" />}
      />

      <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading reporting preferences...</div>}>
        <ReportsSettingsClient
          initialSettings={settings}
          locations={meta.locations}
          departments={meta.departments}
          workflows={meta.workflows}
          initialReports={reports}
        />
      </Suspense>
    </div>
  );
}
