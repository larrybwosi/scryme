import { Metadata } from "next";
import { PageHeader } from "../../../../components/page-header";
import { BookOpen } from "lucide-react";
import { COAClient } from "./coa-client";

export const metadata: Metadata = {
  title: "Chart of Accounts",
  description: "Manage general ledger accounts, asset/liability classifications, and account codes.",
};


export default function COAPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Chart of Accounts"
        subtitle="Manage your general ledger accounts and structure"
        icon={<BookOpen className="w-7 h-7" />}
      />
      <COAClient />
    </div>
  );
}
