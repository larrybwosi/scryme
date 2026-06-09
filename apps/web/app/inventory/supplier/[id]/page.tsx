import { getSupplierById } from "../../../actions/supplier";
import { SupplierDetailsHeader } from "../../../../components/supplier/SupplierDetailsHeader";
import { ProductCatalog } from "../../../../components/supplier/ProductCatalog";
import { SupplierDeliveries } from "../../../../components/supplier/SupplierDeliveries";
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
    <div className="flex flex-col min-h-screen bg-[#F8F9FB]">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 pt-6 pb-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-widest mb-5">
            <Building2 size={13} />
            <span>Suppliers</span>
            <span>/</span>
            <span className="text-gray-600">{supplier.name}</span>
          </div>

          {/* Identity row */}
          <div className="flex items-start justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-lg bg-blue-50 border border-gray-200 flex items-center justify-center text-blue-700 font-semibold text-lg flex-shrink-0 select-none">
                {supplier.name
                  .split(" ")
                  .slice(0, 2)
                  .map((w: string) => w[0])
                  .join("")
                  .toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold text-[#0F172A] tracking-tight leading-none">
                    {supplier.name}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-5 mt-1.5 flex-wrap">
                  {supplier.city && supplier.country && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <MapPin size={13} />
                      {supplier.city}, {supplier.country}
                    </span>
                  )}
                  {/*{supplier.category && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Package size={13} />
                      {supplier.category}
                    </span>
                  )}*/}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                Edit
              </button>
              <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium border border-blue-700 bg-blue-700 text-white hover:bg-blue-800 transition-colors">
                New Order
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-stretch border-t border-gray-100 pt-5 pb-5 gap-0">
            {[
              {
                label: "Total Spend YTD",
                value: `${supplier.currency ?? "KES"} ${(totalSpend / 1_000_000).toFixed(1)}M`,
                sub: (
                  <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                    <TrendingUp size={11} />
                    12.4% vs last year
                  </span>
                ),
              },
              {
                label: "Open Orders",
                value: String(openOrders),
                sub: (
                  <span className="text-xs text-gray-400">3 due this week</span>
                ),
              },
              {
                label: "Products",
                value: String(productCount),
                sub: (
                  <span className="text-xs text-gray-400">
                    Across multiple categories
                  </span>
                ),
              },
              {
                label: "On-time Rate",
                value: "96.2%",
                sub: (
                  <span className="text-xs text-gray-400">Last 90 days</span>
                ),
              },
              {
                label: "Avg Lead Time",
                value: `${supplier.leadTime ?? 7} days`,
                sub: (
                  <span className="text-xs text-gray-400">
                    {supplier.paymentTerms ?? "Net 30"} terms
                  </span>
                ),
              },
            ].map((stat, i, arr) => (
              <div
                key={stat.label}
                className={`flex-1 pr-6 mr-6 ${i < arr.length - 1 ? "border-r border-gray-100" : ""}`}
              >
                <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                  {stat.label}
                </div>
                <div className="text-[22px] font-semibold text-[#0F172A] tabular-nums leading-none mb-1">
                  {stat.value}
                </div>
                <div>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex-1 flex flex-col">
        <Tabs defaultValue="catalog" className="flex-1 flex flex-col">
          {/* Tab bar */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-8">
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
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="
                      flex items-center gap-2 px-4 py-3.5 text-sm font-medium rounded-none bg-transparent border-none shadow-none
                      text-gray-500 border-b-2 border-transparent -mb-px
                      data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 data-[state=active]:bg-transparent
                      hover:text-gray-900 hover:bg-gray-50
                      transition-colors
                    "
                  >
                    {tab.icon}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 max-w-7xl mx-auto w-full px-8 py-7">
            {/* ── Product Catalog ── */}
            <TabsContent
              value="catalog"
              className="m-0 focus-visible:outline-none space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[#0F172A]">
                    Product Catalog
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
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
              className="m-0 focus-visible:outline-none space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[#0F172A]">
                    Purchase History
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Recent purchase orders and deliveries
                  </p>
                </div>
              </div>
              <SupplierDeliveries purchases={supplier.purchases || []} />
            </TabsContent>

            {/* ── Company Details ── */}
            <TabsContent
              value="info"
              className="m-0 focus-visible:outline-none"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left: General + Address */}
                <div className="lg:col-span-2 space-y-5">
                  {/* General Information */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
                      <Info size={15} className="text-gray-400" />
                      <h3 className="text-sm font-semibold text-[#0F172A]">
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
                      ].map((f) => (
                        <div key={f.label}>
                          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                            {f.label}
                          </div>
                          <div
                            className={`text-sm font-semibold ${f.isLink && f.value ? "text-blue-700 underline underline-offset-2" : "text-[#0F172A]"}`}
                          >
                            {f.value || "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
                      <MapPin size={15} className="text-gray-400" />
                      <h3 className="text-sm font-semibold text-[#0F172A]">
                        Address & Location
                      </h3>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-x-10 gap-y-6">
                      <div className="col-span-2">
                        <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                          Street Address
                        </div>
                        <div className="text-sm font-semibold text-[#0F172A]">
                          {supplier.street || "—"}
                        </div>
                      </div>
                      {[
                        { label: "City", value: supplier.city },
                        { label: "State / Province", value: supplier.state },
                        { label: "Country", value: supplier.country },
                        { label: "ZIP / Postal Code", value: supplier.zipCode },
                      ].map((f) => (
                        <div key={f.label}>
                          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                            {f.label}
                          </div>
                          <div className="text-sm font-semibold text-[#0F172A]">
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
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
                      <CreditCard size={15} className="text-gray-400" />
                      <h3 className="text-sm font-semibold text-[#0F172A]">
                        Financials
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {[
                        {
                          label: "Currency",
                          value: (
                            <Badge
                              variant="outline"
                              className="text-xs font-semibold px-2.5 py-0.5 bg-gray-50 border-gray-200"
                            >
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
                            <span className="flex items-center gap-1.5 text-sm font-semibold text-[#0F172A]">
                              <Clock size={13} className="text-gray-400" />
                              {supplier.leadTime ?? 7} days
                            </span>
                          ),
                        },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between px-6 py-3.5"
                        >
                          <span className="text-sm text-gray-500">
                            {row.label}
                          </span>
                          {typeof row.value === "string" ? (
                            <span className="text-sm font-semibold text-[#0F172A]">
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
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
                      <BarChart2 size={15} className="text-gray-400" />
                      <h3 className="text-sm font-semibold text-[#0F172A]">
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
                      ].map((metric) => (
                        <div key={metric.label}>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-500">
                              {metric.label}
                            </span>
                            <span className="font-semibold text-[#0F172A] tabular-nums">
                              {metric.value}
                            </span>
                          </div>
                          <div className="h-[3px] bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-700 rounded-full"
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
