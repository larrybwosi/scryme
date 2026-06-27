import {
  BookOpen,
  FileText,
  BarChart3,
  Wallet,
  Settings,
  History,
  Scale,
  Zap,
  LayoutDashboard,
  ArrowRightLeft,
  Building2,
  CalendarClock,
  Landmark,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { FinanceStats } from "../../components/finance/finance-stats";
import { getFinanceOverview } from "../actions/finance";
import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { PageHeader } from "../../components/page-header";

export default async function FinanceDashboard() {
  const auth = await getServerAuth();
  const stats = await getFinanceOverview();

  const organization = await db.organization.findUnique({
    where: { id: auth?.organizationId },
    include: { settings: true },
  });

  const sections = [
    {
      title: "Core Accounting",
      description: "General Ledger and Day-to-Day Records",
      items: [
        {
          name: "Chart of Accounts",
          href: "/finance/accounting/coa",
          icon: BookOpen,
        },
        {
          name: "Journal Entries",
          href: "/finance/accounting/journal",
          icon: History,
        },
        {
          name: "Bank Reconciliation",
          href: "/finance/accounting/reconciliation",
          icon: Landmark,
        },
      ],
    },
    {
      title: "Payables & Receivables",
      description: "Manage what you owe and what you're owed",
      items: [
        { name: "Expenses", href: "/finance/expenses", icon: Wallet },
        {
          name: "Purchases & Bills",
          href: "/finance/purchases",
          icon: FileText,
        },
        {
          name: "Recurring Bills",
          href: "/finance/accounting/recurring",
          icon: CalendarClock,
        },
        { name: "Utility Bills", href: "/finance/utilities", icon: Zap },
      ],
    },
    {
      title: "Financial Reporting",
      description: "Business Health & Compliance",
      items: [
        {
          name: "Profit & Loss",
          href: "/finance/reports/profit-loss",
          icon: BarChart3,
        },
        {
          name: "Balance Sheet",
          href: "/finance/reports/balance-sheet",
          icon: Scale,
        },
        {
          name: "Cash Flow",
          href: "/finance/reports/cash-flow",
          icon: ArrowRightLeft,
        },
        {
          name: "Tax Compliance",
          href: "/finance/reports/tax-compliance",
          icon: Building2,
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Enterprise Finance"
        subtitle="Manage organization financials, bills, and accounting"
        icon={<TrendingUp className="w-7 h-7" />}
      />

      <FinanceStats
        stats={stats}
        currency={organization?.settings?.defaultCurrency || "USD"}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map(section => (
          <div key={section.title} className="space-y-4">
            <div className="px-1">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>
            </div>
            <div className="grid gap-4">
              {section.items.map(item => (
                <Link key={item.name} href={item.href}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer group">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <item.icon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      {/* Simple Chevron or Arrow */}
                      <span className="text-muted-foreground group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
