import { PageHeader } from "../../../../components/page-header";
import { Landmark } from "lucide-react";
import { ReconciliationClient } from "./reconciliation-client";

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
