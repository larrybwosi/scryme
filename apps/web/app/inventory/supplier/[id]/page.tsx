import { getSupplierById } from "../../../actions/supplier";
import { SupplierDetailsHeader } from "../../../../components/supplier/SupplierDetailsHeader";
import { ProductCatalog } from "../../../../components/supplier/ProductCatalog";
import { SupplierDeliveries } from "../../../../components/supplier/SupplierDeliveries";
import { SupplierReviews } from "../../../../components/supplier/SupplierReviews";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import { notFound } from "next/navigation";
import { Package, Truck, MessageSquare, Info } from "lucide-react";

interface SupplierDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function SupplierDetailsPage({ params }: SupplierDetailsPageProps) {
  const supplier = await getSupplierById(params.id);

  if (!supplier) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/10">
      <SupplierDetailsHeader supplier={supplier} />

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <Tabs defaultValue="catalog" className="space-y-8">
          <TabsList className="bg-background border p-1 rounded-xl h-auto self-start">
            <TabsTrigger
              value="catalog"
              className="rounded-lg py-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 font-bold"
            >
              <Package size={18} />
              Product Catalog
            </TabsTrigger>
            <TabsTrigger
              value="deliveries"
              className="rounded-lg py-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 font-bold"
            >
              <Truck size={18} />
              Supplier Deliveries
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-lg py-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 font-bold"
            >
              <MessageSquare size={18} />
              Customer Reviews
            </TabsTrigger>
            <TabsTrigger
              value="info"
              className="rounded-lg py-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 font-bold"
            >
              <Info size={18} />
              Company Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="m-0 focus-visible:outline-none">
            <ProductCatalog products={supplier.products || []} />
          </TabsContent>

          <TabsContent value="deliveries" className="m-0 focus-visible:outline-none">
            <SupplierDeliveries purchases={supplier.purchases || []} />
          </TabsContent>

          <TabsContent value="reviews" className="m-0 focus-visible:outline-none">
            <SupplierReviews
              reviews={supplier.reviews}
              avgRating={supplier.avgRating}
              reviewCount={supplier.reviewCount}
              ratingCounts={supplier.ratingCounts || []}
            />
          </TabsContent>

          <TabsContent value="info" className="m-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-background border rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="font-bold text-lg">General Information</h3>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div className="text-muted-foreground">Registration Number</div>
                  <div className="font-medium text-right">{supplier.registrationNumber || "N/A"}</div>
                  <div className="text-muted-foreground">Tax ID</div>
                  <div className="font-medium text-right">{supplier.taxId || "N/A"}</div>
                  <div className="text-muted-foreground">Primary Currency</div>
                  <div className="font-medium text-right">{supplier.currency || "KES"}</div>
                  <div className="text-muted-foreground">Payment Terms</div>
                  <div className="font-medium text-right">{supplier.paymentTerms || "Net 30"}</div>
                  <div className="text-muted-foreground">Lead Time</div>
                  <div className="font-medium text-right">{supplier.leadTime || 7} Days</div>
                </div>
              </div>

              <div className="bg-background border rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="font-bold text-lg">Contact & Address</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Primary Contact</span>
                    <span className="font-medium">{supplier.primaryContact}</span>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="font-medium mb-1">Corporate Address</div>
                    <div className="text-muted-foreground leading-relaxed">
                      {supplier.street || "N/A"}<br />
                      {supplier.city}, {supplier.state || ""}<br />
                      {supplier.zipCode || ""}, {supplier.country}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
