import { Metadata } from "next";
import { PageHeader } from "../../../../components/page-header";
import { CalendarClock } from "lucide-react";

export const metadata: Metadata = {
  title: "Recurring Transactions",
  description: "Automate recurring billing, subscriptions, and scheduled journal entries.",
};


export default function RecurringBillsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Recurring Bills"
        subtitle="Manage automated recurring supplier invoices and bills"
        icon={<CalendarClock className="w-7 h-7" />}
      />
      <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-xl bg-muted/20">
          <p className="text-muted-foreground italic">Recurring Bills Management Coming Soon</p>
      </div>
    </div>
  );
}
