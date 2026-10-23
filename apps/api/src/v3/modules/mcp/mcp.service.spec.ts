import { describe, it, expect, beforeEach, vi } from "vitest";
import { McpService } from "./mcp.service";
import { McpToolsService } from "./mcp-tools.service";
import { db } from "@repo/db";

vi.mock("@repo/db", () => ({
  db: {
    mcpApiKey: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    apiKey: {
      findFirst: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    customer: {
      findMany: vi.fn(),
    },
    transactionItem: {
      findMany: vi.fn(),
    },
    staffTask: {
      findMany: vi.fn(),
    },
    staffShift: {
      findMany: vi.fn(),
    },
  },
}));

describe("McpService", () => {
  let mcpService: McpService;
  let mcpToolsService: McpToolsService;

  beforeEach(() => {
    vi.clearAllMocks();
    mcpToolsService = new McpToolsService();
    mcpService = new McpService(mcpToolsService);
  });

  describe("initialize", () => {
    it("should return standard MCP protocol initialize object", async () => {
      const res = await mcpService.initialize();
      expect(res.serverInfo.name).toBe("Scryme MCP Server");
      expect(res.capabilities.tools).toBeDefined();
    });
  });

  describe("listTools", () => {
    it("should return available MCP tool definitions", async () => {
      const res = await mcpService.listTools();
      expect(Array.isArray(res.tools)).toBe(true);
      expect(res.tools.some((t: any) => t.name === "query_inventory")).toBe(true);
      expect(res.tools.some((t: any) => t.name === "get_sales_analytics")).toBe(true);
    });
  });

  describe("validateApiKey", () => {
    it("should validate and return auth context when McpApiKey is found", async () => {
      vi.mocked(db.mcpApiKey.findFirst).mockResolvedValueOnce({
        id: "key_123",
        organizationId: "org_456",
        name: "Test MCP Key",
        scopes: ["mcp:read", "mcp:write"],
        expiresAt: null,
      } as any);

      vi.mocked(db.mcpApiKey.update).mockResolvedValueOnce({} as any);

      const auth = await mcpService.validateApiKey("Bearer mcp_live_testkey123456");
      expect(auth.organizationId).toBe("org_456");
      expect(auth.keyId).toBe("key_123");
    });

    it("should throw UnauthorizedException when key is missing or invalid", async () => {
      vi.mocked(db.mcpApiKey.findFirst).mockResolvedValueOnce(null);
      await expect(mcpService.validateApiKey("invalid_key")).rejects.toThrow("Invalid MCP API Key provided");
    });
  });

  describe("handleRpcRequest", () => {
    it("should process tools/list request", async () => {
      const auth = { keyId: "k1", organizationId: "org_1", name: "Test", scopes: ["mcp:read"] };
      const req = { jsonrpc: "2.0", id: 1, method: "tools/list" };
      const res = await mcpService.handleRpcRequest(req, auth);

      expect(res.jsonrpc).toBe("2.0");
      expect(res.id).toBe(1);
      expect(res.result.tools).toBeDefined();
    });

    it("should process tools/call request", async () => {
      vi.mocked(db.product.findMany).mockResolvedValueOnce([]);

      const auth = { keyId: "k1", organizationId: "org_1", name: "Test", scopes: ["mcp:read"] };
      const req = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "search_products", arguments: { query: "coffee" } },
      };

      const res = await mcpService.handleRpcRequest(req, auth);
      expect(res.result.isError).toBe(false);
      expect(res.result.content[0].text).toContain("products");
    });
  });
});
