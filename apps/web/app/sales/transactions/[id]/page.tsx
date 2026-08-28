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

  // Performance optimization: Parallelize independent invoice and receipt configuration queries
  // to reduce server-side database roundtrips from 2 sequential calls down to 1 concurrent Promise.all call.
  const [invoiceConfig, receiptConfig] = await Promise.all([
    db.invoiceConfig.findUnique({
      where: { organizationId: transaction.organizationId },
      select: { updatedAt: true },
    }),
    db.receiptConfig.findUnique({
      where: { organizationId: transaction.organizationId },
      select: { updatedAt: true },
    }),
  ]);

  return (
    <TransactionDetailClient
      transaction={transaction}
      invoiceConfigUpdatedAt={invoiceConfig?.updatedAt?.toISOString()}
      receiptConfigUpdatedAt={receiptConfig?.updatedAt?.toISOString()}
      organization={organization}
    />
  );
}
