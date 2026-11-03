import { Injectable, Logger, BadRequestException, NotFoundException } from "@nestjs/common";
import { db } from "@repo/db";

export interface StageDraftInput {
  organizationId: string;
  entityType: "PRODUCT" | "PRICE" | "ORDER" | "FULFILLMENT" | "STAFF_TASK";
  action: "CREATE" | "UPDATE" | "STATUS_CHANGE";
  summary: string;
  payload: Record<string, any>;
  targetId?: string;
  createdById?: string;
}

@Injectable()
export class McpDraftService {
  private readonly logger = new Logger(McpDraftService.name);

  /**
   * Stage a new draft change set with computed previousState and diffSummary
   */
  async stageDraft(input: StageDraftInput) {
    const { organizationId, entityType, action, summary, payload, targetId, createdById } = input;

    let previousState: any = null;
    let diffSummary: any = null;

    if (action === "UPDATE" || action === "STATUS_CHANGE") {
      if (!targetId) {
        throw new BadRequestException(`targetId is required for ${action} action`);
      }
      previousState = await this.fetchCurrentEntityState(entityType, targetId, organizationId);
      if (!previousState) {
        throw new NotFoundException(`Target ${entityType} '${targetId}' not found in this organization`);
      }
      diffSummary = this.calculateDiff(previousState, payload);
    } else if (action === "CREATE") {
      diffSummary = {
        operation: "CREATE",
        fields: Object.keys(payload).map((k) => ({ field: k, from: null, to: payload[k] })),
      };
    }

    const draft = await db.mcpDraftChange.create({
      data: {
        organizationId,
        entityType,
        action,
        status: "DRAFT",
        targetId: targetId || null,
        summary,
        payload,
        previousState: previousState ? JSON.parse(JSON.stringify(previousState)) : null,
        diffSummary: diffSummary ? JSON.parse(JSON.stringify(diffSummary)) : null,
        createdById: createdById || null,
      },
    });

    this.logger.log(`Created MCP draft id=${draft.id} type=${entityType} action=${action} orgId=${organizationId}`);

    return {
      draftId: draft.id,
      status: draft.status,
      entityType: draft.entityType,
      action: draft.action,
      summary: draft.summary,
      targetId: draft.targetId,
      diff: draft.diffSummary,
      createdAt: draft.createdAt,
      message: "Draft created successfully. Inspect with get_draft_diff and execute with publish_draft(confirm: true).",
    };
  }

