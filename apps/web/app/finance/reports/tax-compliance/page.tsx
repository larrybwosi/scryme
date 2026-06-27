import { PageHeader } from "../../../../components/page-header";
import { Building2 } from "lucide-react";

export default function TaxCompliancePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Tax Compliance"
        subtitle="Manage Kenyan tax filings and VAT summaries"
        icon={<Building2 className="w-7 h-7" />}
      />
      <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-xl bg-muted/20">
        <p className="text-muted-foreground italic">
          Kenyan Tax Compliance Dashboard Coming Soon
        </p>
      </div>
    </div>
  );
}
