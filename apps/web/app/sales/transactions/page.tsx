import { ReceiptText, Plus } from "lucide-react";
import { PageHeader } from "../../../components/page-header";
import { FilterBar } from "../../../components/filter-bar";
import { getTransactions } from "../../actions/sales";
import {
  TransactionType,
  TransactionStatus,
  PaymentStatus,
} from "@repo/db/client";
import { getOrganizationContext } from "@/app/actions/auth";
import { RealtimeTransactionWrapper } from "../../../components/sales/realtime-transaction-wrapper";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

async function TransactionList({
  searchParams,
  organizationId,
}: {
  searchParams: {
    q?: string;
    type?: string;
    status?: string;
    paymentStatus?: string;
    locationId?: string;
  };
  organizationId?: string;
}) {
  const transactions = await getTransactions({
    search: searchParams.q,
    type: searchParams.type as TransactionType | "all",
    status: searchParams.status as TransactionStatus | "all",
    paymentStatus: searchParams.paymentStatus as PaymentStatus | "all",
    locationId: searchParams.locationId,
  });

  return (
    <RealtimeTransactionWrapper
      initialTransactions={transactions}
      organizationId={organizationId}
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
  }>;
}) {
  const searchParams = await props.searchParams;
  const context = await getOrganizationContext();
  const suspenseKey = JSON.stringify(searchParams);

  return (
    /* Added a responsive outer container:
      - mx-auto centers the layout on ultra-wide displays
      - px-4 sm:px-6 lg:px-8 handles elegant side margins across mobile, tablet, and desktop
      - py-6 handles top/bottom page spacing
      - max-w-7xl (optional) keeps your dashboard content tight and readable
    */
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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

      <FilterBar />

      <Suspense key={suspenseKey} fallback={<TableFallback />}>
        <TransactionList
          searchParams={searchParams}
          organizationId={context?.organizationId}
        />
      </Suspense>
    </div>
  );
}
