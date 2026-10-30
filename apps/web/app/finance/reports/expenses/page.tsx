import { Metadata } from "next";
import { PageHeader } from "../../../../components/page-header";
import { BarChart3 } from "lucide-react";
import { ExpenseReportsClient } from "./expense-reports-client";

export const metadata: Metadata = {
  title: "Expense Analytics Report",
  description: "Detailed analysis of operating expenses across categories and cost centers.",
};

export default function ExpenseReportPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Expense Analytics"
        subtitle="Review category spend, cost center allocations, and tax claims"
        icon={<BarChart3 className="w-7 h-7" />}
      />
      <ExpenseReportsClient />
    </div>
  );
}
