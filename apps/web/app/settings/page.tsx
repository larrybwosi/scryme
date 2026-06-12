import { Settings } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getOrganizationSettings } from "@/app/actions/organization";
import { SettingsForm } from "./settings-form";
import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    redirect(`/login?callbackUrl=/settings`);
  }

  const [organization, settings] = await Promise.all([
    db.organization.findUnique({
      where: { id: auth.organizationId },
    }),
    getOrganizationSettings(),
  ]);

  if (!organization) {
    redirect("/dashboard");
  }

  return (
    <div className="w-full space-y-6 p-6 lg:p-10">
      <PageHeader
        title="Organization Settings"
        subtitle="Manage your organization's global configuration and preferences"
        icon={<Settings className="w-7 h-7" />}
      />

      <div className="max-w-4xl">
        <SettingsForm
          organization={organization}
          initialSettings={settings}
        />
      </div>
    </div>
  );
}
