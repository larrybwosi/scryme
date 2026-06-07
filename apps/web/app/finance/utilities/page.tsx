import { Zap, Plus } from 'lucide-react';
import { PageHeader } from '../../../components/page-header';
import { getUtilityAccounts } from '../../actions/finance';
import { UtilityDialog } from '../../../components/finance/utility-dialog';
import { Button } from '@repo/ui/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";

export default async function UtilitiesPage() {
  const accounts = await getUtilityAccounts();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utility Management"
        subtitle="Track electricity, water, and other services"
        icon={<Zap className="w-7 h-7" />}
      >
        <UtilityDialog>
          <Button className="bg-[#34A853] hover:bg-[#2d9147]">
            <Plus className="w-4 h-4 mr-2" />
            Add Utility Account
          </Button>
        </UtilityDialog>
      </PageHeader>

      <div className="rounded-md border bg-white">
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
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No utility accounts found
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>{account.provider || 'N/A'}</TableCell>
                  <TableCell>{account.accountNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{account.type}</Badge>
                  </TableCell>
                  <TableCell>{(account as any)._count.expenses}</TableCell>
                  <TableCell className="text-right">
                    <button className="text-sm text-[#34A853] font-medium">View History</button>
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
