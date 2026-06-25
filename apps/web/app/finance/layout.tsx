import React from "react";
import { FinanceTabs } from "../../components/finance/finance-tabs";

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <FinanceTabs />
      <div className="mt-6">{children}</div>
    </div>
  );
}
