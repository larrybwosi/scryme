import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCustomer } from "../../actions/customers";
import { CustomerDetailView } from "./_components/customer-detail-view";

interface CustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  return (
    <Suspense fallback={<div>Loading customer details...</div>}>
      <CustomerDetailView customer={customer as any} />
    </Suspense>
  );
}
