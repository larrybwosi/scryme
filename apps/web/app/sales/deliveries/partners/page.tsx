import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { Metadata } from "next";
import { PartnersClient } from "./partners-client";

export const metadata: Metadata = {
  title: "Delivery Partners & Fleet Settings",
  description: "Manage 3rd-party delivery partners, commission rates, benefit policies, and default logistics settings.",
};

export default async function DeliveryPartnersPage() {
  const auth = await getServerAuth();
  if (!auth?.organizationId) return null;

  const partners = await db.deliveryPartner.findMany({
    where: { organizationId: auth.organizationId },
    include: {
      _count: { select: { drivers: true } },
      walletLogs: { take: 5, orderBy: { createdAt: "desc" } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Delivery Partners & Logistics Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure 3rd-party logistics providers, fee structures, reconciliation rules, and driver wallet balances.
        </p>
      </div>

      <PartnersClient partners={partners as any} />
    </div>
  );
}
