import { BarChart3 } from 'lucide-react';
import { Breadcrumbs } from '../../components/breadcrumbs';
import { PageHeader } from '../../components/page-header';
import { FilterBar } from '../../components/filter-bar';
import { PurchaseTable } from '../../components/purchase-table';
import { getPurchases } from '../actions/purchases';

export default async function PurchasesPage(props: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const searchParams = await props.searchParams;
  const purchases = await getPurchases({
    search: searchParams.q,
    status: searchParams.status,
  });

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Report', href: '/report' },
          { label: 'Purchase Report' },
        ]}
      />

      <PageHeader
        title="Purchase Report"
        subtitle="Auto-updates in real-time"
        icon={<BarChart3 className="w-7 h-7" />}
        action={{ label: 'Add New Purchase' }}
      />

      <FilterBar />

      <PurchaseTable purchases={purchases.map(p => ({
        id: p.id,
        product: p.product,
        category: p.category,
        amount: p.amount,
        quantity: p.itemCount, // Or sum of quantities
        status: p.status,
        image: p.image,
      }))} />
    </div>
  );
}
