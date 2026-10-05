import { Metadata } from "next";
import { getSupplierById } from "../../../actions/supplier";
import { SupplierDetailsHeader } from "../../../../components/supplier/SupplierDetailsHeader";
import { ProductCatalog } from "../../../../components/supplier/ProductCatalog";
import { SupplierDeliveries } from "../../../../components/supplier/SupplierDeliveries";
import { CreateSupplierPODialog } from "../../../../components/supplier/create-supplier-po-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { notFound } from "next/navigation";
import {
  Package,
  Truck,
  Building2,
  CreditCard,
  Clock,
  MapPin,
  TrendingUp,
  BarChart2,
  Info,
} from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";

interface SupplierDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: SupplierDetailsPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const supplier = await getSupplierById(resolvedParams.id);

  if (!supplier) {
    return {
      title: "Supplier Not Found",
      description: "The requested supplier record could not be found.",
    };
  }

  return {
    title: `${supplier.name} — Supplier Profile`,
    description: `Supplier details, product catalog, purchase orders, and contact information for ${supplier.name}.`,
  };
}

export default async function SupplierDetailsPage({
  params,
}: SupplierDetailsPageProps) {
  const resolvedParams = await params;
  const supplier = await getSupplierById(resolvedParams.id);

  if (!supplier) {
    notFound();
  }

  const totalSpend =
    supplier.purchases?.reduce(
      (sum: number, p: any) => sum + (p.totalAmount || 0),
      0,
    ) ?? 0;
  const openOrders =
    supplier.purchases?.filter(
      (p: any) => p.status === "pending" || p.status === "processing",
    ).length ?? 0;
  const productCount = supplier.products?.length ?? 0;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SupplierDetailsHeader supplier={supplier} />

      {/* ── Tabs ── */}
      <div className="flex-1 flex flex-col">
        <Tabs defaultValue="catalog" className="flex-1 flex flex-col">
          {/* Tab bar */}
          <div className="bg-card border-b border-border">
            <div className="mx-auto px-8">
              <TabsList className="h-auto bg-transparent p-0 gap-0 rounded-none border-none flex">
                {[
                  {
                    value: "catalog",
                    icon: <Package size={14} />,
                    label: "Product Catalog",
                  },
                  {
                    value: "deliveries",
                    icon: <Truck size={14} />,
                    label: "Purchase Orders",
                  },
                  {
                    value: "info",
                    icon: <Info size={14} />,
                    label: "Company Details",
                  },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="
                      flex items-center gap-2 px-4 py-3.5 text-sm font-medium rounded-none bg-transparent border-none shadow-none
                      text-muted-foreground border-b-2 border-transparent -mb-px
                      data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent
                      hover:text-foreground hover:bg-accent/50
                      transition-colors
                    ">
                    {tab.icon}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 mx-auto w-full px-8 py-7">
            {/* ── Product Catalog ── */}
            <TabsContent
              value="catalog"
              className="m-0 focus-visible:outline-none space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Product Catalog
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {productCount} products supplied by {supplier.name}
                  </p>
                </div>
              </div>
              <ProductCatalog
                products={supplier.products || []}
                supplierId={supplier.id}
              />
            </TabsContent>

            {/* ── Purchase Orders ── */}
            <TabsContent
              value="deliveries"
              className="m-0 focus-visible:outline-none space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Purchase History
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Recent purchase orders and deliveries
                  </p>
                </div>
              </div>
              <SupplierDeliveries purchases={supplier.purchases || []} />
            </TabsContent>

            {/* ── Company Details ── */}
            <TabsContent
              value="info"
              className="m-0 focus-visible:outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left: General + Address */}
                <div className="lg:col-span-2 space-y-5">
                  {/* General Information */}
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border">
                      <Info size={15} className="text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">
                        General Information
                      </h3>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-x-10 gap-y-6">
                      {[
                        {
                          label: "Registration Number",
                          value: supplier.registrationNumber,
                        },
                        { label: "Tax ID / PIN", value: supplier.taxId },
                        {
                          label: "Primary Contact",
                          value: supplier.primaryContact,
                        },
                        {
                          label: "Business Email",
                          value: supplier.email,
                          isLink: true,
                        },
                        { label: "Contact Phone", value: supplier.phone },
                        {
                          label: "Website",
                          value: supplier.website,
                          isLink: true,
                        },
                      ].map(f => (
                        <div key={f.label}>
                          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
                            {f.label}
                          </div>
                          <div
                            className={`text-sm font-semibold ${
                              f.isLink && f.value
                                ? "text-primary underline underline-offset-2"
                                : "text-foreground"
                            }`}>
                            {f.value || "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border">
                      <MapPin size={15} className="text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Address & Location
                      </h3>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-x-10 gap-y-6">
                      <div className="col-span-2">
                        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
                          Street Address
                        </div>
                        <div className="text-sm font-semibold text-foreground">
                          {supplier.street || "—"}
                        </div>
                      </div>
                      {[
                        { label: "City", value: supplier.city },
                        { label: "State / Province", value: supplier.state },
                        { label: "Country", value: supplier.country },
                        { label: "ZIP / Postal Code", value: supplier.zipCode },
                      ].map(f => (
                        <div key={f.label}>
                          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
                            {f.label}
                          </div>
                          <div className="text-sm font-semibold text-foreground">
                            {f.value || "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Financials + Performance */}
                <div className="space-y-5">
                  {/* Financials */}
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border">
                      <CreditCard size={15} className="text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Financials
                      </h3>
                    </div>
                    <div className="divide-y divide-border">
                      {[
                        {
                          label: "Currency",
                          value: (
                            <Badge
                              variant="outline"
                              className="text-xs font-semibold px-2.5 py-0.5 bg-muted/50 border-border text-foreground">
                              {supplier.currency || "KES"}
                            </Badge>
                          ),
                        },
                        {
                          label: "Payment Terms",
                          value: supplier.paymentTerms || "Net 30",
                        },
                        {
                          label: "Lead Time",
                          value: (
                            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                              <Clock
                                size={13}
                                className="text-muted-foreground"
                              />
                              {supplier.leadTime ?? 7} days
                            </span>
                          ),
                        },
                      ].map(row => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between px-6 py-3.5">
                          <span className="text-sm text-muted-foreground">
                            {row.label}
                          </span>
                          {typeof row.value === "string" ? (
                            <span className="text-sm font-semibold text-foreground">
                              {row.value}
                            </span>
                          ) : (
                            row.value
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border">
                      <BarChart2 size={15} className="text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Performance
                      </h3>
                    </div>
                    <div className="p-6 space-y-5">
                      {[
                        { label: "Fulfillment Rate", value: "98%", pct: 98 },
                        { label: "Quality Score", value: "4.8 / 5.0", pct: 96 },
                        {
                          label: "On-time Delivery",
                          value: "96.2%",
                          pct: 96.2,
                        },
                      ].map(metric => (
                        <div key={metric.label}>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">
                              {metric.label}
                            </span>
                            <span className="font-semibold text-foreground tabular-nums">
                              {metric.value}
                            </span>
                          </div>
                          <div className="h-[3px] bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${metric.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
