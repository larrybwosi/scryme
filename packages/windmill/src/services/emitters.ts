import { triggerWorkflow } from "./workflows";
import { runAutomation } from "./service";

// Dynamically imported to avoid circular dependencies in some environments
// but since this is server-side and within the same workspace, we can try relative or alias
// For now, we use a generic approach or emit to a handler that knows about Dealio workflows.

/**
 * Specialized emitters for Bakery-related Windmill automations.
 */

export async function emitBakeryDailyGenerator(organizationId: string) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/bakery/daily-generator",
    data: { organizationId },
    dealioEventType: "bakery.daily.generator.manual",
  });
}

export async function emitBakeryStaleCleanup(
  organizationId: string,
  gracePeriodHours: string = "4",
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/bakery/stale-cleanup",
    data: { organizationId, gracePeriodHours },
    dealioEventType: "bakery.stale.cleanup.manual",
  });
}

export async function emitBakeryWasteReport(organizationId: string) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/bakery/waste-report",
    data: { organizationId },
    dealioEventType: "bakery.waste.report.manual",
  });
}

export async function emitBakeryBatchDisposalRequested(
  organizationId: string,
  data: {
    batchId: string;
    batchNumber: string;
    recipeName: string;
    expirationStatus: string;
    expiresAt: string;
    location?: string | null;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/bakery/expiry-monitor-hitl",
    data: {
      action: "check-expiration",
      organizationId,
      ...data,
    },
    dealioEventType: "bakery.batch.disposal.requested",
  });
}

export async function emitBakeryBatchCreated(
  organizationId: string,
  data: {
    batchId: string;
    batchNumber: string;
    recipeName: string;
    plannedQuantity: number;
    unit: string;
    scheduledStartAt: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/bakery/batch_created",
    data,
    dealioEventType: "bakery.batch.created",
  });
}

export async function emitBakeryBatchStarted(
  organizationId: string,
  data: {
    batchId: string;
    batchNumber: string;
    recipeName: string;
    plannedQuantity: number;
    unit: string;
    leadBaker: string;
    scheduledStartAt: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/bakery/batch_started",
    data,
    dealioEventType: "bakery.batch.started",
  });
}

export async function emitBakeryBatchCompleted(
  organizationId: string,
  data: {
    batchId: string;
    batchNumber: string;
    recipeName: string;
    actualQuantity: number;
    wasteQuantity: number;
    unit: string;
    completedAt: string;
    expiresAt?: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/bakery/batch_completed",
    data,
    dealioEventType: "bakery.batch.completed",
  });
}

export async function emitBakeryBatchCancelled(
  organizationId: string,
  data: {
    batchId: string;
    batchNumber: string;
    recipeName: string;
    cancelledAt: string;
    reason?: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/bakery/batch_cancelled",
    data,
    dealioEventType: "bakery.batch.cancelled",
  });
}

/**
 * Specialized emitters for Core-related Windmill automations.
 */

export async function emitStockLowAlert(
  organizationId: string,
  data: {
    stockItemId: string;
    productName: string;
    currentQuantity: number;
    reorderPoint: number;
    warehouseId?: string;
  },
) {
  // Trigger internal Dealio workflow if configured
  try {
    await triggerWorkflow(organizationId, "STOCK_LOW", data);
  } catch (e) {
    console.error("Failed to trigger internal workflow for STOCK_LOW", e);
  }

  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/core/low-stock-alert",
    data,
    dealioEventType: "stock.alert.low",
  });
}

export async function emitStockExpired(
  organizationId: string,
  data: {
    batchId: string;
    variantName: string;
    quantity: number;
    expiredAt: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/core/stock-expired",
    data,
    dealioEventType: "stock.expired",
  });
}

export async function emitBusinessInsightReport(
  organizationId: string,
  data: {
    reportName: string;
    period: string;
    summary: any;
    topProducts: any[];
    lowStockItems: any[];
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/core/business-insight-feed",
    data,
    dealioEventType: "report.business.insights",
  });
}

