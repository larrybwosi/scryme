import { Metadata } from "next";
import { Award } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getLoyaltyProgramAction, listLoyaltyCustomersAction } from "@/app/actions/loyalty";
import { LoyaltyManagementClient } from "./loyalty-management-client";

export const metadata: Metadata = {
  title: "Loyalty & Rewards Program",
  description: "Configure tiers, custom earning rules, points expiration, and customer rewards.",
};

export default async function LoyaltySettingsPage() {
  const [programRes, customersRes] = await Promise.all([
    getLoyaltyProgramAction(),
    listLoyaltyCustomersAction(),
  ]);

  const initialProgram = programRes.program || null;
  const initialCustomers = customersRes.customers || [];

  return (
    <div className="w-full space-y-6 p-6">
      <PageHeader
        title="Loyalty & Rewards Program"
        subtitle="Manage membership tiers, points rules, rewards catalog, and customer point balances"
        icon={<Award className="w-7 h-7 text-amber-500" />}
      />

      <LoyaltyManagementClient
        initialProgram={initialProgram}
        initialCustomers={initialCustomers}
      />
    </div>
  );
}
