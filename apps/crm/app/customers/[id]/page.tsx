import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCustomer } from "../../actions/customers";
import { CustomerDetailView } from "./_components/customer-detail-view";
import { db } from "@repo/db";
import { getOrganizationContext } from "../../actions/auth";

interface CustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id } = await params;
  const [customer, context] = await Promise.all([
    getCustomer(id),
    getOrganizationContext(),
  ]);
  if (!customer) notFound();

  const settings = context
    ? await db.organizationSettings.findUnique({
        where: { organizationId: context.organizationId },
      })
    : null;
  const currency = settings?.defaultCurrency || "USD";

  return (
    <Suspense fallback={<div>Loading customer details...</div>}>
      <CustomerDetailView customer={customer as any} currency={currency} />
    </Suspense>
  );
}