export async function emitExpenseApprovalRequested(
  organizationId: string,
  data: {
    expenseId: string;
    expenseNumber: string;
    requestedBy: string;
    amount: number;
    currency: string;
    description: string;
    category?: string;
    receiptUrl?: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/core/expense-approval",
    data,
    dealioEventType: "expense.approval.requested",
  });
}

export async function emitPurchaseApprovalRequested(
  organizationId: string,
  data: {
    purchaseOrderId: string;
    orderNumber: string;
    requestedBy: string;
    totalAmount: number;
    currency: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/core/purchase-approval",
    data,
    dealioEventType: "purchase.approval.requested",
  });
}

/**
 * Specialized emitters for Finance-related Windmill automations.
 */

export async function emitBudgetThresholdExceeded(
  organizationId: string,
  data: {
    budgetId: string;
    budgetName: string;
    amountUsed: number;
    totalBudget: number;
    currency: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/finance/budget-exceeded",
    data,
    dealioEventType: "finance.budget.exceeded",
  });
}

export async function emitLargeTransaction(
  organizationId: string,
  data: {
    transactionId: string;
    amount: number;
    currency: string;
    type: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/finance/high-value-alert",
    data,
    dealioEventType: "finance.transaction.large",
  });
}

export async function emitExpenseCreated(
  organizationId: string,
  data: {
    expenseId: string;
    expenseNumber: string;
    amount: number;
    currency: string;
    description: string;
    category?: string;
    receiptUrl?: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/core/expense-created",
    data,
    dealioEventType: "expense.created",
  });
}

export async function emitAuditConfigChanged(
  organizationId: string,
  data: {
    entityType: string;
    entityId: string;
    action: "CREATE" | "UPDATE" | "DELETE";
    changedBy: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/audit/config_changed",
    data,
    dealioEventType: "audit.config.changed",
  });
}

export async function emitStockRequestCreated(
  organizationId: string,
  data: {
    requestId: string;
    requestNumber: string;
    requestedBy: string;
    totalCost: number;
    items?: { variantName: string; quantity: number }[];
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/core/stock-request",
    data,
    dealioEventType: "stock.request.created",
  });
}

export async function emitStockTransferCreated(
  organizationId: string,
  data: {
    transferId: string;
    transferNumber: string;
    fromLocation: string;
    toLocation: string;
    priority: string;
    items: { variantName: string; quantity: number }[];
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/core/stock-transfer-created",
    data,
    dealioEventType: "stock.transfer.created",
  });
}

export async function emitStockTransferShipped(
  organizationId: string,
  data: {
    transferId: string;
    transferNumber: string;
    shippedAt: string;
    carrier?: string;
    trackingNumber?: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/core/stock-transfer-shipped",
    data,
    dealioEventType: "stock.transfer.shipped",
  });
}

export async function emitStockTransferReceived(
  organizationId: string,
  data: {
    transferId: string;
    transferNumber: string;
    receivedAt: string;
    receivedBy: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/core/stock-transfer-received",
    data,
    dealioEventType: "stock.transfer.received",
  });
}

export async function emitStockAdjustment(
  organizationId: string,
  data: {
    adjustmentId: string;
    variantName: string;
    locationName: string;
    quantity: number;
    reason: string;
    notes?: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/core/stock-adjustment",
    data,
    dealioEventType: "stock.adjustment.created",
  });
}

/**
 * Specialized emitters for Auth and Member management.
 */

export async function emitMemberCreated(
  organizationId: string,
  data: {
    memberId: string;
    name: string;
    email: string;
    role: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/member_created",
    data,
    dealioEventType: "member.created",
  });
}

export async function emitMemberRoleChanged(
  organizationId: string,
  data: {
    memberId: string;
    name: string;
    email: string;
    previousRole: string;
    newRole: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/member_role_changed",
    data,
    dealioEventType: "member.role.changed",
  });
}

/**
 * Specialized emitters for CRM.
 */

export async function emitCrmRecordCreated(
  organizationId: string,
  data: {
    recordId: string;
    entityType: string;
    name: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/crm/record_created",
    data,
    dealioEventType: "crm.record.created",
  });
}

