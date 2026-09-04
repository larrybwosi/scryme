import { Metadata } from "next";
import { ReceiptText, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FilterBar } from "@/components/filter-bar";
import { getTransactions } from "../../actions/sales";
import { getLocations } from "../../actions/locations";
import {
  TransactionType,
  TransactionStatus,
  PaymentStatus,
} from "@repo/db/client";
import { getOrganizationContext } from "@/app/actions/auth";
import { RealtimeTransactionWrapper } from "@/components/sales/realtime-transaction-wrapper";
import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { db } from "@repo/db";

export const metadata: Metadata = {
  title: "Sales Transactions",
  description: "Browse order history, transaction status, receipt printouts, and payment modes.",
};


async function TransactionList({
  searchParams,
  organizationId,
  invoiceConfigUpdatedAt,
  receiptConfigUpdatedAt,
}: {
  searchParams: {
    q?: string;
    type?: string;
    status?: string;
    paymentStatus?: string;
    locationId?: string;
    sortBy?: string;
    startDate?: string;
    endDate?: string;
  };
  organizationId?: string;
  invoiceConfigUpdatedAt?: string;
  receiptConfigUpdatedAt?: string;
}) {
  const transactions = await getTransactions({
    search: searchParams.q,
    type: searchParams.type as TransactionType | "all",
    status: searchParams.status as TransactionStatus | "all",
    paymentStatus: searchParams.paymentStatus as PaymentStatus | "all",
    locationId: searchParams.locationId,
    sortBy: searchParams.sortBy,
    startDate: searchParams.startDate ? new Date(searchParams.startDate) : undefined,
    endDate: searchParams.endDate ? new Date(searchParams.endDate) : undefined,
  });

  return (
    <RealtimeTransactionWrapper
      initialTransactions={transactions}
      organizationId={organizationId}
      invoiceConfigUpdatedAt={invoiceConfigUpdatedAt}
      receiptConfigUpdatedAt={receiptConfigUpdatedAt}
    />
  );
}

function TableFallback() {
  return (
    <div className="space-y-3 w-full">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

export default async function TransactionsPage(props: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
    paymentStatus?: string;
    locationId?: string;
    sortBy?: string;
    startDate?: string;
    endDate?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const context = await getOrganizationContext();
  const suspenseKey = JSON.stringify(searchParams);

  const locations = await getLocations();

  const invoiceConfig = context?.organizationId
    ? await db.invoiceConfig.findUnique({
        where: { organizationId: context.organizationId },
        select: { updatedAt: true },
      })
    : null;

  const receiptConfig = context?.organizationId
    ? await db.receiptConfig.findUnique({
        where: { organizationId: context.organizationId },
        select: { updatedAt: true },
      })
    : null;

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Suspense>
        <PageHeader
          title="Transactions"
          subtitle="Manage sales, quotes, and orders"
          icon={<ReceiptText className="w-7 h-7" />}
          action={{
            label: "New Order",
            href: "/sales/new",
            icon: <Plus className="w-4 h-4" />,
          }}
        />
      </Suspense>
      <FilterBar locations={locations} />

      <Suspense key={suspenseKey} fallback={<TableFallback />}>
        <TransactionList
          searchParams={searchParams}
          organizationId={context?.organizationId}
          invoiceConfigUpdatedAt={invoiceConfig?.updatedAt?.toISOString()}
          receiptConfigUpdatedAt={receiptConfig?.updatedAt?.toISOString()}
        />
      </Suspense>
    </div>
  );
}
