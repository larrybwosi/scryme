import { PageHeader } from "../../../../components/page-header";
import { BarChart3 } from "lucide-react";
import { PLClient } from "./pl-client";

export default function PLPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Profit & Loss"
        subtitle="Review your income and expenses over a period"
        icon={<BarChart3 className="w-7 h-7" />}
      />
      <PLClient />
    </div>
  );
}
