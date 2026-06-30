import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import { RedisService } from "../../../redis/redis.service";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redis: RedisService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      "permissions",
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true;
    }

    let request: any;
    if (context.getType() === ("graphql" as any)) {
      const gqlContext = GqlExecutionContext.create(context);
      request = gqlContext.getContext().reply.request;
    } else {
      request = context.switchToHttp().getRequest();
    }

    const v3Context = request.v3Context;
    const user = request.user;
    const organization = request.organization || v3Context?.organization;

    if (!organization || (!user && !v3Context?.memberId)) {
      throw new ForbiddenException(
        "User/Member or Organization not identified",
      );
    }

    const permissions = await this.getMemberPermissions(
      organization.id,
      user?.id,
      v3Context?.memberId,
    );

    const hasPermission = requiredPermissions.every((permission) =>
      this.hasPermission(permissions, permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }

  private async getMemberPermissions(
    organizationId: string,
    userId?: string,
    memberId?: string,
  ): Promise<string[]> {
    const cacheKey = `permissions:${organizationId}:${memberId || userId}`;
    const cached = await this.redis.get<string[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const member = await this.prisma.client.member.findUnique({
      where: memberId
        ? { id: memberId, organizationId }
        : {
            organizationId_userId: {
              organizationId,
              userId: userId!,
            },
          },
      include: {
        organization: {
          include: {
            settings: true,
          },
        },
        customRoles: true,
        roleGroups: {
          include: {
            permissionSets: true,
          },
        },
      },
    });

    if (!member) return [];

    if (member.role === "OWNER") {
      const allPermissions = ["*"];
      await this.redis.setex(cacheKey, 3600, allPermissions);
      return allPermissions;
    }

    let permissions: string[] = [];

    if (
      member.role === "ADMIN" &&
      member.organization.settings?.adminsCanManageStaff
    ) {
      permissions.push("members:*");
    }

    // Add permissions from custom roles
    member.customRoles.forEach((role) => {
      permissions = [...permissions, ...role.permissions];
    });

    // Add permissions from role groups
    member.roleGroups.forEach((group) => {
      group.permissionSets.forEach((set) => {
        permissions = [...permissions, ...set.permissions];
      });
    });

    // Deduplicate
    permissions = [...new Set(permissions)];

    await this.redis.setex(cacheKey, 3600, permissions);

    return permissions;
  }

  private hasPermission(granted: string[], required: string): boolean {
    if (!granted) return false;
    if (granted.includes("*") || granted.includes(required)) return true;
    const parts = required.split(":");
    for (let i = parts.length; i > 1; i--) {
      const wildcard = [...parts.slice(0, i - 1), "*"].join(":");
      if (granted.includes(wildcard)) return true;
    }
    return false;
  }
}
