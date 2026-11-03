import { Metadata } from "next";
import { PageHeader } from "../../../../components/page-header";
import { Building2 } from "lucide-react";
import { TaxComplianceClient } from "./tax-compliance-client";
import {
  getKRAConfigAction,
  getKRAVatSummaryAction,
  getKRALogsAction,
} from "@/app/actions/kra";

export const metadata: Metadata = {
  title: "Tax Compliance & KRA eTIMS",
  description: "Manage Kenyan tax filings, fiscal invoice transmissions, and VAT obligations.",
};

export default async function TaxCompliancePage() {
  const [config, summary, logsResult] = await Promise.all([
    getKRAConfigAction().catch(() => null),
    getKRAVatSummaryAction().catch(() => null),
    getKRALogsAction({ limit: 50 }).catch(() => ({ data: [] })),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tax Compliance & KRA eTIMS"
        subtitle="Fiscal device synchronization, VAT summaries, and transmission audit logs"
        icon={<Building2 className="w-7 h-7 text-indigo-500" />}
      />
      <TaxComplianceClient
        initialConfig={config}
        initialSummary={summary}
        initialLogs={logsResult.data || []}
      />
    </div>
  );
}
