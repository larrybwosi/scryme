import { Suspense } from "react";
import { getSuppliers } from "../../actions/supplier";
import { SupplierCard } from "../../../components/supplier/SupplierCard";
import { PageHeader } from "../../../components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { Search, Filter, Truck } from "lucide-react";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { RegisterSupplierModal } from "../../../components/supplier/register-supplier-modal";

interface SupplierPageProps {
  searchParams: {
    tab?: string;
    q?: string;
  };
}

async function SupplierList({ tab, q }: { tab?: string; q?: string }) {
  const options = {
    featured: tab === "featured",
    favorite: tab === "favorites",
    search: q,
  };

  const suppliers = await getSuppliers(options);

  if (suppliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl bg-muted/30">
        <div className="bg-muted p-4 rounded-full mb-4">
          <Filter className="h-8 w-8 text-muted-foreground opacity-50" />
        </div>
        <h3 className="text-xl font-bold">No suppliers found</h3>
        <p className="text-muted-foreground mt-1 text-center max-w-xs">
          Try adjusting your filters or adding a new supplier to get started.
        </p>
        <Button className="mt-6 rounded-full px-8">Add New Supplier</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {suppliers.map((supplier) => (
        <SupplierCard key={supplier.id} supplier={supplier} />
      ))}
    </div>
  );
}

function SupplierSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="h-[280px] rounded-xl border bg-card animate-pulse" />
      ))}
    </div>
  );
}

export default async function SupplierListPage({ searchParams }: SupplierPageProps) {
  const resolvedSearchParams = await searchParams;
  const currentTab = resolvedSearchParams.tab || "all";

  return (
    <div className="flex-1 space-y-8 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader
          title="Supplier Management"
          subtitle="Manage your global network of suppliers and product catalogs"
          icon={<Truck className="w-6 h-6" />}
        />
        <RegisterSupplierModal />
      </div>

      <Tabs defaultValue={currentTab} className="w-full space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-1">
          <TabsList className="bg-transparent h-auto p-0 gap-8">
            <TabsTrigger
              value="all"
              className="px-0 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none font-bold text-sm"
            >
              All Suppliers
            </TabsTrigger>
            <TabsTrigger
              value="featured"
              className="px-0 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none font-bold text-sm"
            >
              Featured
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className="px-0 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none font-bold text-sm"
            >
              Favorites
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Search by name, code or category..." className="pl-9 h-9 bg-muted/50 border-none rounded-lg" />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-2 rounded-lg">
              <Filter size={16} />
              Filter
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="m-0 pt-2">
          <Suspense fallback={<SupplierSkeleton />}>
            <SupplierList tab="all" q={resolvedSearchParams.q} />
          </Suspense>
        </TabsContent>
        <TabsContent value="featured" className="m-0 pt-2">
          <Suspense fallback={<SupplierSkeleton />}>
            <SupplierList tab="featured" q={resolvedSearchParams.q} />
          </Suspense>
        </TabsContent>
        <TabsContent value="favorites" className="m-0 pt-2">
          <Suspense fallback={<SupplierSkeleton />}>
            <SupplierList tab="favorites" q={resolvedSearchParams.q} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
