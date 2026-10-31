import { Injectable, Logger, UnauthorizedException, NotFoundException } from "@nestjs/common";
import { createHash } from "crypto";
import jwt from "jsonwebtoken";
import { db } from "@repo/db";
import { env } from "@repo/env";
import { McpToolsService } from "./mcp-tools.service";

export interface McpAuthContext {
  keyId: string;
  organizationId: string;
  name: string;
  scopes: string[];
  userId?: string;
}

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);

  constructor(private readonly mcpToolsService: McpToolsService) {}

  private getJwtSecret(): string {
    return process.env.JWT_SECRET || (env as any).JWT_SECRET || "fallback-secret-for-dev";
  }

  /**
   * Validate raw MCP token string (supports both API keys e.g. "mcp_live_..." and JWT Bearer tokens)
   */
  async validateApiKey(rawKey: string): Promise<McpAuthContext> {
    if (!rawKey || typeof rawKey !== "string") {
      throw new UnauthorizedException("Invalid or missing MCP API key / token");
    }

    const keyToken = rawKey.startsWith("Bearer ") ? rawKey.slice(7).trim() : rawKey.trim();

    // 1. Check if token is a signed JWT (format: header.payload.signature)
    if (keyToken.split(".").length === 3) {
      try {
        const decoded = jwt.verify(keyToken, this.getJwtSecret(), {
          algorithms: ["HS256"],
        }) as any;

        const organizationId = decoded.organizationId || decoded.orgId;
        if (!organizationId) {
          throw new UnauthorizedException("JWT token is missing organizationId claim");
        }

        // Validate scopes: must have mcp:read, mcp:write, or admin/wildcard
        const tokenScopes = Array.isArray(decoded.scopes)
          ? decoded.scopes
          : typeof decoded.scopes === "string"
            ? decoded.scopes.split(" ")
            : [];

        const hasMcpScope =
          tokenScopes.length === 0 || // standard auth token with org access defaults to access
          tokenScopes.some((s: string) => s === "mcp:read" || s === "mcp:write" || s === "*" || s === "admin");

        if (!hasMcpScope) {
          throw new UnauthorizedException("Insufficient token scopes for MCP operations");
        }

        return {
          keyId: decoded.sub || "jwt-session",
          organizationId,
          name: decoded.name || decoded.email || "JWT Authenticated User",
          scopes: tokenScopes.length > 0 ? tokenScopes : ["mcp:read", "mcp:write"],
          userId: decoded.userId || decoded.sub,
        };
      } catch (err: any) {
        if (err instanceof UnauthorizedException) {
          throw err;
        }
        // If JWT verify failed, don't immediately throw if it could still be an API key with dots
        this.logger.debug(`JWT verification failed, falling back to API Key lookup: ${err.message}`);
      }
    }

    // 2. Look up in McpApiKey table
    const hashedKey = createHash("sha256").update(keyToken).digest("hex");

    const mcpKey = await db.mcpApiKey.findFirst({
      where: {
        OR: [
          { hashedKey },
          { keyPrefix: keyToken.substring(0, 16) },
        ],
        isActive: true,
        revokedAt: null,
      },
    });

    if (mcpKey) {
      if (mcpKey.expiresAt && new Date(mcpKey.expiresAt) < new Date()) {
        throw new UnauthorizedException("MCP API Key has expired");
      }

      // Update last used timestamp async
      db.mcpApiKey.update({
        where: { id: mcpKey.id },
        data: { lastUsedAt: new Date() },
      }).catch((err) => this.logger.error(`Failed updating lastUsedAt for McpApiKey ${mcpKey.id}:`, err));

      return {
        keyId: mcpKey.id,
        organizationId: mcpKey.organizationId,
        name: mcpKey.name,
        scopes: mcpKey.scopes || ["mcp:read", "mcp:write"],
      };
    }

    // 3. Fallback lookup in standard ApiKey table if prefix matches "mcp_"
    if (keyToken.startsWith("mcp_")) {
      const apiKey = await db.apiKey.findFirst({
        where: {
          hashedKey,
          isActive: true,
          revokedAt: null,
        },
      });

      if (apiKey) {
        return {
          keyId: apiKey.id,
          organizationId: apiKey.organizationId,
          name: apiKey.name,
          scopes: ["mcp:read", "mcp:write"],
        };
      }
    }

    throw new UnauthorizedException("Invalid MCP API Key provided");
  }

  /**
   * MCP Protocol Method Handlers
   */

  async initialize() {
    return {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: { listChanged: true },
        resources: { subscribe: false, listChanged: true },
        prompts: { listChanged: false },
      },
      serverInfo: {
        name: "Scryme MCP Server",
        version: "10.2.30",
      },
    };
  }

  async listTools() {
    return {
      tools: this.mcpToolsService.getToolDefinitions(),
    };
  }

  async callTool(name: string, args: Record<string, any>, auth: McpAuthContext) {
    try {
      const result = await this.mcpToolsService.executeTool(name, args || {}, auth.organizationId);
      return {
        content: [
          {
            type: "text",
            text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
          },
        ],
        isError: false,
      };
    } catch (error: any) {
      this.logger.error(`Error executing tool ${name}: ${error.message}`, error.stack);
      return {
        content: [
          {
            type: "text",
            text: `Tool execution failed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async listResources() {
    return {
      resources: [
        {
          uri: "scryme://analytics/summary",
          name: "Sales & Financial Summary",
          description: "Live revenue, order volume, and key financial performance indicators",
          mimeType: "application/json",
        },
        {
          uri: "scryme://inventory/summary",
          name: "Inventory Overview",
          description: "Summary of low stock items, total product count, and variant status",
          mimeType: "application/json",
        },
      ],
    };
  }

  async readResource(uri: string, auth: McpAuthContext) {
    if (uri === "scryme://analytics/summary") {
      const analytics = await this.mcpToolsService.executeTool("get_sales_analytics", { timeframe: "month" }, auth.organizationId);
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(analytics, null, 2),
          },
        ],
      };
    } else if (uri === "scryme://inventory/summary") {
      const inventory = await this.mcpToolsService.executeTool("query_inventory", { limit: 50 }, auth.organizationId);
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(inventory, null, 2),
          },
        ],
      };
    }

    throw new NotFoundException(`Resource with URI ${uri} not found`);
  }

  /**
   * Handle generic JSON-RPC 2.0 MCP Request
   */
  async handleRpcRequest(body: any, auth: McpAuthContext) {
    const { jsonrpc, id, method, params } = body || {};

    if (jsonrpc !== "2.0") {
      return { jsonrpc: "2.0", id: id || null, error: { code: -32600, message: "Invalid Request: expected jsonrpc=2.0" } };
    }

    try {
      let result: any;
      switch (method) {
        case "initialize":
          result = await this.initialize();
          break;
        case "notifications/initialized":
          result = {};
          break;
        case "tools/list":
          result = await this.listTools();
          break;
        case "tools/call":
          result = await this.callTool(params?.name, params?.arguments, auth);
          break;
        case "resources/list":
          result = await this.listResources();
          break;
        case "resources/read":
          result = await this.readResource(params?.uri, auth);
          break;
        case "ping":
          result = {};
          break;
        default:
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Method not found: ${method}` },
          };
      }

      return { jsonrpc: "2.0", id, result };
    } catch (err: any) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32603, message: err.message || "Internal error" },
      };
    }
  }
}
