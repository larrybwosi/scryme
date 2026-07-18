import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import * as crypto from "crypto";
import { PrismaService } from "@/prisma/prisma.service";
import {
  ApprovalCallbackPayload,
  BakeryDisposalCallbackPayload,
  WindmillCallbackPayload,
  GenericOutcomePayload,
} from "@repo/windmill/server";
import {
  PurchaseStatus,
  ExpenseStatus,
  ExpirationStatus,
  DisposalReason,
  AdjustmentStatus,
} from "@repo/db";

@Injectable()
export class WindmillCallbackUseCase {
  private readonly logger = new Logger(WindmillCallbackUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async verifySignature(
    organizationId: string,
    signature: string,
    payload: any,
  ) {
    const config = await this.prisma.client.windmillConfiguration.findUnique({
      where: { organizationId },
    });

    const secret = config?.webhookSecret;
    const isProduction = process.env.NODE_ENV === "production";

    if (!secret) {
      if (isProduction) {
        this.logger.error(
          `Windmill webhook secret not configured for org ${organizationId} in production`,
        );
        throw new UnauthorizedException("Webhooks disabled: secret missing");
      }
      this.logger.warn(
        `Windmill webhook secret not configured for org ${organizationId}. Skipping verification in dev.`,
      );
      return;
    }

    if (!signature) {
      throw new UnauthorizedException("Missing signature");
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    // Use SHA-256 pre-hashing to ensure both buffers have identical length,
    // preventing timing attacks and leakage of the secret signature length.
    const expectedHash = crypto
      .createHash("sha256")
      .update(expectedSignature)
      .digest();
    const actualHash = crypto
      .createHash("sha256")
      .update(signature || "")
      .digest();

    if (!crypto.timingSafeEqual(expectedHash, actualHash)) {
      this.logger.warn(`Invalid Windmill signature for org ${organizationId}`);
      throw new UnauthorizedException("Invalid signature");
    }
  }

  async handleGeneralCallback(payload: WindmillCallbackPayload) {
    this.logger.log(
      `Processing general Windmill callback for job ${payload.jobId}`,
    );

    const execution = await this.prisma.client.windmillExecution.findUnique({
      where: { jobId: payload.jobId },
    });

    if (!execution) {
      this.logger.warn(`Execution for jobId ${payload.jobId} not found`);
      return { success: false, message: "Execution not found" };
    }

    await this.prisma.client.windmillExecution.update({
      where: { jobId: payload.jobId },
      data: {
        status: payload.status as any,
        result: payload.result ?? undefined,
        error: payload.error ?? null,
        completedAt: new Date(payload.completedAt),
      },
    });

    return { success: true };
  }

  async handleOutcomeCallback(payload: GenericOutcomePayload) {
    this.logger.log(`Processing outcome callback for job ${payload.jobId}`);

    const updateData: any = {
      status: payload.status as any,
      result: payload.result ?? undefined,
      error: payload.errorMessage ?? payload.error ?? null,
      completedAt: new Date(payload.completedAt),
      summary: payload.summary,
    };

    if (payload.relatedEntityType)
      updateData.relatedEntityType = payload.relatedEntityType;
    if (payload.relatedEntityId)
      updateData.relatedEntityId = payload.relatedEntityId;

    await this.prisma.client.windmillExecution.updateMany({
      where: { jobId: payload.jobId },
      data: updateData,
    });

    return { success: true };
  }

  async handleApprovalCallback(payload: ApprovalCallbackPayload) {
    this.logger.log(
      `Processing approval callback for ${payload.entityType} ${payload.entityId}`,
    );

    return this.prisma.client.$transaction(async (tx) => {
      // 1. Update the windmillExecution record (Consolidation)
      await tx.windmillExecution.updateMany({
        where: { jobId: payload.jobId },
        data: {
          status: payload.status as any,
          result: payload.result ?? undefined,
          error: payload.error ?? null,
          completedAt: new Date(payload.completedAt),
          summary: `Approval Decision: ${payload.decision} by ${payload.decidedBy || "Automation"}`,
          relatedEntityType: payload.entityType,
          relatedEntityId: payload.entityId,
        },
      });

      // 2. Business Logic based on entity type
      if (payload.entityType === "PurchaseOrder") {
        const statusMap: Record<string, PurchaseStatus> = {
          APPROVED: PurchaseStatus.APPROVED,
          REJECTED: PurchaseStatus.REJECTED,
          PENDING_REVIEW: PurchaseStatus.ORDERED,
        };
        await tx.purchase.update({
          where: {
            id: payload.entityId,
            organizationId: payload.organizationId,
          },
          data: {
            status: statusMap[payload.decision] || PurchaseStatus.ORDERED,
          },
        });
      } else if (payload.entityType === "Expense") {
        const statusMap: Record<string, ExpenseStatus> = {
          APPROVED: ExpenseStatus.APPROVED,
          REJECTED: ExpenseStatus.REJECTED,
          PENDING_REVIEW: ExpenseStatus.PENDING_APPROVAL,
        };
        await tx.expense.update({
          where: {
            id: payload.entityId,
            organizationId: payload.organizationId,
          },
          data: {
            status:
              statusMap[payload.decision] || ExpenseStatus.PENDING_APPROVAL,
          },
        });
      } else if (payload.entityType === "StockAdjustment") {
        const statusMap: Record<string, AdjustmentStatus> = {
          APPROVED: AdjustmentStatus.APPROVED,
          REJECTED: AdjustmentStatus.REJECTED,
          PENDING_REVIEW: AdjustmentStatus.PENDING,
        };
        await tx.stockAdjustment.update({
          where: {
            id: payload.entityId,
            organizationId: payload.organizationId,
          },
          data: {
            status: statusMap[payload.decision] || AdjustmentStatus.PENDING,
          },
        });
      }

      return { success: true };
    });
  }

  async handleBakeryDisposalCallback(payload: BakeryDisposalCallbackPayload) {
    this.logger.log(
      `Processing bakery disposal callback for batch ${payload.batchId}`,
    );

    return this.prisma.client.$transaction(async (tx) => {
      // 1. Update Execution
      await tx.windmillExecution.updateMany({
        where: { jobId: payload.jobId },
        data: {
          status: payload.status as any,
          result: payload.result ?? undefined,
          error: payload.error ?? null,
          completedAt: new Date(payload.completedAt),
          summary: `Bakery Action: ${payload.action} by ${payload.decidedBy || "Automation"}`,
          relatedEntityType: "Batch",
          relatedEntityId: payload.batchId,
        },
      });

      // 2. Business Logic
      if (payload.action === "DISPOSE") {
        await tx.batch.update({
          where: {
            id: payload.batchId,
            organizationId: payload.organizationId,
          },
          data: {
            expirationStatus: ExpirationStatus.DISPOSED,
            disposedAt: new Date(),
            disposalReason:
              (payload.disposalReason as DisposalReason) ||
              DisposalReason.EXPIRED,
            disposalNotes: payload.notes,
          },
        });
      } else if (payload.action === "REPURPOSE") {
        await tx.batch.update({
          where: {
            id: payload.batchId,
            organizationId: payload.organizationId,
          },
          data: {
            notes: payload.notes
              ? `Repurposed: ${payload.notes}`
              : "Repurposed via automation",
          },
        });
      }

      return { success: true };
    });
  }
}
