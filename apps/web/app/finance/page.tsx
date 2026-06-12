import { Wallet } from 'lucide-react';
import { PageHeader } from '../../components/page-header';
import { FinanceStats } from '../../components/finance/finance-stats';
import { getFinanceOverview, getExpenses } from '../actions/finance';
import { ExpenseTable } from '../../components/finance/expense-table';
import { db } from '@repo/db';
import { getServerAuth } from '@repo/auth/server';
import { redirect } from 'next/navigation';

export default async function FinancePage() {
  const auth = await getServerAuth();
  if (!auth) {
    redirect('/login?callbackUrl=/finance');
  }
  const stats = await getFinanceOverview();
  const recentExpenses = await getExpenses({ status: 'all' });

  const organization = await db.organization.findUnique({
    where: { id: auth?.organizationId },
    include: { settings: true },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Finance Overview"
        subtitle="Track your business financials and health"
        icon={<Wallet className="w-7 h-7" />}
      />

      <FinanceStats
        stats={stats}
        currency={organization?.settings?.defaultCurrency || "USD"}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
        </div>
        <ExpenseTable expenses={recentExpenses.slice(0, 5)} />
      </div>
    </div>
  );
}
