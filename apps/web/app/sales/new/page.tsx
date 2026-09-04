import { Metadata } from "next";
import { PackagePlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { OrderForm } from "@/components/sales/order-form";
import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";

export const metadata: Metadata = {
  title: "New Order & Sale",
  description: "Create a new direct sales order, issue quotation, or bill a customer.",
};


export default async function NewOrderPage() {
  const auth = await getServerAuth();

  // ⚡ Bolt Optimization: Parallelize independent database queries using Promise.all
  // Reduces server page render latency from 6 sequential DB roundtrips O(N) to concurrent O(1) execution time.
  const [
    customers,
    businessAccounts,
    deliveryPartners,
    locations,
    variants,
    organization,
  ] = await Promise.all([
    db.customer.findMany({
      where: { organizationId: auth?.organizationId },
      include: { addresses: true },
      orderBy: { name: "asc" },
    }),
    db.businessAccount.findMany({
      where: { organizationId: auth?.organizationId },
      include: { addresses: true },
      orderBy: { name: "asc" },
    }),
    db.deliveryPartner.findMany({
      where: { organizationId: auth?.organizationId },
      orderBy: { name: "asc" },
    }),
    db.inventoryLocation.findMany({
      where: { organizationId: auth?.organizationId },
      orderBy: { name: "asc" },
    }),
    db.productVariant.findMany({
      where: {
        product: {
          organizationId: auth?.organizationId,
        },
      },
      include: {
        product: true,
        variantStocks: true,
      },
      orderBy: {
        product: {
          name: "asc",
        },
      },
    }),
    db.organization.findUnique({
      where: { id: auth?.organizationId },
      include: { settings: true },
    }),
  ]);

  const formattedVariants = variants.map(v => ({
    id: v.id,
    name: v.name,
    sku: v.sku,
    productName: v.product.name,
    retailPrice: Number(v.retailPrice),
    buyingPrice: Number(v.buyingPrice),
    stock: v.variantStocks.reduce(
      (acc, s) => acc + Number(s.availableStock),
      0,
    ),
  }));

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Create New Order"
        subtitle="Staff-created sales order or quote"
        icon={<PackagePlus className="w-7 h-7" />}
      />

      <OrderForm
        customers={customers}
        businessAccounts={businessAccounts}
        deliveryPartners={deliveryPartners}
        locations={locations}
        variants={formattedVariants}
        currency={organization?.settings?.defaultCurrency || "USD"}
      />
    </div>
  );
}
