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
        createdAt: true,
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
      const url = (request.originalUrl || request.url || "").toLowerCase();
      const isExemptRoute =
        url.includes("/payments") ||
        url.includes("/subscriptions") ||
        url.includes("/billing") ||
        url.includes("/webhooks");

      if (isMutatingMethod && !isExemptRoute) {
        const subscription = await this.prisma.client.subscription.findUnique({
          where: { organizationId: organization.id },
        });

        const now = new Date();
        let isExpired = false;
        let expireReason = "";

        if (subscription) {
          if (["EXPIRED", "CANCELED", "PAST_DUE"].includes(subscription.status)) {
            isExpired = true;
            expireReason = "Subscription is expired or canceled. Please renew your subscription to perform this action.";
          } else if (subscription.status === "TRIALING" && subscription.trialEndsAt && new Date(subscription.trialEndsAt) < now) {
            isExpired = true;
            expireReason = "Your 14-day free trial has expired. Please update your billing details to resume changes.";
          } else if (subscription.dodoCurrentPeriodEnd && new Date(subscription.dodoCurrentPeriodEnd) < now) {
            isExpired = true;
            expireReason = "Subscription payment is overdue or expired. Please update your billing information.";
          }
        } else {
          // Fallback check against Organization.createdAt (14 days trial)
          const orgCreatedAt = organization.createdAt ? new Date(organization.createdAt) : new Date();
          const trialEnd = new Date(orgCreatedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
          if (trialEnd < now) {
            isExpired = true;
            expireReason = "Your 14-day free trial has expired. Please subscribe to continue.";
          }
        }

        if (isExpired) {
          throw new ForbiddenException({
            statusCode: 403,
            code: "SUBSCRIPTION_EXPIRED",
            error: "Payment Required",
            message: expireReason,
          });
        }
      }
    }

    return true;
  }
}
