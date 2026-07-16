import { Suspense } from "react";
import { getSuppliers } from "../../actions/supplier";
import { SupplierCard } from "@/components/supplier/SupplierCard";
import { SupplierTable } from "@/components/supplier/supplier-table";
import { PageHeader } from "@/components/page-header";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { Search, Filter, Truck, LayoutGrid, List } from "lucide-react";
import { RegisterSupplierModal } from "@/components/supplier/register-supplier-modal";
import Link from "next/link";

interface SupplierPageProps {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    view?: string;
  }>;
}

async function SupplierList({
  tab,
  q,
  view = "table",
}: {
  tab?: string;
  q?: string;
  view?: string;
}) {
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

  if (view === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {suppliers.map(supplier => (
          <SupplierCard key={supplier.id} supplier={supplier} />
        ))}
      </div>
    );
  }

  return <SupplierTable data={suppliers} />;
}

function SupplierSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-[400px] rounded-xl border bg-card animate-pulse" />
    </div>
  );
}

export default async function SupplierListPage({
  searchParams,
}: SupplierPageProps) {
  const resolvedSearchParams = await searchParams;
  const currentTab = resolvedSearchParams.tab || "all";
  const currentView = resolvedSearchParams.view || "table";

  return (
    <Suspense>
      <div className="flex-1 space-y-8 p-8 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <PageHeader
            title="Supplier Management"
            subtitle="Manage your global network of suppliers and product catalogs"
            icon={<Truck className="w-6 h-6" />}
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-muted/50 rounded-lg p-1 border">
              <Link
                href={`/inventory/supplier?view=table&tab=${currentTab}${resolvedSearchParams.q ? `&q=${resolvedSearchParams.q}` : ""}`}>
                <Button
                  variant={currentView === "table" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0">
                  <List size={16} />
                </Button>
              </Link>
              <Link
                href={`/inventory/supplier?view=grid&tab=${currentTab}${resolvedSearchParams.q ? `&q=${resolvedSearchParams.q}` : ""}`}>
                <Button
                  variant={currentView === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0">
                  <LayoutGrid size={16} />
                </Button>
              </Link>
            </div>
            <RegisterSupplierModal />
          </div>
        </div>

        <Tabs defaultValue={currentTab} className="w-full space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-1">
            <TabsList className="flex items-center gap-1 border-b pb-px bg-transparent h-auto p-0">
              <TabsTrigger
                value="all"
                className="px-4 py-2 text-sm font-medium transition-colors relative data-[state=active]:text-[#34A853] text-gray-500 hover:text-gray-700 data-[state=active]:bg-transparent rounded-none">
                All Suppliers
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#34A853] data-[state=active]:block hidden" />
              </TabsTrigger>
              <TabsTrigger
                value="featured"
                className="px-4 py-2 text-sm font-medium transition-colors relative data-[state=active]:text-[#34A853] text-gray-500 hover:text-gray-700 data-[state=active]:bg-transparent rounded-none">
                Featured
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#34A853] data-[state=active]:block hidden" />
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className="px-4 py-2 text-sm font-medium transition-colors relative data-[state=active]:text-[#34A853] text-gray-500 hover:text-gray-700 data-[state=active]:bg-transparent rounded-none">
                Favorites
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#34A853] data-[state=active]:block hidden" />
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64 lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, code or category..."
                  className="pl-9 h-9 bg-muted/50 border-none rounded-lg"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-lg">
                <Filter size={16} />
                Filter
              </Button>
            </div>
          </div>

          <TabsContent value="all" className="m-0 pt-2">
            <Suspense fallback={<SupplierSkeleton />}>
              <SupplierList
                tab="all"
                q={resolvedSearchParams.q}
                view={currentView}
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="featured" className="m-0 pt-2">
            <Suspense fallback={<SupplierSkeleton />}>
              <SupplierList
                tab="featured"
                q={resolvedSearchParams.q}
                view={currentView}
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="favorites" className="m-0 pt-2">
            <Suspense fallback={<SupplierSkeleton />}>
              <SupplierList
                tab="favorites"
                q={resolvedSearchParams.q}
                view={currentView}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </Suspense>
  );
}