export async function emitCrmRecordUpdated(
  organizationId: string,
  data: {
    recordId: string;
    entityType: string;
    name: string;
    changes: any;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/crm/record_updated",
    data,
    dealioEventType: "crm.record.updated",
  });
}

/**
 * Specialized emitters for Sales and Orders.
 */

export async function emitOrderPlaced(
  organizationId: string,
  data: {
    orderId: string;
    orderNumber: string;
    customerId?: string;
    totalAmount: number;
    currency: string;
    items: { productName: string; quantity: number; lineTotal: number }[];
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/order_placed",
    data,
    dealioEventType: "order.placed",
  });
}

export async function emitPaymentCompleted(
  organizationId: string,
  data: {
    transactionId: string;
    amount: number;
    currency: string;
    method: string;
    reference?: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/payment_completed",
    data,
    dealioEventType: "payment.completed",
  });
}

/**
 * Specialized emitters for Loyalty.
 */

export async function emitLoyaltyPointsAwarded(
  organizationId: string,
  data: {
    customerId: string;
    points: number;
    balanceAfter: number;
    description: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/loyalty/points_awarded",
    data,
    dealioEventType: "loyalty.points.awarded",
  });
}

export async function emitLoyaltyVoucherCreated(
  organizationId: string,
  data: {
    customerId: string;
    voucherCode: string;
    rewardName: string;
    expiresAt: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/loyalty/voucher_created",
    data,
    dealioEventType: "loyalty.voucher.created",
  });
}

/**
 * Generic customer created emitter for Windmill.
 */
export async function emitCustomerCreated(
  organizationId: string,
  data: {
    customerId: string;
    name: string;
    email?: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/customer_created",
    data: {
      ...data,
      eventType: "customer.created",
    },
    dealioEventType: "customer.created",
  });
}

export async function emitCustomerSynced(
  organizationId: string,
  data: {
    customerId: string;
    name: string;
    email?: string;
    action: "created" | "updated";
    provider: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/customer_synced",
    data,
    dealioEventType: "customer.synced",
  });
}

export async function emitBakeryBatchExpiring(
  organizationId: string,
  data: {
    batchId: string;
    batchNumber: string;
    recipeName: string;
    expiresAt: string;
    daysRemaining: number;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/bakery/batch_expiring",
    data,
    dealioEventType: "bakery.batch.expiring",
  });
}

export async function emitBakeryBatchExpired(
  organizationId: string,
  data: {
    batchId: string;
    batchNumber: string;
    recipeName: string;
    expiredAt: string;
  },
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/bakery/batch_expired",
    data,
    dealioEventType: "bakery.batch.expired",
  });
}

/**
 * Generic event emitter for Windmill.
 */
export async function emitEvent(
  organizationId: string,
  eventType: string,
  data: any,
) {
  return runAutomation({
    organizationId,
    scriptPath: "f/dealio/generic-event-handler",
    data: {
      ...data,
      eventType,
    },
    dealioEventType: eventType,
  });
}

/**
 * Placeholder for other emitters that were in the legacy automation engine but not yet fully mapped in Windmill.
 */
export async function emitMemberDeactivated(organizationId: string, data: any) {
  return emitEvent(organizationId, "member.deactivated", data);
}

export async function emitInvoiceOverdue(organizationId: string, data: any) {
  // Trigger internal Dealio workflow if configured
  try {
    await triggerWorkflow(organizationId, "INVOICE_OVERDUE", data);
  } catch (e) {
    console.error("Failed to trigger internal workflow for INVOICE_OVERDUE", e);
  }

  return emitEvent(organizationId, "invoice.overdue", data);
}

export async function emitDealPriceListUpdated(
  organizationId: string,
  data: any,
) {
  return emitEvent(organizationId, "deal.pricelist.updated", data);
}

export async function emitAuditSecurityAlert(
  organizationId: string,
  data: any,
) {
  return emitEvent(organizationId, "audit.security.alert", data);
}

export async function emitReportAuditLog(organizationId: string, data: any) {
  return emitEvent(organizationId, "report.audit.log", data);
}
