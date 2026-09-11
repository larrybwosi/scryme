import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class MultiTenancyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    if (!orgSlug) {
      return true; // Handle non-tenant routes if any
    }

    const organization = await this.prisma.client.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true, slug: true, name: true },
    });

    if (!organization) {
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

    // Enforce strict membership verification for non-superadmin member users
    if (user && !isSuperAdmin && !isClientCredentials && !isCustomer) {
      const member = await this.prisma.client.member.findFirst({
        where: {
          organizationId: organization.id,
          userId: user.id,
          deletedAt: null,
        },
      });

      if (!member || !member.isActive) {
        throw new ForbiddenException(
          "Access denied: You are not an active member of this organization",
        );
      }
    }

    return true;
  }
}
