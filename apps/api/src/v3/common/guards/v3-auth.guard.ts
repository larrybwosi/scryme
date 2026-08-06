import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { V3AuthCoreService } from "../../modules/auth-core/infrastructure/services/v3-auth-core.service";
import { PrismaService } from "@/prisma/prisma.service";
import { ModuleRef, Reflector } from "@nestjs/core";
import { ALLOW_PUBLIC_KEY } from "@/common/decorators/auth.decorator";
import { AuthService } from "@/auth/auth.service";
import { verifyZitadelJwt } from "@repo/shared/api/v2";
import { env } from "@repo/env";

@Injectable()
export class V3AuthGuard implements CanActivate {
  private v3AuthService: V3AuthCoreService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly moduleRef: ModuleRef,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      ALLOW_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException(
        "Missing or invalid authorization header",
      );
    }

    const token = authHeader.split(" ")[1];

    if (!this.v3AuthService) {
      this.v3AuthService = this.moduleRef.get(V3AuthCoreService, {
        strict: false,
      });
    }

    // Determine target organization slug from url/headers up-front
    const orgSlugHeader = request.headers["x-org-slug"];
    const orgSlugFromUrl =
      request.params.orgSlug ||
      (Array.isArray(orgSlugHeader) ? orgSlugHeader[0] : orgSlugHeader);

    let organization = null;
    if (orgSlugFromUrl) {
      organization = await this.prisma.client.organization.findUnique({
        where: { slug: orgSlugFromUrl },
      });
    }

    let payload: any = null;

    // 1. Try HS256 V3 client/hybrid JWT first
    try {
      payload = await this.v3AuthService.verifyToken(token);
    } catch (error) {
      // Not a valid HS256 V3 JWT, proceed to other checks
    }

    // 2. Try better-auth session token
    if (!payload) {
      try {
        const authService = this.moduleRef.get(AuthService, { strict: false });
        if (authService) {
          const session = await authService.auth.api.getSession({
            headers: {
              authorization: `Bearer ${token}`,
            },
          });
          if (session) {
            const user = session.user;
            const orgId = organization?.id || user.activeOrganizationId;
            if (orgId) {
              const customer = await this.prisma.client.customer.findUnique({
                where: {
                  organizationId_email: {
                    organizationId: orgId,
                    email: user.email,
                  },
                },
              });

              if (customer) {
                payload = {
                  type: "v3_customer",
                  customerId: customer.id,
                  customerEmail: customer.email,
                  customerName: customer.name,
                  organizationId: orgId,
                  clientId: null,
                  scopes: [],
                };
                request.user = user;
              }
            }
          }
        }
      } catch (err) {
        // Ignored
      }
    }

    // 3. Try Zitadel OIDC JWT token
    if (!payload) {
      const zitadelDomain = env.ZITADEL_DOMAIN;
      const zitadelAudience = env.ZITADEL_CLIENT_ID;

      if (zitadelDomain && zitadelAudience) {
        try {
          const zitadelPayload = await verifyZitadelJwt(
            token,
            null,
            zitadelDomain,
            zitadelAudience,
          );

          if (zitadelPayload) {
            const targetOrgId = organization?.id;
            if (targetOrgId) {
              // Try external mapping
              const mapping = await this.prisma.client.externalMapping.findFirst({
                where: {
                  organizationId: targetOrgId,
                  provider: "ZITADEL",
                  externalId: zitadelPayload.sub,
                  entityType: "CUSTOMER",
                },
              });

              let customerId = mapping?.internalId;
              let customer = null;

              if (customerId) {
                customer = await this.prisma.client.customer.findUnique({
                  where: { id: customerId },
                });
              }

              if (!customer && zitadelPayload.email) {
                customer = await this.prisma.client.customer.findUnique({
                  where: {
                    organizationId_email: {
                      organizationId: targetOrgId,
                      email: zitadelPayload.email,
                    },
                  },
                });
              }

              if (customer) {
                payload = {
                  type: "v3_customer",
                  customerId: customer.id,
                  customerEmail: customer.email,
                  customerName: customer.name,
                  organizationId: targetOrgId,
                  clientId: null,
                  scopes: (zitadelPayload.scope ?? "").split(" ").filter(Boolean),
                };
              }
            }
          }
        } catch (err) {
          // Ignored
        }
      }
    }

    if (!payload) {
      throw new UnauthorizedException("Invalid token or session expired");
    }

    if (
      payload.type !== "v3_client" &&
      payload.type !== "v3_hybrid" &&
      payload.type !== "v3_customer"
    ) {
      throw new UnauthorizedException("Invalid token type");
    }

    if (!organization) {
      organization = await this.prisma.client.organization.findUnique({
        where: { id: payload.organizationId },
      });
    }

    if (!organization) {
      throw new UnauthorizedException("Organization not found");
    }

    if (orgSlugFromUrl && orgSlugFromUrl !== organization.slug) {
      throw new UnauthorizedException("Organization slug mismatch");
    }

    // Set V3 Context
    request.v3Context = {
      clientId: payload.clientId,
      organizationId: payload.organizationId,
      orgSlug: organization.slug,
      businessAccountId: payload.businessAccountId || null,
      scopes: payload.scopes || [],
      organization,
      memberId: payload.memberId || null,
      deviceId: payload.deviceId || null,
      locationId: payload.locationId || null,
      authType: payload.type,
      customerId: payload.customerId || null,
      customer: payload.customerId
        ? {
            id: payload.customerId,
            email: payload.customerEmail,
            name: payload.customerName,
          }
        : null,
    };

    // If it's a customer, ensure request.user has their customer id
    if (payload.type === "v3_customer") {
      request.user = request.user || {
        id: payload.customerId,
        email: payload.customerEmail,
        name: payload.customerName,
        isCustomer: true,
      };
    }

    // Set request.organization for MultiTenancyGuard compatibility
    request.organization = organization;

    return true;
  }
}
