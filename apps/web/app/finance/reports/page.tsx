import { Metadata } from "next";
import { PageHeader } from "../../../components/page-header";
import { BarChart3, FileSpreadsheet, PieChart, TrendingUp, Landmark, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card";

export const metadata: Metadata = {
  title: "Financial Reports & Analytics",
  description: "Enterprise financial reports including Income Statement, Expense Analytics, and Budget Variance.",
};

const reports = [
  {
    title: "Expense Analytics",
    description: "Breakdown of operating expenditures by category, cost center, and claimable tax.",
    href: "/finance/reports/expenses",
    icon: PieChart,
    badge: "Enterprise",
  },
  {
    title: "Budget Variance Analysis",
    description: "Compare budgeted amounts against committed purchase orders and actual spend.",
    href: "/finance/reports/budgets",
    icon: TrendingUp,
    badge: "Control",
  },
  {
    title: "Profit & Loss Statement",
    description: "Comprehensive income statement based on double-entry general ledger postings.",
    href: "/finance/reports/profit-loss",
    icon: BarChart3,
  },
  {
    title: "Cash Flow Statement",
    description: "Track operating, investing, and financing cash inflows and outflows.",
    href: "/finance/reports/cash-flow",
    icon: FileSpreadsheet,
  },
  {
    title: "Balance Sheet",
    description: "Snapshot of company assets, liabilities, and retained equity.",
    href: "/finance/reports/balance-sheet",
    icon: Landmark,
  },
  {
    title: "Tax Compliance Report",
    description: "Input tax claims, output tax liability, and KRA/VAT filing summaries.",
    href: "/finance/reports/tax-compliance",
    icon: ShieldCheck,
  },
];

export default function ReportsHubPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Financial Reports"
        subtitle="Access general ledger reports, expense analytics, and budget performance"
        icon={<BarChart3 className="w-7 h-7" />}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <Link key={r.href} href={r.href}>
              <Card className="h-full hover:border-zinc-400 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Icon className="w-6 h-6 text-zinc-600" />
                    {r.badge && (
                      <span className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded font-medium">
                        {r.badge}
                      </span>
                    )}
                  </div>
                  <CardTitle className="mt-4">{r.title}</CardTitle>
                  <CardDescription>{r.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
