import { Metadata } from "next";
import { PageHeader } from "../../../../components/page-header";
import { BarChart3 } from "lucide-react";
import { BudgetReportsClient } from "./budget-reports-client";

export const metadata: Metadata = {
  title: "Budget Variance Report",
  description: "Variance analysis comparing budgeted, committed, and actual spent amounts.",
};

export default function BudgetReportPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Budget Variance"
        subtitle="Analyze allocations, commitments, and actual expenditures against budgets"
        icon={<BarChart3 className="w-7 h-7" />}
      />
      <BudgetReportsClient />
    </div>
  );
}
