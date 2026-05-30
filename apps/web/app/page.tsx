import { BarChart3 } from 'lucide-react';
import { Breadcrumbs } from '../components/breadcrumbs';
import { PageHeader } from '../components/page-header';
import { FilterBar } from '../components/filter-bar';
import { PurchaseTable } from '../components/purchase-table';

export default function PurchaseReportPage(): React.ReactElement {
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Report', href: '/report' },
          { label: 'Purchase Report' }
        ]}
      />

      <PageHeader
        title="Purchase Report"
        subtitle="Auto-updates in 2 min"
        icon={<BarChart3 className="w-7 h-7" />}
        action={{ label: 'Add New Purchase' }}
      />

      <FilterBar />

      <PurchaseTable />
    </div>
  );
}
