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
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@repo/ui/components/ui/card";
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
      description: "General ledger and day-to-day records",
      accent: "blue",
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
      accent: "amber",
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
      description: "Business health and compliance",
      accent: "emerald",
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
  ] as const;

  // Static class map so Tailwind can see the full class names at build time
  const accentStyles = {
    blue: {
      bar: "bg-blue-500",
      iconWrap:
        "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
      iconWrapHover: "group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20",
    },
    amber: {
      bar: "bg-amber-500",
      iconWrap:
        "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
      iconWrapHover:
        "group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20",
    },
    emerald: {
      bar: "bg-emerald-500",
      iconWrap:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
      iconWrapHover:
        "group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20",
    },
  } as const;

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
        {sections.map(section => {
          const accent = accentStyles[section.accent];
          return (
            <div key={section.title} className="space-y-4">
              <div className="flex items-start gap-3 px-1">
                <span
                  className={`mt-1.5 h-4 w-1 rounded-full ${accent.bar}`}
                  aria-hidden
                />
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/90">
                    {section.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {section.description}
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                {section.items.map(item => (
                  <Link key={item.name} href={item.href} className="block">
                    <Card className="group border-border/60 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-border cursor-pointer">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`shrink-0 p-2 rounded-lg transition-colors ${accent.iconWrap} ${accent.iconWrapHover}`}>
                            <item.icon className="w-5 h-5" />
                          </div>
                          <span className="font-medium truncate">
                            {item.name}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
