import "server-only";
import { db as prisma } from "@repo/db";
import * as crypto from "crypto";

export interface AutomationExecutionOptions {
  organizationId: string;
  scriptPath: string;
  data?: any;
  correlationId?: string;
  dealioEventType?: string;
}

/**
 * Primary helper for triggering workflow executions in the platform custom automation engine.
 */
export async function runAutomation(options: AutomationExecutionOptions): Promise<string> {
  const {
    organizationId,
    scriptPath,
    data,
    correlationId = crypto.randomUUID(),
  } = options;

  let definition = await (prisma as any).workflowEngineDefinition.findUnique({
    where: {
      organizationId_key: {
        organizationId,
        key: scriptPath,
      },
    },
  });

  if (!definition) {
    definition = await (prisma as any).workflowEngineDefinition.create({
      data: {
        organizationId,
        key: scriptPath,
        name: scriptPath,
        triggerType: "MANUAL",
        config: data || {},
        isActive: true,
      },
    });
  }

  const execution = await (prisma as any).workflowEngineExecution.create({
    data: {
      organizationId,
      definitionId: definition.id,
      triggerEvent: scriptPath,
      correlationId,
      status: "RUNNING",
      payload: data || {},
      startedAt: new Date(),
    },
  });

  await (prisma as any).workflowEngineJob.create({
    data: {
      organizationId,
      executionId: execution.id,
      definitionId: definition.id,
      handler: scriptPath,
      payload: data || {},
      status: "QUEUED",
    },
  });

  return execution.id;
}

export async function emitCustomerCreated(
  organizationId: string,
  data: { customerId: string; name: string; email?: string },
) {
  return runAutomation({
    organizationId,
    scriptPath: "customer_created",
    data: { ...data, eventType: "customer.created" },
    dealioEventType: "customer.created",
  });
}

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
    scriptPath: "order_placed",
    data,
    dealioEventType: "order.placed",
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
    scriptPath: "stock_adjustment",
    data,
    dealioEventType: "stock.adjustment.created",
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
    scriptPath: "purchase_approval_requested",
    data,
    dealioEventType: "purchase.approval.requested",
  });
}

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
    scriptPath: "member_created",
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
    scriptPath: "member_role_changed",
    data,
    dealioEventType: "member.role.changed",
  });
}

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
    scriptPath: "crm_record_created",
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
    scriptPath: "crm_record_updated",
    data,
    dealioEventType: "crm.record.updated",
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
    scriptPath: "stock_transfer_created",
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
    scriptPath: "stock_transfer_shipped",
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
    scriptPath: "stock_transfer_received",
    data,
    dealioEventType: "stock.transfer.received",
  });
}

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
    scriptPath: "loyalty_points_awarded",
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
    scriptPath: "loyalty_voucher_created",
    data,
    dealioEventType: "loyalty.voucher.created",
  });
}

export async function emitEvent(
  organizationId: string,
  eventType: string,
  data: any,
) {
  return runAutomation({
    organizationId,
    scriptPath: eventType,
    data: { ...data, eventType },
    dealioEventType: eventType,
  });
}
