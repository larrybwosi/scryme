import { notFound } from 'next/navigation';
import { getCustomerById } from '../../../lib/mock-data';
import { CustomerDetailView } from './_components/customer-detail-view';

interface CustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id } = await params;
  const customer = getCustomerById(id);
  if (!customer) notFound();
  return <CustomerDetailView customer={customer} />;
}
