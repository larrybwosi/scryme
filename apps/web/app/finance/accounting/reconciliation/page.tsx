import { Metadata } from "next";
import { PageHeader } from "../../../../components/page-header";
import { Landmark } from "lucide-react";
import { ReconciliationClient } from "./reconciliation-client";

export const metadata: Metadata = {
  title: "Bank Reconciliation",
  description: "Reconcile bank statements, M-Pesa transactions, and payment gateway payouts.",
};


export default function ReconciliationPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Bank Reconciliation"
        subtitle="Verify internal records against bank and M-Pesa statements"
        icon={<Landmark className="w-7 h-7" />}
      />
      <ReconciliationClient />
    </div>
  );
}
