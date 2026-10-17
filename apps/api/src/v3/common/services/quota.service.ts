import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { QuotaMetric } from "../decorators/quota.decorator";

export interface EffectiveQuotaResult {
  organizationId: string;
  tierSlug: string;
  baseLimits: Record<string, number>;
  defaultAllocations: Record<string, number>;
  overrides: Record<string, number>;
  effectiveLimits: Record<string, number>;
}

@Injectable()
export class QuotaService {
  private readonly logger = new Logger(QuotaService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch default system quota allocations stored in GlobalSettings key `system:default_quotas`
   */
  async getDefaultQuotaAllocations(): Promise<Record<string, number>> {
    const defaults: Record<string, number> = {
      maxUsers: 5,
      maxProducts: 500,
      maxLocations: 2,
      maxStorageGB: 10,
      maxOrdersPerMonth: 1000,
      maxApiRequestsPerDay: 10000,
      maxWebhookSubscriptions: 5,
      maxWorkflowEngineDefinitions: 10,
      maxCustomDomains: 1,
    };

    try {
      const setting = await this.prisma.client.globalSetting.findUnique({
        where: { key: "system:default_quotas" },
      });

      if (setting?.value) {
        const parsed = JSON.parse(setting.value);
        return { ...defaults, ...parsed };
      }
    } catch (err) {
      this.logger.warn(`Failed to parse system:default_quotas: ${err}`);
    }

    return defaults;
  }

  /**
   * Get all defined plan tiers stored in GlobalSettings key `system:tiers`
   */
  async listTiers(): Promise<Array<{ slug: string; name: string; limits: Record<string, number> }>> {
    const setting = await this.prisma.client.globalSetting.findUnique({
      where: { key: "system:tiers" },
    });

    const defaultTiers = [
      {
        slug: "free",
        name: "Starter / Free",
        limits: {
          maxUsers: 3,
          maxProducts: 100,
          maxLocations: 1,
          maxStorageGB: 2,
          maxOrdersPerMonth: 100,
          maxApiRequestsPerDay: 1000,
          maxWebhookSubscriptions: 2,
          maxWorkflowEngineDefinitions: 2,
          maxCustomDomains: 0,
        },
      },
      {
        slug: "pro",
        name: "Pro Tier",
        limits: {
          maxUsers: 15,
          maxProducts: 5000,
          maxLocations: 5,
          maxStorageGB: 50,
          maxOrdersPerMonth: 10000,
          maxApiRequestsPerDay: 100000,
          maxWebhookSubscriptions: 20,
          maxWorkflowEngineDefinitions: 20,
          maxCustomDomains: 2,
        },
      },
      {
        slug: "enterprise",
        name: "Enterprise Tier",
        limits: {
          maxUsers: -1,
          maxProducts: -1,
          maxLocations: -1,
          maxStorageGB: -1,
          maxOrdersPerMonth: -1,
          maxApiRequestsPerDay: -1,
          maxWebhookSubscriptions: -1,
          maxWorkflowEngineDefinitions: -1,
          maxCustomDomains: -1,
        },
      },
    ];

    if (!setting?.value) return defaultTiers;

    try {
      const parsed = JSON.parse(setting.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (err) {
      this.logger.warn(`Failed to parse system:tiers setting: ${err}`);
    }

    return defaultTiers;
  }

  /**
   * Calculates effective quotas for a specific organization by merging
   * System Defaults < Base Tier Limits < Organization Quota Overrides.
   */
  async getEffectiveQuota(organizationId: string): Promise<EffectiveQuotaResult> {
    const org = await this.prisma.client.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, quotaOverrides: true },
    });

    const subscription = await this.prisma.client.subscription.findUnique({
      where: { organizationId },
    });

    const defaultAllocations = await this.getDefaultQuotaAllocations();
    const tierSlug = subscription?.dodoPriceId || "free";
    const tiers = await this.listTiers();
    const tier = tiers.find((t) => t.slug === tierSlug);
    const baseLimits = tier?.limits || {};
    const overrides = (org?.quotaOverrides as Record<string, number>) || {};

    const effectiveLimits = {
      ...defaultAllocations,
      ...baseLimits,
      ...overrides,
    };

    return {
      organizationId,
      tierSlug,
      baseLimits,
      defaultAllocations,
      overrides,
      effectiveLimits,
    };
  }

  /**
   * Calculates current resource usage for an organization for a given metric.
   */
  async getCurrentUsage(organizationId: string, metric: QuotaMetric): Promise<number> {
    switch (metric) {
      case "maxUsers": {
        return this.prisma.client.member.count({
          where: { organizationId, deletedAt: null },
        });
      }
      case "maxProducts": {
        return this.prisma.client.product.count({
          where: { organizationId, isArchived: false },
        });
      }
      case "maxLocations": {
        return this.prisma.client.inventoryLocation.count({
          where: { organizationId },
        });
      }
      case "maxWebhookSubscriptions": {
        return this.prisma.client.webhookSubscription.count({
          where: { organizationId, isActive: true },
        });
      }
      case "maxWorkflowEngineDefinitions": {
        return this.prisma.client.workflowEngineDefinition.count({
          where: { organizationId },
        });
      }
      case "maxOrdersPerMonth": {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        return this.prisma.client.transaction.count({
          where: {
            organizationId,
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });
      }
      default:
        return 0;
    }
  }

  /**
   * Checks if an organization exceeds its effective limit for a metric.
   * Returns { allowed: boolean, limit: number, current: number }
   */
  async checkQuota(
    organizationId: string,
    metric: QuotaMetric,
  ): Promise<{ allowed: boolean; limit: number; current: number }> {
    const effective = await this.getEffectiveQuota(organizationId);
    const limit = effective.effectiveLimits[metric] ?? -1;

    // -1 signifies unlimited usage
    if (limit === -1) {
      return { allowed: true, limit, current: 0 };
    }

    const current = await this.getCurrentUsage(organizationId, metric);
    const allowed = current < limit;

    return { allowed, limit, current };
  }
}
