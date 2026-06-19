import { PageHeader } from "../../../../components/page-header";
import { History } from "lucide-react";
import { JournalClient } from "./journal-client";

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
