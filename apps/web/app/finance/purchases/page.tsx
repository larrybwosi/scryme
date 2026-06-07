import { ShoppingBag } from 'lucide-react';
import { PageHeader } from '../../../components/page-header';
import { FilterBar } from '../../../components/filter-bar';
import { PurchaseTable } from '../../../components/purchase-table';
import { getPurchases } from '../../actions/purchases';

export default async function PurchasesPage(props: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const searchParams = await props.searchParams;
  const purchases = await getPurchases({
    search: searchParams.q,
    status: searchParams.status,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement"
        subtitle="Purchase orders and supplier invoices"
        icon={<ShoppingBag className="w-7 h-7" />}
        action={{ label: 'New Purchase Order' }}
      />

      <FilterBar />

      <PurchaseTable purchases={purchases} />
    </div>
  );
}
