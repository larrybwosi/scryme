import { Metadata } from "next";
import { PageHeader } from "../../../../components/page-header";
import { History } from "lucide-react";
import { JournalClient } from "./journal-client";

export const metadata: Metadata = {
  title: "Journal Entries",
  description: "Record manual journal entries, debit/credit adjustments, and audit trails.",
};


export default function JournalPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Journal Entries"
        subtitle="Audit and manage manual and automated financial records"
        icon={<History className="w-7 h-7" />}
      />
      <JournalClient />
    </div>
  );
}
