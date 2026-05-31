import { notFound } from 'next/navigation';
import { getCustomer } from '../../actions/customers';
import { CustomerDetailView } from './_components/customer-detail-view';

interface CustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  // Adapt Prisma model to the view's expected format
  const adaptedCustomer = {
    ...customer,
    notes: customer.crmRecord?.notes?.map(n => ({
      id: n.id,
      customerId: customer.id,
      content: n.content,
      author: 'Member', // Placeholder
      authorInitials: 'MB',
      createdAt: n.createdAt.toISOString(),
      pinned: false,
    })) || [],
    deliveries: [], // TODO: Link to deliveries if available
    invoices: customer.invoices?.map((inv: any) => ({
      id: inv.id,
      customerId: customer.id,
      invoiceNumber: inv.invoiceNumber || inv.id.slice(-6).toUpperCase(),
      date: inv.createdAt.toISOString(),
      dueDate: inv.dueDate?.toISOString() || inv.createdAt.toISOString(),
      items: 'Invoice items', // Placeholder
      subtotal: Number(inv.subTotal || inv.netTotal || 0),
      tax: Number(inv.taxAmount || inv.totalTaxes || 0),
      total: Number(inv.totalAmount || inv.grandTotal || 0),
      amountPaid: Number(inv.amountPaid || 0),
      status: inv.status as any,
    })) || [],
    orders: customer.transactions?.map((tx: any) => ({
        id: tx.id,
        customerId: customer.id,
        orderNumber: tx.transactionNumber,
        type: 'POS',
        date: tx.createdAt.toISOString(),
        itemCount: 1,
        items: 'Transaction items',
        subtotal: Number(tx.subtotal),
        discount: Number(tx.discount),
        tax: Number(tx.tax),
        total: Number(tx.total),
        status: 'Completed',
        channel: 'POS',
    })) || [],
    conversations: customer.crmRecord?.activities?.map((a: any) => ({
        id: a.id,
        customerId: customer.id,
        channel: 'Email',
        direction: 'Inbound',
        date: a.createdAt.toISOString(),
        subject: a.type,
        summary: a.description || '',
        loggedBy: 'Member',
        loggedByInitials: 'MB',
    })) || [],
    followUps: [], // TODO: Link to follow-ups
    totalRevenue: customer.transactions?.reduce((sum: number, tx: any) => sum + Number(tx.total || 0), 0) || 0,
    totalOrders: customer.transactions?.length || 0,
    openInvoices: (customer.invoices as any[])?.filter(inv => inv.status !== 'PAID').length || 0,
  };

  return <CustomerDetailView customer={adaptedCustomer as any} />;
}
