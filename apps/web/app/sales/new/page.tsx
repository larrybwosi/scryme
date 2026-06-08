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

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Create New Order"
        subtitle="Staff-created sales order or quote"
        icon={<PackagePlus className="w-7 h-7" />}
      />

      <OrderForm customers={customers} locations={locations} />
    </div>
  );
}
