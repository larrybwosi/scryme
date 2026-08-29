import { Metadata } from "next";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getOrganizationSettings } from "@/app/actions/organization";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
  title: "Organization Settings",
  description: "Configure company details, branding, tax registration, and default parameters.",
};


export default async function SettingsPage() {
  const settings = await getOrganizationSettings();

  return (
    <div className="w-full space-y-6 p-6">
      <PageHeader
        title="Organization Settings"
        subtitle="Manage your organization's global configuration and preferences"
        icon={<Settings className="w-7 h-7" />}
      />

      <div>
        <SettingsForm initialData={settings} />
      </div>
    </div>
  );
}
