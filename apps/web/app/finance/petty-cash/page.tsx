import { Metadata } from "next";
import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getServerAuth } from "@repo/auth/server";
import { getPettyCashFunds } from "@/app/actions/petty-cash";
import { getStaffMembers } from "@/app/actions/staff";
import { getInventoryLocations } from "@/app/actions/inventory";
import { PettyCashClient } from "./petty-cash-client";

export const metadata: Metadata = {
  title: "Petty Cash | Enterprise ERP",
  description: "Manage petty cash funds and transactions.",
};

export default async function PettyCashPage() {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    return null;
  }

  const [funds, staffResponse, locations] = await Promise.all([
    getPettyCashFunds(),
    getStaffMembers(),
    getInventoryLocations(),
  ]);

  const staff =
    staffResponse.success && staffResponse.data ? staffResponse.data : [];

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Petty Cash Management"
        subtitle="Manage office petty cash funds and track minor expenses"
        icon={<Wallet className="w-7 h-7" />}
      />

      <PettyCashClient
        initialFunds={funds}
        staff={staff}
        locations={locations}
      />
    </div>
  );
}
