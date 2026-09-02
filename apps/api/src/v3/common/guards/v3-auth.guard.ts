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
import { REQUIRE_MEMBER_KEY } from "@/v3/common/decorators/require-member.decorator";
import { AuthService } from "@/auth/auth.service";
import { CustomerAuthService } from "@/customer-auth/customer-auth.service";
import { env } from "@repo/env";
import { RedisService } from "@/redis/redis.service";

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
    const authHeader =
      request.headers.authorization ||
      request.headers["x-member-token"] ||
      request.headers["X-MEMBER-TOKEN"];
    const apiKeyHeader = request.headers["x-api-key"] || request.headers["X-API-KEY"];

    let token: string | null = null;
    if (authHeader) {
      const authStr = Array.isArray(authHeader) ? authHeader[0] : authHeader;
      token = authStr.startsWith("Bearer ") ? authStr.substring(7).trim() : authStr.trim();
    }

    if (!token && !apiKeyHeader) {
      throw new UnauthorizedException(
        "Missing or invalid authorization header / API key",
      );
    }

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
    const authStrategy = process.env.CUSTOMER_AUTH_STRATEGY || env.CUSTOMER_AUTH_STRATEGY || "HYBRID";

    if (token) {
      // 1. Try HS256 V3 client/hybrid JWT first
      try {
        payload = await this.v3AuthService.verifyToken(token);

        // If it is a v3_customer type token, check Redis to ensure session is active
        if (payload && payload.type === "v3_customer" && payload.sessionId) {
            const redisService = this.moduleRef.get(RedisService, { strict: false });
            if (redisService) {
              const sessionActive = await redisService.get(`customer_session:${payload.sub}:${payload.sessionId}`);
              if (!sessionActive) {
                payload = null; // Session revoked
              } else {
                // Adapt fields to match what guard expects
                payload.customerId = payload.sub;
              }
            }
        }
      } catch (error) {
        // Not a valid HS256 V3 JWT, proceed to other checks
      }
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
            const user = session.user as any;
            const orgId = organization?.id || user.activeOrganizationId || (session.session as any).activeOrganizationId;
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

    // 3. Try Customer Auth (Better Auth) session verification in-process
    if (!payload) {
      try {
        const customerAuthService = this.moduleRef.get(CustomerAuthService, { strict: false });
        if (customerAuthService) {
          const headers = new Headers();
          headers.set("authorization", `Bearer ${token}`);
          const session = await customerAuthService.auth.api.getSession({
            headers,
          });

          if (session) {
            const user = session.user;
            const targetOrgId = organization?.id;
            if (targetOrgId && user) {
              // Try Better Auth external mapping
              const mapping = await this.prisma.client.externalMapping.findFirst({
                where: {
                  organizationId: targetOrgId,
                  provider: "BETTER_AUTH",
                  externalId: user.id,
                  entityType: "CUSTOMER",
                },
              });

              const customerId = mapping?.internalId;
              let customer = null;

              if (customerId) {
                customer = await this.prisma.client.customer.findUnique({
                  where: { id: customerId },
                });
              }

              if (!customer && user.email) {
                customer = await this.prisma.client.customer.findUnique({
                  where: {
                    organizationId_email: {
                      organizationId: targetOrgId,
                      email: user.email,
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
                  scopes: [],
                };
              }
            }
          }
        }
      } catch (err) {
        // Ignored
      }
    }

    // 4. Try POS Device X-API-KEY / Client ID lookup
    if (!payload && apiKeyHeader) {
      const apiKeyStr = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
      const clientId = apiKeyStr.includes(".") ? apiKeyStr.split(".")[0] : apiKeyStr;
      const clientSecret = apiKeyStr.includes(".") ? apiKeyStr.split(".").slice(1).join(".") : undefined;
      try {
        const client = await this.v3AuthService.validateClient(clientId, clientSecret);
        if (client) {
          const registry = await this.prisma.client.deviceRegistry.findFirst({
            where: {
              OR: [
                { v3ApiClientId: client.id },
                { apiKeyId: client.id },
              ],
            },
          });
          payload = {
            type: "v3_client",
            clientId: client.clientId,
            organizationId: client.organizationId,
            orgSlug: client.organization.slug,
            businessAccountId: client.businessAccountId || null,
            scopes: client.scopes || [],
            locationId: registry?.locationId || null,
            deviceId: registry?.id || null,
          };
        }
      } catch (err) {
        // Ignored
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
      sessionId: payload.sessionId || null,
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

    // Check if route explicitly requires a member token (sensitive operations)
    const requireMember = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_MEMBER_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requireMember && !payload.memberId) {
      throw new UnauthorizedException(
        "Member authentication required for this operation",
      );
    }

    // Set request.organization for MultiTenancyGuard compatibility
    request.organization = organization;

    return true;
  }
}
