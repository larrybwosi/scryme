import { Metadata } from "next";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { FinanceSettingsClient } from "./finance-settings-client";
import {
  getApprovalWorkflows,
  getCostCenters,
  getBudgetAlerts,
  getWindmillScripts,
} from "@/app/actions/finance-settings";
import { getExpenseCategories } from "@/app/actions/finance";
import { getInventoryLocations } from "@/app/actions/inventory";

export const metadata: Metadata = {
  title: "Finance Settings | Enterprise ERP",
  description:
    "Configure finance policies, approval workflows, and cost centers.",
};

export default async function FinanceSettingsPage() {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    return null;
  }

  const [
    organization,
    workflows,
    categories,
    costCenters,
    budgetAlerts,
    locations,
    windmillScripts,
  ] = await Promise.all([
    db.organization.findUnique({
      where: { id: auth.organizationId },
      include: { settings: true },
    }),
    getApprovalWorkflows(),
    getExpenseCategories(),
    getCostCenters(),
    getBudgetAlerts(),
    getInventoryLocations(),
    getWindmillScripts(),
  ]);

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Finance Settings"
        subtitle="Manage your organization's financial policies and approval workflows"
        icon={<Settings className="w-7 h-7" />}
      />

      <FinanceSettingsClient
        initialData={{
          organization,
          workflows,
          categories,
          costCenters,
          budgetAlerts,
          locations,
          windmillScripts,
        }}
      />
    </div>
  );
}
