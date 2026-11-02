import { Metadata } from "next";
import { Factory } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getProductionSettingsAction } from "@/app/actions/production-settings";
import { ProductionSettingsForm } from "./production-settings-form";

export const metadata: Metadata = {
  title: "Production Settings",
  description: "Configure batch numbering, production staging, and operational rules.",
};

export default async function ProductionSettingsPage() {
  const result = await getProductionSettingsAction();
  const settings = result.settings || {};

  return (
    <div className="w-full space-y-6 p-6">
      <PageHeader
        title="Production Settings"
        subtitle="Manage batch numbering formats, staging workflows, and general manufacturing rules"
        icon={<Factory className="w-7 h-7" />}
      />

      <div>
        <ProductionSettingsForm initialSettings={settings} />
      </div>
    </div>
  );
}
