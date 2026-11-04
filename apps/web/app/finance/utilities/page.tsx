import { Metadata } from "next";
import { Zap, Plus } from "lucide-react";
import { PageHeader } from "../../../components/page-header";
import { getUtilityAccounts } from "../../actions/finance";
import { UtilityDialog } from "../../../components/finance/utility-dialog";
import { Button } from "@repo/ui/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";

export const metadata: Metadata = {
  title: "Utility Management",
  description: "Track facility overheads, utility bills, and energy expenditure across locations.",
};

export default async function UtilitiesPage() {
  const accounts = await getUtilityAccounts();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utility Management"
        subtitle="Track electricity, water, and other services"
        icon={<Zap className="w-7 h-7" />}>
        <UtilityDialog>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
            <Plus className="w-4 h-4 mr-2" />
            Add Utility Account
          </Button>
        </UtilityDialog>
      </PageHeader>

      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account Name</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Account #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Bills Recorded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground">
                  No utility accounts found
                </TableCell>
              </TableRow>
            ) : (
              accounts.map(account => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium text-foreground">{account.name}</TableCell>
                  <TableCell>{account.provider || "N/A"}</TableCell>
                  <TableCell className="text-muted-foreground">{account.accountNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{account.type}</Badge>
                  </TableCell>
                  <TableCell>{(account as any)._count.expenses}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <UtilityDialog
                        mode="BILL"
                        accountId={account.id}
                        accountName={account.name}>
                        <button className="text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline cursor-pointer">
                          Record Bill
                        </button>
                      </UtilityDialog>
                      <button className="text-sm text-muted-foreground font-medium hover:text-foreground cursor-pointer">
                        History
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
