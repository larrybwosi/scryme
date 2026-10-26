import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  evaluateModuleStatus,
  EffectiveModuleResolution,
  PlatformModuleKey,
} from "@repo/shared/constants";

@Injectable()
export class ModuleAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async checkModuleAccess(
    organizationId: string | null | undefined,
    moduleKey: PlatformModuleKey,
  ): Promise<EffectiveModuleResolution> {
    const systemSetting = await this.prisma.client.globalSetting.findUnique({
      where: { key: "system:modules" },
    });

    let systemModules: Record<string, boolean> = {};
    if (systemSetting?.value) {
      try {
        systemModules = JSON.parse(systemSetting.value);
      } catch {
        systemModules = {};
      }
    }

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
