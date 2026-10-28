import React from "react";
import { FinanceTabs } from "../../components/finance/finance-tabs";
import { ModuleRouteGuard } from "@/components/module-route-guard";

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleRouteGuard moduleKey="finance">
      <div className="p-8 max-w-[1400px] mx-auto">
        <FinanceTabs />
        <div className="mt-6">{children}</div>
      </div>
    </ModuleRouteGuard>
  );
}
