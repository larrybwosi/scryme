import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { kraService, KRAService } from "@repo/shared/kra";
import { SaveKRAConfigDto } from "../dto/kra-config.dto";

@Injectable()
export class KraUseCase {
  private kraService: KRAService;

  constructor(private readonly prisma: PrismaService) {
    this.kraService = kraService;
  }

  async getConfig(organizationId: string) {
    const config = await this.kraService.getConfiguration(organizationId);
    if (!config) {
      return {
        organizationId,
        provider: "NAVARI",
        environment: "SANDBOX",
        enforcementMode: "ASYNC",
        kraPin: "",
        branchCode: "00",
        highValueThreshold: 100000,
        autoSyncSales: true,
        autoSyncPurchases: true,
        isActive: false,
      };
    }
    return config;
  }

  async saveConfig(organizationId: string, dto: SaveKRAConfigDto) {
    if (!dto.kraPin || dto.kraPin.trim().length === 0) {
      throw new BadRequestException("KRA PIN is required");
    }
    return await this.kraService.saveConfiguration(organizationId, dto as any);
  }

  async validatePin(organizationId: string, kraPin: string) {
    return await this.kraService.validatePin(organizationId, kraPin);
  }

  async getComplianceLogs(
    organizationId: string,
    params: { page?: number; limit?: number; status?: string },
  ) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 20)));
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (params.status) {
      where.status = params.status;
    }

    const [logs, total] = await Promise.all([
      this.prisma.client.kRAComplianceLog.findMany({
        where,
        orderBy: { submittedAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.client.kRAComplianceLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async retrySubmission(organizationId: string, logId: string) {
    return await this.kraService.retrySubmission(organizationId, logId);
  }

  async getVatSummary(organizationId: string, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [salesLogs, purchaseLogs] = await Promise.all([
      this.prisma.client.kRAComplianceLog.findMany({
        where: {
          organizationId,
          submittedAt: { gte: start, lte: end },
          status: { in: ["SUBMITTED", "ACKNOWLEDGED"] },
          purchaseId: null,
        },
      }),
      this.prisma.client.kRAComplianceLog.findMany({
        where: {
          organizationId,
          submittedAt: { gte: start, lte: end },
          status: { in: ["SUBMITTED", "ACKNOWLEDGED"] },
          purchaseId: { not: null },
        },
      }),
    ]);

    const totalSales = salesLogs.reduce((acc, l) => acc + Number(l.taxableAmount || 0), 0);
    const outputVat = salesLogs.reduce((acc, l) => acc + Number(l.taxAmount || 0), 0);

    const totalPurchases = purchaseLogs.reduce((acc, l) => acc + Number(l.taxableAmount || 0), 0);
    const inputVat = purchaseLogs.reduce((acc, l) => acc + Number(l.taxAmount || 0), 0);

    const netVatPayable = outputVat - inputVat;

    return {
      periodStartDate: start.toISOString(),
      periodEndDate: end.toISOString(),
      totalSales,
      outputVat,
      totalPurchases,
      inputVat,
      netVatPayable,
      documentsCount: salesLogs.length + purchaseLogs.length,
    };
  }
}
