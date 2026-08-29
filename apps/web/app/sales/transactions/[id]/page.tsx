import { Metadata } from "next";
import { getTransactionById } from "../../../actions/sales";
import { getOrganizationSettings } from "../../../actions/organization";
import { db } from "@repo/db";
import { notFound } from "next/navigation";
import { TransactionDetailClient } from "./transaction-detail-client";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [transaction, organization] = await Promise.all([
    getTransactionById(id),
    getOrganizationSettings(),
  ]);

  if (!transaction) {
    notFound();
  }

  // Get configuration timestamps for cache invalidation when downloading documents
  const invoiceConfig = await db.invoiceConfig.findUnique({
    where: { organizationId: transaction.organizationId },
    select: { updatedAt: true },
  });

  const receiptConfig = await db.receiptConfig.findUnique({
    where: { organizationId: transaction.organizationId },
    select: { updatedAt: true },
  });

  return (
    <TransactionDetailClient
      transaction={transaction}
      invoiceConfigUpdatedAt={invoiceConfig?.updatedAt?.toISOString()}
      receiptConfigUpdatedAt={receiptConfig?.updatedAt?.toISOString()}
      organization={organization}
    />
  );
}

export const metadata: Metadata = {
  title: "Transaction Details",
  description: "View sales transaction details, payment logs, tax invoices, and fulfillment status.",
};
