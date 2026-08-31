import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ALLOW_PUBLIC_KEY } from "../common/decorators/auth.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthService } from "@/auth/auth.service";
import * as jwt from "jsonwebtoken";
import { env } from "@repo/env";

@Injectable()
export class AndroidAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      ALLOW_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<any>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid authorization header");
    }

    const token = authHeader.split(" ")[1];

    let payload: any = null;
    try {
      payload = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ["HS256"],
      }) as any;
    } catch (err) {
      // Not a valid JWT, try better-auth session token below
    }

    if (payload) {
      // Custom JWT (e.g., Terminal Login)
      const organization = await this.prisma.client.organization.findUnique({
        where: { id: payload.organizationId },
      });

      if (!organization) {
        throw new UnauthorizedException("Organization not found");
      }

      const orgSlugFromUrl = request.params.orgSlug;
      if (orgSlugFromUrl && orgSlugFromUrl !== organization.slug) {
        throw new UnauthorizedException("Organization slug mismatch");
      }

      request.v3Context = {
        clientId: payload.clientId,
        organizationId: payload.organizationId,
        orgSlug: payload.orgSlug,
        businessAccountId: payload.businessAccountId,
        scopes: payload.scopes || [],
        permissions: payload.permissions || payload.scopes || ["*"],
        organization,
        memberId: payload.memberId,
        deviceId: payload.deviceId,
        locationId: payload.locationId,
        authType: payload.type,
      };

      request.organization = organization;
      request.androidToken = token;
      return true;
    } else {
      // Better-Auth Session Token
      const session = await this.authService.auth.api.getSession({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (!session) {
        throw new UnauthorizedException("Session invalid or expired");
      }

      const user = session.user as any;
      let orgId = user.activeOrganizationId || (session.session as any).activeOrganizationId;

      const orgSlugFromUrl = request.params.orgSlug;

      if (!orgId && orgSlugFromUrl) {
        const targetOrg = await this.prisma.client.organization.findUnique({
          where: { slug: orgSlugFromUrl },
        });
        if (targetOrg) {
          const isMember = await this.prisma.client.member.findFirst({
            where: { userId: user.id, organizationId: targetOrg.id, deletedAt: null },
          });
          if (isMember) {
            orgId = targetOrg.id;
          }
        }
      }

      if (!orgId) {
        const firstMembership = await this.prisma.client.member.findFirst({
          where: { userId: user.id, deletedAt: null },
          select: { organizationId: true },
        });
        if (firstMembership) {
          orgId = firstMembership.organizationId;
        }
      }

      if (!orgId) {
        throw new UnauthorizedException("No active organization selected for user");
      }

      let organization = await this.prisma.client.organization.findUnique({
        where: { id: orgId },
      });

      if (!organization) {
        throw new UnauthorizedException("Organization not found");
      }

      if (orgSlugFromUrl && orgSlugFromUrl !== organization.slug) {
        const targetOrg = await this.prisma.client.organization.findUnique({
          where: { slug: orgSlugFromUrl },
        });
        if (targetOrg) {
          const targetMember = await this.prisma.client.member.findFirst({
            where: { userId: user.id, organizationId: targetOrg.id, deletedAt: null },
          });
          if (targetMember) {
            organization = targetOrg;
            orgId = targetOrg.id;
          } else {
            throw new UnauthorizedException("Organization slug mismatch or unauthorized access to organization");
          }
        } else {
          throw new UnauthorizedException("Organization slug mismatch");
        }
      }

      // Look up member details in this organization
      const member = await this.prisma.client.member.findFirst({
        where: { userId: user.id, organizationId: orgId, deletedAt: null },
      });

      request.v3Context = {
        clientId: null,
        organizationId: orgId,
        orgSlug: organization.slug,
        businessAccountId: null,
        scopes: [],
        permissions: ["*"],
        organization,
        memberId: member?.id || null,
        deviceId: null,
        locationId: null,
        authType: "android_session",
      };

      request.organization = organization;
      request.user = user;
      request.androidToken = token;
      return true;
    }
  }
}
