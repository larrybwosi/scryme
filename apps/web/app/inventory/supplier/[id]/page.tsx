import { getSupplierById } from "../../../actions/supplier";
import { SupplierDetailsHeader } from "../../../../components/supplier/SupplierDetailsHeader";
import { ProductCatalog } from "../../../../components/supplier/ProductCatalog";
import { SupplierDeliveries } from "../../../../components/supplier/SupplierDeliveries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import { notFound } from "next/navigation";
import { Package, Truck, Info, CreditCard, Clock, MapPinned } from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";

interface SupplierDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SupplierDetailsPage({ params }: SupplierDetailsPageProps) {
  const resolvedParams = await params;
  const supplier = await getSupplierById(resolvedParams.id);

  if (!supplier) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <SupplierDetailsHeader supplier={supplier} />

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <Tabs defaultValue="catalog" className="space-y-8">
          <TabsList className="bg-white border p-1.5 rounded-2xl h-auto self-start shadow-sm inline-flex">
            <TabsTrigger
              value="catalog"
              className="rounded-xl py-3 px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 font-bold text-sm transition-all"
            >
              <Package size={20} />
              Product Catalog
            </TabsTrigger>
            <TabsTrigger
              value="deliveries"
              className="rounded-xl py-3 px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 font-bold text-sm transition-all"
            >
              <Truck size={20} />
              Purchase Orders
            </TabsTrigger>
            <TabsTrigger
              value="info"
              className="rounded-xl py-3 px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 font-bold text-sm transition-all"
            >
              <Info size={20} />
              Company Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="m-0 focus-visible:outline-none">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#1D1D1F]">Product Catalog</h2>
                  <p className="text-muted-foreground">List of products supplied by {supplier.name}</p>
                </div>
              </div>
              <ProductCatalog products={supplier.products || []} supplierId={supplier.id} />
            </div>
          </TabsContent>

          <TabsContent value="deliveries" className="m-0 focus-visible:outline-none">
             <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#1D1D1F]">Purchase History</h2>
                  <p className="text-muted-foreground">Recent purchase orders and deliveries</p>
                </div>
              </div>
              <SupplierDeliveries purchases={supplier.purchases || []} />
            </div>
          </TabsContent>

          <TabsContent value="info" className="m-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white border rounded-3xl p-8 shadow-sm space-y-8">
                  <div className="flex items-center gap-3 pb-2 border-b">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Info size={20} />
                    </div>
                    <h3 className="font-bold text-xl">General Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium text-muted-foreground">Registration Number</div>
                      <div className="font-bold text-[#1D1D1F]">{supplier.registrationNumber || "N/A"}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium text-muted-foreground">Tax ID / PIN</div>
                      <div className="font-bold text-[#1D1D1F]">{supplier.taxId || "N/A"}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium text-muted-foreground">Primary Contact</div>
                      <div className="font-bold text-[#1D1D1F]">{supplier.primaryContact}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium text-muted-foreground">Business Email</div>
                      <div className="font-bold text-[#1D1D1F]">{supplier.email}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium text-muted-foreground">Contact Phone</div>
                      <div className="font-bold text-[#1D1D1F]">{supplier.phone || "N/A"}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium text-muted-foreground">Website</div>
                      <div className="font-bold text-primary underline underline-offset-4">{supplier.website || "N/A"}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-3xl p-8 shadow-sm space-y-8">
                  <div className="flex items-center gap-3 pb-2 border-b">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                      <MapPinned size={20} />
                    </div>
                    <h3 className="font-bold text-xl">Address & Location</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-1.5">
                      <div className="text-sm font-medium text-muted-foreground">Street Address</div>
                      <div className="font-bold text-[#1D1D1F] leading-relaxed">
                        {supplier.street || "N/A"}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-1.5">
                        <div className="text-sm font-medium text-muted-foreground">City</div>
                        <div className="font-bold text-[#1D1D1F]">{supplier.city || "N/A"}</div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-sm font-medium text-muted-foreground">State/Province</div>
                        <div className="font-bold text-[#1D1D1F]">{supplier.state || "N/A"}</div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-sm font-medium text-muted-foreground">Country</div>
                        <div className="font-bold text-[#1D1D1F]">{supplier.country || "N/A"}</div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-sm font-medium text-muted-foreground">ZIP / Postal Code</div>
                        <div className="font-bold text-[#1D1D1F]">{supplier.zipCode || "N/A"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-white border rounded-3xl p-8 shadow-sm space-y-8">
                  <div className="flex items-center gap-3 pb-2 border-b">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                      <CreditCard size={20} />
                    </div>
                    <h3 className="font-bold text-xl">Financials</h3>
                  </div>
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">Currency</span>
                      <Badge variant="outline" className="font-bold px-3 py-1 bg-gray-50">{supplier.currency || "KES"}</Badge>
                    </div>
                    <div className="flex justify-between items-center border-t pt-6">
                      <span className="text-sm font-medium text-muted-foreground">Payment Terms</span>
                      <span className="font-bold text-[#1D1D1F]">{supplier.paymentTerms || "Net 30"}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-6">
                      <span className="text-sm font-medium text-muted-foreground">Lead Time</span>
                      <div className="flex items-center gap-2">
                         <Clock size={16} className="text-muted-foreground" />
                         <span className="font-bold text-[#1D1D1F]">{supplier.leadTime || 7} Days</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 space-y-6">
                  <h3 className="font-bold text-xl text-primary">Supplier Health</h3>
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                           <span className="font-medium text-primary/80">Fulfillment Rate</span>
                           <span className="font-bold text-primary">98%</span>
                        </div>
                        <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
                           <div className="h-full bg-primary rounded-full w-[98%]" />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                           <span className="font-medium text-primary/80">Quality Score</span>
                           <span className="font-bold text-primary">4.8/5.0</span>
                        </div>
                        <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
                           <div className="h-full bg-primary rounded-full w-[92%]" />
                        </div>
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
