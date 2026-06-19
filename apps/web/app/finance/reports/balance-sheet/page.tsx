import { PageHeader } from "../../../../components/page-header";
import { Scale } from "lucide-react";

export default function BalanceSheetPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Balance Sheet"
        subtitle="Snapshot of organization assets, liabilities, and equity"
        icon={<Scale className="w-7 h-7" />}
      />
      <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-xl bg-muted/20">
          <p className="text-muted-foreground italic">Balance Sheet Report Component Coming Soon</p>
      </div>
    </div>
  );
}
