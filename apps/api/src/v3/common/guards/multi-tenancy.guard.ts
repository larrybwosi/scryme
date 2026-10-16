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
      orgSlug = args.orgSlug || args.input?.orgSlug;
      request = gqlContext.getContext().reply.request;
    } else {
      request = context.switchToHttp().getRequest();
      orgSlug = request.params.orgSlug;
    }

    if (!orgSlug) {
      orgSlug = request.headers["x-org-slug"] as string;
    }

    // Handle non-tenant routes or unreplaced parameter templates (e.g., ":orgSlug")
    if (!orgSlug || orgSlug.startsWith(":")) {
      return true;
    }

    const organization = await this.prisma.client.organization.findUnique({
      where: { slug: orgSlug },
      select: {
        id: true,
        slug: true,
        name: true,
        isSuspended: true,
        suspensionReason: true,
      },
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

    // --- Payment & Suspension Enforcement ---
    // Super admins are exempt from payment/suspension restrictions
    if (!isSuperAdmin) {
      const httpMethod = (request.method || "GET").toUpperCase();
      const isMutatingMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(httpMethod);

      // 1. Suspension Check
      if (organization.isSuspended) {
        if (isMutatingMethod) {
          throw new ForbiddenException({
            statusCode: 403,
            code: "ORGANIZATION_SUSPENDED",
            error: "Forbidden",
            message: `Organization access is suspended: ${organization.suspensionReason || "Contact administrator for assistance."}`,
          });
        }
      }

      // 2. Subscription Expiry / Payment Status Check
      if (isMutatingMethod) {
        const subscription = await this.prisma.client.subscription.findUnique({
          where: { organizationId: organization.id },
        });

        if (subscription) {
          const now = new Date();
          // If a subscription period end exists and has passed, check if grace period or expired
          if (subscription.dodoCurrentPeriodEnd && new Date(subscription.dodoCurrentPeriodEnd) < now) {
            // Check if status is explicitly expired or inactive
            throw new ForbiddenException({
              statusCode: 403,
              code: "SUBSCRIPTION_INACTIVE",
              error: "Payment Required",
              message: "Subscription is inactive or payment is overdue. Please update your billing details to resume changes.",
            });
          }
        }
      }
    }

    return true;
  }
}
