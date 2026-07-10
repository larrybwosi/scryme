import { Injectable, ExecutionContext } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

@Injectable()
export class MultiTenantThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // 1. Check if authenticated context is already set on request
    if (req.v2Context?.organizationId) {
      return `tenant:${req.v2Context.organizationId}`;
    }
    if (req.v3Context?.organizationId) {
      return `tenant:${req.v3Context.organizationId}`;
    }
    if (req.organization?.id) {
      return `tenant:${req.organization.id}`;
    }

    // 2. High-performance JWT decoding from Authorization header to resolve tenant without DB calls
    const authHeader = req.headers?.authorization;
    if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(
              Buffer.from(parts[1], "base64").toString("utf-8")
            );
            if (payload.organizationId) {
              return `tenant:${payload.organizationId}`;
            }
          }
        } catch (err) {
          // Fall back on parsing failure
        }
      }
    }

    // 3. Device/API key tracking
    const apiKey = req.headers?.["x-api-key"] || req.cookies?.["dealio_device_key"];
    if (apiKey && typeof apiKey === "string") {
      return `device:${apiKey}`;
    }

    // 4. Member token tracking
    const memberToken = req.headers?.["x-member-token"] || req.cookies?.["dealio_member_token"];
    if (memberToken && typeof memberToken === "string") {
      try {
        const parts = memberToken.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64").toString("utf-8")
          );
          if (payload.organizationId) {
            return `tenant:${payload.organizationId}`;
          }
        }
      } catch (err) {
        // Fall back
      }
    }

    // 5. Fallback to client IP address
    const xForwardedFor = req.headers?.["x-forwarded-for"];
    const xRealIp = req.headers?.["x-real-ip"];
    const ip = xForwardedFor || xRealIp || req.ip || "unknown";
    const clientIp = Array.isArray(ip) ? ip[0] : ip;
    return `ip:${clientIp.split(",")[0].trim()}`;
  }

  // Handle request and retrieve request/response context safely for both HTTP and WS/GraphQL
  protected getRequestResponse(context: ExecutionContext) {
    const type = context.getType() as string;
    if (type === "graphql") {
      const gqlContext = context.getArgByIndex(2);
      return {
        req: gqlContext?.reply?.request || {},
        res: gqlContext?.reply || {},
      };
    }
    const httpContext = context.switchToHttp();
    return {
      req: httpContext.getRequest() || {},
      res: httpContext.getResponse() || {},
    };
  }
}
