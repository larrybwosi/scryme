import { Receipt, Plus } from 'lucide-react';
import { PageHeader } from '../../../components/page-header';
import { FilterBar } from '../../../components/filter-bar';
import { getExpenses, getExpenseCategories } from '../../actions/finance';
import { ExpenseTable } from '../../../components/finance/expense-table';
import { ExpenseDialog } from '../../../components/finance/expense-dialog';
import { Button } from '@repo/ui/components/ui/button';

export default async function ExpensesPage(props: {
  searchParams: Promise<{ q?: string; status?: string; categoryId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const [expenses, categories] = await Promise.all([
    getExpenses({
      search: searchParams.q,
      status: searchParams.status,
      categoryId: searchParams.categoryId,
    }),
    getExpenseCategories()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        subtitle="Manage and track company spending"
        icon={<Receipt className="w-7 h-7" />}
      >
        <ExpenseDialog categories={categories}>
          <Button className="bg-[#34A853] hover:bg-[#2d9147]">
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </ExpenseDialog>
      </PageHeader>

      <FilterBar />

      <ExpenseTable expenses={expenses} />
    </div>
  );
}
