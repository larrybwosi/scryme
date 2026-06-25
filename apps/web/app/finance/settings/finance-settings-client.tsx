"use client";

import { useState } from "react";
import {
  Settings,
  GitMerge,
  PieChart,
  Tag,
  Bell,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Building,
  Activity,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { GeneralSettings } from "./general-settings";
import { WorkflowManager } from "./workflow-manager";
import { CostCenterManager } from "./cost-center-manager";
import { CategoryManager } from "./category-manager";
import { BudgetAlertManager } from "./budget-alert-manager";

type SectionId =
  | "general"
  | "workflows"
  | "cost-centers"
  | "categories"
  | "budget-alerts";

const SECTIONS = [
  {
    id: "general",
    label: "General Settings",
    icon: Settings,
    description: "Thresholds and global flags",
  },
  {
    id: "workflows",
    label: "Approval Workflows",
    icon: GitMerge,
    description: "Multi-step approval processes",
  },
  {
    id: "cost-centers",
    label: "Cost Centers",
    icon: Building,
    description: "Dimensional reporting and tracking",
  },
  {
    id: "categories",
    label: "Expense Categories",
    icon: Tag,
    description: "Categorization and GL mapping",
  },
  {
    id: "budget-alerts",
    label: "Budget Alerts",
    icon: Bell,
    description: "Spend monitoring and notifications",
  },
];

export function FinanceSettingsClient({ initialData }: { initialData: any }) {
  const [activeSection, setActiveSection] = useState<SectionId>("general");

  const renderContent = () => {
    switch (activeSection) {
      case "general":
        return <GeneralSettings organization={initialData.organization} />;
      case "workflows":
        return (
          <WorkflowManager
            initialWorkflows={initialData.workflows}
            locations={initialData.locations}
            categories={initialData.categories}
            windmillScripts={initialData.windmillScripts}
          />
        );
      case "cost-centers":
        return (
          <CostCenterManager initialCostCenters={initialData.costCenters} />
        );
      case "categories":
        return <CategoryManager initialCategories={initialData.categories} />;
      case "budget-alerts":
        return <BudgetAlertManager initialAlerts={initialData.budgetAlerts} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 shrink-0">
        <nav className="flex flex-col gap-1">
          {SECTIONS.map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as SectionId)}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl transition-all text-left group",
                  isActive
                    ? "bg-white border border-zinc-200 shadow-sm ring-1 ring-zinc-200/50"
                    : "hover:bg-zinc-100 border border-transparent",
                )}>
                <div
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-[#34A853] text-white"
                      : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200",
                  )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-semibold transition-colors",
                      isActive
                        ? "text-zinc-900"
                        : "text-zinc-500 group-hover:text-zinc-700",
                    )}>
                    {section.label}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1 leading-tight">
                    {section.description}
                  </p>
                </div>
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-zinc-300 self-center" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-8 p-4 rounded-xl bg-zinc-900 text-white overflow-hidden relative">
          <div className="relative z-10">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#34A853]" />
              Enterprise Security
            </h4>
            <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
              All financial changes are audited and logged. Multi-admin approval
              is required for sensitive workflow changes.
            </p>
          </div>
          <Activity className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 rotate-12" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden min-h-[600px]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
