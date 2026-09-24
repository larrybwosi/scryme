import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "@/prisma/prisma.service";
import { ALLOW_PUBLIC_KEY } from "../decorators/auth.decorator";

@Injectable()
export class MultiTenancyGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector?: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector?.getAllAndOverride<boolean>(
      ALLOW_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    const isGql = context.getType() === ("graphql" as any);
    let orgSlug: string;
    let request: any;

    if (isGql) {
      const gqlContext = GqlExecutionContext.create(context);
      const args = gqlContext.getArgs();
      // Look for orgSlug in args directly or inside an 'input' object
      orgSlug = args.orgSlug || args.input?.orgSlug;
      request = gqlContext.getContext().reply.request;
    } else {
      request = context.switchToHttp().getRequest();
      orgSlug = request.params.orgSlug;
    }

    if (!orgSlug) {
      // If we still don't have orgSlug, maybe it's in the headers?
      orgSlug = request.headers["x-org-slug"] as string;
    }

    // Handle non-tenant routes or unreplaced parameter templates (e.g., ":orgSlug")
    if (!orgSlug || orgSlug.startsWith(":")) {
      return true;
    }

    const organization = await this.prisma.client.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true, slug: true, name: true },
    });

    if (!organization) {
      if (isPublic) {
        return true;
      }
      throw new NotFoundException(
        `Organization with slug "${orgSlug}" not found`,
      );
    }

    request.organization = organization;

    const user = request.user;
    const isSuperAdmin =
      user?.role === "SUPER_ADMIN" || user?.systemRole === "SUPER_ADMIN";
    const v3Context = request.v3Context;
    const isClientCredentials = v3Context?.authType === "v3_client";
    const isCustomer = v3Context?.authType === "v3_customer";

    // Enforce strict membership verification for non-superadmin member users or terminal member sessions
    if (!isSuperAdmin && !isClientCredentials && !isCustomer && (user || v3Context?.memberId)) {
      const member = await this.prisma.client.member.findFirst({
        where: v3Context?.memberId
          ? {
              id: v3Context.memberId,
              organizationId: organization.id,
              deletedAt: null,
            }
          : {
              organizationId: organization.id,
              userId: user.id,
              deletedAt: null,
            },
      });

      if (!member || !member.isActive) {
        if (isPublic) {
          return true;
        }
        throw new ForbiddenException(
          "Access denied: You are not an active member of this organization",
        );
      }
    }

    return true;
  }
}
