import { ReceiptText, Plus } from 'lucide-react';
import { PageHeader } from '../../../components/page-header';
import { FilterBar } from '../../../components/filter-bar';
import { getTransactions } from '../../actions/sales';
import { TransactionTable } from '../../../components/sales/transaction-table';
import { TransactionType, TransactionStatus, PaymentStatus } from '@repo/db/client';

export default async function TransactionsPage(props: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
    paymentStatus?: string;
    locationId?: string;
  }>;
}) {
  const searchParams = await props.searchParams;

  const transactions = await getTransactions({
    search: searchParams.q,
    type: searchParams.type as TransactionType | "all",
    status: searchParams.status as TransactionStatus | "all",
    paymentStatus: searchParams.paymentStatus as PaymentStatus | "all",
    locationId: searchParams.locationId,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        subtitle="Manage sales, quotes, and orders"
        icon={<ReceiptText className="w-7 h-7" />}
        action={{
          label: 'New Order',
          href: '/sales/new',
          icon: <Plus className="w-4 h-4" />
        }}
      />

      <FilterBar />

      <TransactionTable transactions={transactions} />
    </div>
  );
}
