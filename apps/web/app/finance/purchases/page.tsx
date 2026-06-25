import { ShoppingBag, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filter-bar";
import { PurchaseTable } from "@/components/purchase-table";
import { getPurchases } from "@/app/actions/purchases";
import { getSuppliers, getInventoryProducts } from "@/app/actions/inventory";
import { PurchaseDialog } from "@/components/finance/purchase-dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Suspense } from "react";

export default async function PurchasesPage(props: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const searchParams = await props.searchParams;
  const [purchases, suppliers, products] = await Promise.all([
    getPurchases({
      search: searchParams.q,
      status: searchParams.status,
    }),
    getSuppliers(),
    getInventoryProducts({}),
  ]);

  return (
    <Suspense>
      <div className="space-y-6">
        <PageHeader
          title="Procurement"
          subtitle="Purchase orders and supplier invoices"
          icon={<ShoppingBag className="w-7 h-7" />}>
          <PurchaseDialog suppliers={suppliers} products={products}>
            <Button className="bg-[#34A853] hover:bg-[#2d9147]">
              <Plus className="w-4 h-4 mr-2" />
              New Purchase Order
            </Button>
          </PurchaseDialog>
        </PageHeader>

        <FilterBar />

        <PurchaseTable purchases={purchases} />
      </div>
    </Suspense>
  );
}
