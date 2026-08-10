import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { V2ApiContext } from "@repo/shared/api/v2";
import { ROLE_PERMISSIONS } from "@repo/shared/api/v2";
import { validateDeviceKey, verifyMemberToken } from "@repo/shared/api/v2";
import { ALLOW_PUBLIC_KEY } from "../common/decorators/auth.decorator";
import { db } from "@repo/db";
import { env } from "@repo/env";

@Injectable()
export class V2AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<any>();
    const url = request.raw?.url || request.url || "";
    if (url.includes("/v3/") || url.includes("/android/")) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      ALLOW_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    const correlationId =
      (request.headers["x-correlation-id"] as string) || "unknown";
    const ipAddress = (
      (request.headers["x-forwarded-for"] as string) ||
      (request.headers["x-real-ip"] as string) ||
      "unknown"
    )
      .split(",")[0]
      .trim();
    const userAgent = request.headers["user-agent"] || "unknown";

    // 1. Authenticate Device
    let apiKey = request.headers["x-api-key"] as string;
    if (!apiKey) {
      apiKey = (request as any).cookies?.["dealio_device_key"];
    }

    let deviceAuth = null;
    if (apiKey) {
      deviceAuth = await validateDeviceKey(
        this.prisma.client,
        apiKey,
        ipAddress,
      );
    }

    // 2. Authenticate Member
    let memberToken = request.headers["x-member-token"] as string;
    if (!memberToken) {
      memberToken = (request as any).cookies?.["dealio_member_token"];
    }

    let memberAuth = null;
    if (memberToken) {
      try {
        const payload = await verifyMemberToken(memberToken);
        if (payload) {
          const member = await this.prisma.client.member.findUnique({
            where: { id: payload.memberId },
            select: {
              id: true,
              role: true,
              isActive: true,
              user: { select: { name: true } },
              customRoles: { select: { permissions: true } },
            },
          });

          if (member && member.isActive) {
            const basePermissions = ROLE_PERMISSIONS[member.role] ?? [];
            const customPermissions = member.customRoles.flatMap(
              (r: any) => r.permissions,
            );
            const permissions = [
              ...new Set([...basePermissions, ...customPermissions]),
            ];

            memberAuth = {
              memberId: payload.memberId,
              organizationId: payload.organizationId,
              memberName: member.user ? `${member.user.name}` : undefined,
              permissions,
            };
          }
        }
      } catch (err) {}
    }

    let authType: V2ApiContext["authType"] = "device";
    if (deviceAuth && memberAuth) {
      authType = "hybrid";
    } else if (memberAuth) {
      authType = "member";
    }

    request.v2Context = {
      organizationId:
        deviceAuth?.organizationId ||
        memberAuth?.organizationId ||
        "",
      deviceId: deviceAuth?.deviceId,
      locationId: deviceAuth?.locationId,
      memberId: memberAuth?.memberId,
      memberName: memberAuth?.memberName,
      authType,
      permissions: [
        ...(deviceAuth?.permissions || []),
        ...(memberAuth?.permissions || []),
      ],
      scopes: [],
      correlationId,
      ipAddress,
      userAgent,
      requestStartTime: Date.now(),
    };
    return true;
  }
}
