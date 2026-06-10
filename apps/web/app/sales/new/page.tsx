import { PackagePlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { OrderForm } from "@/components/sales/order-form";
import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";

export default async function NewOrderPage() {
  const auth = await getServerAuth();

  const customers = await db.customer.findMany({
    where: { organizationId: auth?.organizationId },
    orderBy: { name: "asc" },
  });

  const locations = await db.inventoryLocation.findMany({
    where: { organizationId: auth?.organizationId },
    orderBy: { name: "asc" },
  });

  const variants = await db.productVariant.findMany({
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
  });

  const formattedVariants = variants.map((v) => ({
    id: v.id,
    name: v.name,
    sku: v.sku,
    productName: v.product.name,
    retailPrice: Number(v.retailPrice),
    buyingPrice: Number(v.buyingPrice),
    stock: v.variantStocks.reduce((acc, s) => acc + Number(s.availableStock), 0),
  }));

  const organization = await db.organization.findUnique({
    where: { id: auth?.organizationId },
    include: { settings: true },
  });

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Create New Order"
        subtitle="Staff-created sales order or quote"
        icon={<PackagePlus className="w-7 h-7" />}
      />

      <OrderForm
        customers={customers}
        locations={locations}
        variants={formattedVariants}
        currency={organization?.settings?.defaultCurrency || "USD"}
      />
    </div>
  );
}
