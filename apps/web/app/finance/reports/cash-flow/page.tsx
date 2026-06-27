import { PageHeader } from "../../../../components/page-header";
import { ArrowRightLeft } from "lucide-react";

export default function CashFlowPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Cash Flow"
        subtitle="Track the flow of cash in and out of your organization"
        icon={<ArrowRightLeft className="w-7 h-7" />}
      />
      <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-xl bg-muted/20">
        <p className="text-muted-foreground italic">
          Cash Flow Statement Component Coming Soon
        </p>
      </div>
    </div>
  );
}