  /**
   * List drafts for an organization with optional status and entityType filters
   */
  async listDrafts(organizationId: string, filter?: { status?: string; entityType?: string; limit?: number }) {
    const limit = Math.min(Math.max(Number(filter?.limit) || 20, 1), 100);
    const where: any = { organizationId };

    if (filter?.status) {
      where.status = filter.status.trim().toUpperCase();
    }
    if (filter?.entityType) {
      where.entityType = filter.entityType.trim().toUpperCase();
    }

    const drafts = await db.mcpDraftChange.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        entityType: true,
        action: true,
        status: true,
        targetId: true,
        summary: true,
        createdAt: true,
        appliedAt: true,
        revertedAt: true,
        discardedAt: true,
      },
    });

    return {
      count: drafts.length,
      drafts,
    };
  }

  /**
   * Retrieve full details and before/after diff for a specific draft
   */
  async getDraftDiff(draftId: string, organizationId: string) {
    if (!draftId) throw new BadRequestException("draftId is required");

    const draft = await db.mcpDraftChange.findFirst({
      where: { id: draftId, organizationId },
    });

    if (!draft) {
      throw new NotFoundException(`Draft '${draftId}' not found in this organization`);
    }

    return {
      id: draft.id,
      entityType: draft.entityType,
      action: draft.action,
      status: draft.status,
      targetId: draft.targetId,
      summary: draft.summary,
      payload: draft.payload,
      previousState: draft.previousState,
      diffSummary: draft.diffSummary,
      createdAt: draft.createdAt,
      appliedAt: draft.appliedAt,
      revertedAt: draft.revertedAt,
      discardedAt: draft.discardedAt,
    };
  }

  /**
   * Publish a draft live to database tables inside an ACID transaction
   */
  async publishDraft(draftId: string, organizationId: string, confirm: boolean) {
    if (!draftId) throw new BadRequestException("draftId is required");
    if (!confirm) {
      throw new BadRequestException("Explicit confirmation required: set 'confirm: true' to apply this draft live");
    }

    const draft = await db.mcpDraftChange.findFirst({
      where: { id: draftId, organizationId },
    });

    if (!draft) {
      throw new NotFoundException(`Draft '${draftId}' not found in this organization`);
    }

    if (draft.status !== "DRAFT") {
      throw new BadRequestException(`Draft cannot be published because its current status is '${draft.status}'`);
    }

    const payload = (draft.payload as Record<string, any>) || {};

    let executedResult: any;

    await db.$transaction(async (tx) => {
      switch (draft.entityType) {
        case "PRODUCT": {
          if (draft.action === "CREATE") {
            executedResult = await this.applyCreateProduct(tx, organizationId, payload);
          } else if (draft.action === "UPDATE") {
            executedResult = await this.applyUpdateProduct(tx, organizationId, draft.targetId!, payload);
          }
          break;
        }

        case "PRICE": {
          if (draft.action === "UPDATE") {
            executedResult = await this.applyUpdatePrice(tx, organizationId, draft.targetId!, payload);
          }
          break;
        }

        case "ORDER": {
          if (draft.action === "CREATE") {
            executedResult = await this.applyCreateOrder(tx, organizationId, payload);
          } else if (draft.action === "STATUS_CHANGE") {
            executedResult = await this.applyUpdateOrderStatus(tx, organizationId, draft.targetId!, payload);
          }
          break;
        }

        case "FULFILLMENT": {
          executedResult = await this.applyFulfillOrder(tx, organizationId, draft.targetId!, payload);
          break;
        }

        case "STAFF_TASK": {
          if (draft.action === "CREATE") {
            executedResult = await this.applyCreateStaffTask(tx, organizationId, payload);
          } else if (draft.action === "UPDATE") {
            executedResult = await this.applyAssignStaffTask(tx, organizationId, draft.targetId!, payload);
          } else if (draft.action === "STATUS_CHANGE") {
            executedResult = await this.applyUpdateStaffTaskStatus(tx, organizationId, draft.targetId!, payload);
          }
          break;
        }

        default:
          throw new BadRequestException(`Unsupported draft entity type: ${draft.entityType}`);
      }

      await tx.mcpDraftChange.update({
        where: { id: draft.id },
        data: {
          status: "APPLIED",
          targetId: executedResult?.id || draft.targetId,
          appliedAt: new Date(),
        },
      });
    });

    this.logger.log(`Published MCP draft id=${draft.id} orgId=${organizationId}`);

    return {
      success: true,
      draftId: draft.id,
      status: "APPLIED",
      result: executedResult,
      message: `Draft successfully published and applied live.`,
    };
  }

  /**
   * Revert an already applied draft using stored previousState snapshot
   */
  async revertDraft(draftId: string, organizationId: string, confirm: boolean) {
    if (!draftId) throw new BadRequestException("draftId is required");
    if (!confirm) {
      throw new BadRequestException("Explicit confirmation required: set 'confirm: true' to revert this change");
    }

    const draft = await db.mcpDraftChange.findFirst({
      where: { id: draftId, organizationId },
    });

    if (!draft) {
      throw new NotFoundException(`Draft '${draftId}' not found in this organization`);
    }

    if (draft.status !== "APPLIED") {
      throw new BadRequestException(`Only APPLIED drafts can be reverted (current status: ${draft.status})`);
    }

    const previousState = draft.previousState as Record<string, any> | null;
    const targetId = draft.targetId;

    await db.$transaction(async (tx) => {
      switch (draft.entityType) {
        case "PRODUCT": {
          if (draft.action === "CREATE" && targetId) {
            await tx.product.updateMany({
              where: { id: targetId, organizationId },
              data: { isArchived: true, isActive: false },
            });
          } else if (draft.action === "UPDATE" && targetId && previousState) {
            await tx.product.updateMany({
              where: { id: targetId, organizationId },
              data: {
                name: previousState.name,
                description: previousState.description,
                isActive: previousState.isActive,
                categoryId: previousState.categoryId,
              },
            });
          }
          break;
        }

        case "PRICE": {
          if (draft.action === "UPDATE" && targetId && previousState) {
            await tx.productVariant.updateMany({
              where: { id: targetId, product: { organizationId } },
              data: {
                retailPrice: previousState.retailPrice !== undefined ? previousState.retailPrice : undefined,
                wholesalePrice: previousState.wholesalePrice !== undefined ? previousState.wholesalePrice : undefined,
                buyingPrice: previousState.buyingPrice !== undefined ? previousState.buyingPrice : undefined,
              },
            });
          }
          break;
        }

        case "ORDER": {
          if (draft.action === "CREATE" && targetId) {
            await tx.transaction.updateMany({
              where: { id: targetId, organizationId },
              data: { status: "CANCELLED", cancelledAt: new Date() },
            });
          } else if (draft.action === "STATUS_CHANGE" && targetId && previousState) {
            await tx.transaction.updateMany({
              where: { id: targetId, organizationId },
              data: { status: previousState.status },
            });
          }
          break;
        }

        case "FULFILLMENT": {
          if (targetId) {
            await tx.fulfillment.updateMany({
              where: { id: targetId, transaction: { organizationId } },
              data: { status: "CANCELLED" },
            });
          }
          break;
        }

        case "STAFF_TASK": {
          if (draft.action === "CREATE" && targetId) {
            await tx.staffTask.updateMany({
              where: { id: targetId, organizationId },
              data: { status: "CANCELLED" as any },
            });
          } else if (draft.action === "UPDATE" && targetId && previousState) {
            await tx.staffTask.updateMany({
              where: { id: targetId, organizationId },
              data: { memberId: previousState.memberId },
            });
          } else if (draft.action === "STATUS_CHANGE" && targetId && previousState) {
            await tx.staffTask.updateMany({
              where: { id: targetId, organizationId },
              data: { status: previousState.status },
            });
          }
          break;
        }

        default:
          throw new BadRequestException(`Cannot revert unsupported entity type: ${draft.entityType}`);
      }

      await tx.mcpDraftChange.update({
        where: { id: draft.id },
        data: {
          status: "REVERTED",
          revertedAt: new Date(),
        },
      });
    });

    this.logger.log(`Reverted MCP draft id=${draft.id} orgId=${organizationId}`);

    return {
      success: true,
      draftId: draft.id,
      status: "REVERTED",
      message: `Draft successfully reverted to its previous state.`,
    };
  }

  /**
   * Discard a pending draft
   */
  async discardDraft(draftId: string, organizationId: string) {
    if (!draftId) throw new BadRequestException("draftId is required");

    const draft = await db.mcpDraftChange.findFirst({
      where: { id: draftId, organizationId },
    });

    if (!draft) {
      throw new NotFoundException(`Draft '${draftId}' not found in this organization`);
    }

    if (draft.status !== "DRAFT") {
      throw new BadRequestException(`Only drafts in DRAFT status can be discarded (current: ${draft.status})`);
    }

    const updated = await db.mcpDraftChange.update({
      where: { id: draft.id },
      data: {
        status: "DISCARDED",
        discardedAt: new Date(),
      },
    });

    return {
      success: true,
      draftId: updated.id,
      status: updated.status,
      message: "Draft was discarded successfully.",
    };
  }

  // --- Entity Apply Logic ---

  private async applyCreateProduct(tx: any, organizationId: string, payload: Record<string, any>) {
    const { name, sku, categoryId, description, barcode, variants } = payload;
    if (!name || !sku || !categoryId) {
      throw new BadRequestException("name, sku, and categoryId are required to create product");
    }

    // Verify category belongs to organization
    const category = await tx.category.findFirst({
      where: { id: categoryId, organizationId },
    });
    if (!category) {
      throw new NotFoundException(`Category '${categoryId}' not found in organization`);
    }

    const initialVariants = Array.isArray(variants) && variants.length > 0
      ? variants
      : [{ name: "Standard", sku: `${sku}-STD`, buyingPrice: 0, retailPrice: 0 }];

    const product = await tx.product.create({
      data: {
        organizationId,
        name: name.trim(),
        sku: sku.trim(),
        categoryId,
        description: description || null,
        barcode: barcode || null,
        variants: {
          create: initialVariants.map((v: any) => ({
            name: v.name || "Standard",
            sku: v.sku || `${sku}-${Date.now().toString().slice(-4)}`,
            buyingPrice: v.buyingPrice || 0,
            retailPrice: v.retailPrice || 0,
            wholesalePrice: v.wholesalePrice || null,
            attributes: v.attributes || {},
          })),
        },
      },
      include: { variants: true, category: true },
    });

    return product;
  }

  private async applyUpdateProduct(tx: any, organizationId: string, productId: string, payload: Record<string, any>) {
    const existing = await tx.product.findFirst({
      where: { id: productId, organizationId },
    });
    if (!existing) {
      throw new NotFoundException(`Product '${productId}' not found in organization`);
    }

    const updateData: any = {};
    if (payload.name !== undefined) updateData.name = payload.name.trim();
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.isActive !== undefined) updateData.isActive = Boolean(payload.isActive);
    if (payload.categoryId !== undefined) {
      const category = await tx.category.findFirst({
        where: { id: payload.categoryId, organizationId },
      });
      if (!category) throw new NotFoundException(`Category '${payload.categoryId}' not found`);
      updateData.categoryId = payload.categoryId;
    }

    return tx.product.update({
      where: { id: productId },
      data: updateData,
    });
  }

  private async applyUpdatePrice(tx: any, organizationId: string, variantId: string, payload: Record<string, any>) {
    const variant = await tx.productVariant.findFirst({
      where: { id: variantId, product: { organizationId } },
      include: { product: true },
    });

    if (!variant) {
      throw new NotFoundException(`Product variant '${variantId}' not found in organization`);
    }

    const updateData: any = {};
    if (payload.retailPrice !== undefined) updateData.retailPrice = Number(payload.retailPrice);
    if (payload.wholesalePrice !== undefined) updateData.wholesalePrice = Number(payload.wholesalePrice);
    if (payload.buyingPrice !== undefined) updateData.buyingPrice = Number(payload.buyingPrice);

    return tx.productVariant.update({
      where: { id: variantId },
      data: updateData,
    });
  }

  private async applyCreateOrder(tx: any, organizationId: string, payload: Record<string, any>) {
    const { customerId, locationId, items, notes } = payload;
    if (!locationId || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestException("locationId and items array are required to create an order");
    }

    const location = await tx.inventoryLocation.findFirst({
      where: { id: locationId, organizationId },
    });
    if (!location) throw new NotFoundException(`Location '${locationId}' not found`);

    if (customerId) {
      const customer = await tx.customer.findFirst({
        where: { id: customerId, organizationId },
      });
      if (!customer) throw new NotFoundException(`Customer '${customerId}' not found`);
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    let subtotal = 0;

    const lineItemsData = items.map((item: any) => {
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const lineTotal = qty * unitPrice;
      subtotal += lineTotal;
      return {
        variantId: item.variantId || null,
        productName: item.productName || "Product",
        quantity: qty,
        unitPrice,
        lineTotal,
      };
    });

    const order = await tx.transaction.create({
      data: {
        number: orderNumber,
        type: "SALES_ORDER",
        channel: "MANUAL_ENTRY",
        status: "CONFIRMED",
        paymentStatus: "UNPAID",
        organizationId,
        locationId,
        customerId: customerId || null,
        subtotal,
        finalTotal: subtotal,
        termsAndConditions: notes || null,
        items: {
          create: lineItemsData,
        },
      },
      include: { items: true, customer: true },
    });

    return order;
  }

  private async applyUpdateOrderStatus(tx: any, organizationId: string, transactionId: string, payload: Record<string, any>) {
    const { status } = payload;
    if (!status) throw new BadRequestException("status parameter is required");

    const transaction = await tx.transaction.findFirst({
      where: {
        organizationId,
        OR: [{ id: transactionId }, { number: transactionId }],
      },
    });

    if (!transaction) throw new NotFoundException(`Transaction '${transactionId}' not found`);

    return tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: status.toUpperCase(),
        ...(status.toUpperCase() === "COMPLETED" ? { completedAt: new Date() } : {}),
        ...(status.toUpperCase() === "CANCELLED" ? { cancelledAt: new Date() } : {}),
      },
    });
  }

  private async applyFulfillOrder(tx: any, organizationId: string, transactionId: string, payload: Record<string, any>) {
    const transaction = await tx.transaction.findFirst({
      where: {
        organizationId,
        OR: [{ id: transactionId }, { number: transactionId }],
      },
      include: { items: true },
    });

    if (!transaction) throw new NotFoundException(`Transaction '${transactionId}' not found`);

    const fulfillment = await tx.fulfillment.create({
      data: {
        transactionId: transaction.id,
        type: payload.type || "DELIVERY",
        status: payload.status || "COMPLETED",
        trackingNumber: payload.trackingNumber || null,
        deliveryNotes: payload.notes || null,
      },
    });

    await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    return fulfillment;
  }

  private async applyCreateStaffTask(tx: any, organizationId: string, payload: Record<string, any>) {
    const { title, description, priority, dueDate, memberId, locationId } = payload;
    if (!title) throw new BadRequestException("Task title is required");

    if (memberId) {
      const member = await tx.member.findFirst({
        where: { id: memberId, organizationId },
      });
      if (!member) throw new NotFoundException(`Staff member '${memberId}' not found in organization`);
    }

    return tx.staffTask.create({
      data: {
        organizationId,
        title: title.trim(),
        description: description || null,
        priority: priority ? priority.toUpperCase() : "MEDIUM",
        status: "TODO",
        dueDate: dueDate ? new Date(dueDate) : null,
        memberId: memberId || null,
        locationId: locationId || null,
      },
      include: { member: { select: { id: true, user: { select: { name: true, email: true } } } } },
    });
  }

  private async applyAssignStaffTask(tx: any, organizationId: string, taskId: string, payload: Record<string, any>) {
    const { memberId } = payload;
    if (!memberId) throw new BadRequestException("memberId is required");

    const task = await tx.staffTask.findFirst({
      where: { id: taskId, organizationId },
    });
    if (!task) throw new NotFoundException(`Staff task '${taskId}' not found`);

    const member = await tx.member.findFirst({
      where: { id: memberId, organizationId },
    });
    if (!member) throw new NotFoundException(`Member '${memberId}' not found`);

    return tx.staffTask.update({
      where: { id: taskId },
      data: { memberId },
      include: { member: { select: { id: true, user: { select: { name: true, email: true } } } } },
    });
  }

  private async applyUpdateStaffTaskStatus(tx: any, organizationId: string, taskId: string, payload: Record<string, any>) {
    const { status } = payload;
    if (!status) throw new BadRequestException("status is required");

    const task = await tx.staffTask.findFirst({
      where: { id: taskId, organizationId },
    });
    if (!task) throw new NotFoundException(`Staff task '${taskId}' not found`);

    return tx.staffTask.update({
      where: { id: taskId },
      data: { status: status.toUpperCase() },
    });
  }

  // --- Helpers ---

  private async fetchCurrentEntityState(entityType: string, targetId: string, organizationId: string) {
    switch (entityType) {
      case "PRODUCT":
        return db.product.findFirst({
          where: { id: targetId, organizationId },
          select: { id: true, name: true, sku: true, description: true, isActive: true, categoryId: true },
        });

      case "PRICE":
        return db.productVariant.findFirst({
          where: { id: targetId, product: { organizationId } },
          select: { id: true, name: true, sku: true, retailPrice: true, wholesalePrice: true, buyingPrice: true },
        });

      case "ORDER":
        return db.transaction.findFirst({
          where: { organizationId, OR: [{ id: targetId }, { number: targetId }] },
          select: { id: true, number: true, status: true, paymentStatus: true, finalTotal: true },
        });

      case "STAFF_TASK":
        return db.staffTask.findFirst({
          where: { id: targetId, organizationId },
          select: { id: true, title: true, status: true, priority: true, memberId: true },
        });

      default:
        return null;
    }
  }

  private calculateDiff(previous: Record<string, any>, payload: Record<string, any>) {
    const fields: Array<{ field: string; from: any; to: any }> = [];

    for (const key of Object.keys(payload)) {
      if (previous[key] !== undefined && previous[key] !== payload[key]) {
        fields.push({
          field: key,
          from: previous[key],
          to: payload[key],
        });
      }
    }

    return {
      operation: "UPDATE",
      fields,
    };
  }
}
