import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { Metadata } from "next";
import { ReconciliationClient } from "./reconciliation-client";

export const metadata: Metadata = {
  title: "Delivery Reconciliation Queue",
  description: "Verify completed delivery dispatches, review proof of delivery, and confirm stock returns.",
};

export default async function DeliveryReconciliationPage() {
  const auth = await getServerAuth();
  if (!auth?.organizationId) return null;

  const fulfillments = await db.fulfillment.findMany({
    where: {
      transaction: { organizationId: auth.organizationId },
      status: { in: ["DELIVERED", "COMPLETED", "IN_TRANSIT", "SHIPPED"] },
    },
    include: {
      transaction: { include: { customer: true } },
      driver: { include: { vehicle: true, deliveryPartner: true } },
      items: { include: { transactionItem: true, batch: true, stockBatch: true } },
    },
    orderBy: [
      { isReconciled: "asc" },
      { deliveredAt: "desc" },
    ],
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Post-Delivery Reconciliation Queue</h2>
        <p className="text-sm text-muted-foreground">
          Confirm returned goods, review proof of delivery (POD), update driver statuses, and process partner wallet settlements.
        </p>
      </div>

      <ReconciliationClient fulfillments={fulfillments as any} />
    </div>
  );
}
