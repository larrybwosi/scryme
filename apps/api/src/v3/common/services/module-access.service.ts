import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  evaluateModuleStatus,
  evaluateAllModulesStatus,
  EffectiveModuleResolution,
  PlatformModuleKey,
} from "@repo/shared/constants";

@Injectable()
export class ModuleAccessService {
  constructor(private readonly prisma: PrismaService) {}

  private async getSystemModules(): Promise<Record<string, boolean>> {
    const systemSetting = await this.prisma.client.globalSetting.findUnique({
      where: { key: "system:modules" },
    });

    if (systemSetting?.value) {
      try {
        return JSON.parse(systemSetting.value);
      } catch {
        return {};
      }
    }
    return {};
  }

  async getAllModulesAccess(
    organizationId: string | null | undefined,
  ): Promise<EffectiveModuleResolution[]> {
    const systemModules = await this.getSystemModules();

    let orgModules: Record<string, boolean> = {};
    if (organizationId) {
      const org = await this.prisma.client.organization.findUnique({
        where: { id: organizationId },
        select: { quotaOverrides: true },
      });

      if (org?.quotaOverrides) {
        const overridesObj = org.quotaOverrides as Record<string, any>;
        if (overridesObj.bypassPaymentCheck) {
          return evaluateAllModulesStatus(systemModules, {}).map((m) => ({
            ...m,
            isEnabled: true,
            orgEnabled: true,
            reason: "Organization payment override enabled",
          }));
        }
        orgModules = (overridesObj.modules as Record<string, boolean>) || {};
      }
    }

    return evaluateAllModulesStatus(systemModules, orgModules);
  }

  async checkModuleAccess(
    organizationId: string | null | undefined,
    moduleKey: PlatformModuleKey,
  ): Promise<EffectiveModuleResolution> {
    const systemModules = await this.getSystemModules();

    let orgModules: Record<string, boolean> = {};
    if (organizationId) {
      const org = await this.prisma.client.organization.findUnique({
        where: { id: organizationId },
        select: { quotaOverrides: true },
      });

      if (org?.quotaOverrides) {
        const overridesObj = org.quotaOverrides as Record<string, any>;
        if (overridesObj.bypassPaymentCheck) {
          return {
            moduleKey,
            isEnabled: true,
            systemEnabled: true,
            orgEnabled: true,
            reason: "Organization payment override enabled",
          };
        }
        orgModules = (overridesObj.modules as Record<string, boolean>) || {};
      }
    }

    return evaluateModuleStatus(systemModules, orgModules, moduleKey);
  }
}
