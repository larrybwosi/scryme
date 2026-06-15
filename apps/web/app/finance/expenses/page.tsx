import { Receipt, Plus } from "lucide-react";
import { PageHeader } from "../../../components/page-header";
import { ExpenseFilters } from "../../../components/finance/expense-filters";
import {
  getExpenses,
  getExpenseCategories,
  getInventoryLocations,
} from "../../actions/finance";
import { ExpenseTable } from "../../../components/finance/expense-table";
import { ExpenseDialog } from "../../../components/finance/expense-dialog";
import { Button } from "@repo/ui/components/ui/button";

export default async function ExpensesPage(props: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    categoryId?: string;
    locationId?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const [expenses, categories, locations] = await Promise.all([
    getExpenses({
      search: searchParams.q,
      status: searchParams.status,
      categoryId: searchParams.categoryId,
      locationId: searchParams.locationId,
      startDate: searchParams.from,
      endDate: searchParams.to,
    }),
    getExpenseCategories(),
    getInventoryLocations(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        subtitle="Manage and track company spending"
        icon={<Receipt className="w-7 h-7" />}>
        <ExpenseDialog categories={categories}>
          <Button className="bg-[#34A853] hover:bg-[#2d9147]">
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </ExpenseDialog>
      </PageHeader>

      <ExpenseFilters categories={categories} locations={locations} />

      <ExpenseTable expenses={expenses} />
    </div>
  );
}
