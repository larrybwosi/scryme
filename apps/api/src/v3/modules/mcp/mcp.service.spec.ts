import { describe, it, expect, beforeEach, vi } from "vitest";
import { UnauthorizedException, NotFoundException, BadRequestException } from "@nestjs/common";
import jwt from "jsonwebtoken";
import { db } from "@repo/db";
import { McpService } from "./mcp.service";
import { McpToolsService } from "./mcp-tools.service";
import { McpDraftService } from "./mcp-draft.service";

vi.mock("@repo/db", () => ({
  db: {
    mcpApiKey: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    apiKey: {
      findFirst: vi.fn(),
    },
    oauthAccessToken: {
      findFirst: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    productVariant: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    transactionItem: {
      findMany: vi.fn(),
    },
    fulfillment: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    customer: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    staffTask: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    staffShift: {
      findMany: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
    },
    inventoryLocation: {
      findFirst: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
    },
    mcpDraftChange: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      return cb(db);
    }),
  },
}));

describe("McpService & Tools", () => {
  let mcpService: McpService;
  let mcpToolsService: McpToolsService;
  let mcpDraftService: McpDraftService;

  beforeEach(() => {
    vi.clearAllMocks();
    mcpDraftService = new McpDraftService();
    mcpToolsService = new McpToolsService(mcpDraftService);
    mcpService = new McpService(mcpToolsService);
  });

  describe("Authentication", () => {
    it("should authenticate with valid JWT Bearer token", async () => {
      const payload = {
        sub: "user_123",
        organizationId: "org_123",
        name: "Test User",
        scopes: ["mcp:read", "mcp:write"],
      };
      const token = jwt.sign(payload, "fallback-secret-for-dev", { algorithm: "HS256" });

      const auth = await mcpService.validateApiKey(`Bearer ${token}`);
      expect(auth.organizationId).toBe("org_123");
      expect(auth.keyId).toBe("user_123");
      expect(auth.name).toBe("Test User");
      expect(auth.scopes).toEqual(["mcp:read", "mcp:write"]);
    });

    it("should throw UnauthorizedException when JWT is missing organizationId claim", async () => {
      const token = jwt.sign({ sub: "user_123", scopes: ["mcp:read"] }, "fallback-secret-for-dev", { algorithm: "HS256" });

      await expect(mcpService.validateApiKey(`Bearer ${token}`)).rejects.toThrow(
        "JWT token is missing organizationId claim"
      );
    });

    it("should throw UnauthorizedException when token scopes are insufficient", async () => {
      const token = jwt.sign(
        { sub: "user_123", organizationId: "org_123", scopes: ["other:scope"] },
        "fallback-secret-for-dev",
        { algorithm: "HS256" }
      );

      await expect(mcpService.validateApiKey(`Bearer ${token}`)).rejects.toThrow(
        "Insufficient token scopes for MCP operations"
      );
    });

    it("should throw UnauthorizedException when key is expired", async () => {
      vi.mocked(db.mcpApiKey.findFirst).mockResolvedValueOnce({
        id: "key_expired",
        organizationId: "org_456",
        name: "Expired Key",
        scopes: ["mcp:read"],
        expiresAt: new Date(Date.now() - 10000),
      } as any);

      await expect(mcpService.validateApiKey("mcp_live_expired123456")).rejects.toThrow(
        "MCP API Key has expired"
      );
    });
  });

  describe("Tool Definitions & Read Handlers", () => {
    const authContext = {
      keyId: "k1",
      organizationId: "org_1",
      name: "Test",
      scopes: ["mcp:read", "mcp:write"],
    };

    it("should list all 23 available tools", async () => {
      const res = await mcpService.handleRpcRequest({ jsonrpc: "2.0", id: 1, method: "tools/list" }, authContext);
      expect(res.jsonrpc).toBe("2.0");
      expect(res.result.tools.length).toBe(23);

      const toolNames = res.result.tools.map((t: any) => t.name);
      expect(toolNames).toContain("query_inventory");
      expect(toolNames).toContain("search_products");
      expect(toolNames).toContain("list_orders");
      expect(toolNames).toContain("get_order_details");
      expect(toolNames).toContain("search_customers");
      expect(toolNames).toContain("get_sales_analytics");
      expect(toolNames).toContain("get_top_selling_products");
      expect(toolNames).toContain("list_staff_tasks");
      expect(toolNames).toContain("get_shift_schedules");
      // New tools
      expect(toolNames).toContain("list_drafts");
      expect(toolNames).toContain("get_draft_diff");
      expect(toolNames).toContain("publish_draft");
      expect(toolNames).toContain("revert_draft");
      expect(toolNames).toContain("discard_draft");
      expect(toolNames).toContain("create_product");
      expect(toolNames).toContain("update_product");
      expect(toolNames).toContain("update_product_price");
      expect(toolNames).toContain("create_order");
      expect(toolNames).toContain("update_order_status");
      expect(toolNames).toContain("fulfill_order");
      expect(toolNames).toContain("create_staff_task");
      expect(toolNames).toContain("assign_staff_task");
      expect(toolNames).toContain("update_staff_task_status");
    });
  });

  describe("Draft Lifecycle & Mutation Tools", () => {
    const authContext = {
      keyId: "k1",
      organizationId: "org_1",
      name: "Test",
      scopes: ["mcp:read", "mcp:write"],
    };

    it("should stage create_product as a DRAFT when autoPublish is false", async () => {
      vi.mocked(db.mcpDraftChange.create).mockResolvedValueOnce({
        id: "draft_prod_1",
        organizationId: "org_1",
        entityType: "PRODUCT",
        action: "CREATE",
        status: "DRAFT",
        targetId: null,
        summary: "Create product: Croissant (CRS-01)",
        payload: { name: "Croissant", sku: "CRS-01", categoryId: "cat_1" },
        diffSummary: { operation: "CREATE", fields: [] },
        createdAt: new Date(),
      } as any);

      const res = await mcpService.handleRpcRequest(
        {
          jsonrpc: "2.0",
          id: 10,
          method: "tools/call",
          params: {
            name: "create_product",
            arguments: {
              name: "Croissant",
              sku: "CRS-01",
              categoryId: "cat_1",
            },
          },
        },
        authContext
      );

      expect(res.result.isError).toBe(false);
      const parsed = JSON.parse(res.result.content[0].text);
      expect(parsed.draftId).toBe("draft_prod_1");
      expect(parsed.status).toBe("DRAFT");
      expect(db.product.create).not.toHaveBeenCalled();
    });

    it("should stage and immediately publish create_product when autoPublish is true", async () => {
      vi.mocked(db.mcpDraftChange.create).mockResolvedValueOnce({
        id: "draft_prod_auto",
        organizationId: "org_1",
        entityType: "PRODUCT",
        action: "CREATE",
        status: "DRAFT",
        targetId: null,
        summary: "Create product: Latte (LAT-01)",
        payload: { name: "Latte", sku: "LAT-01", categoryId: "cat_1" },
        createdAt: new Date(),
      } as any);

      vi.mocked(db.mcpDraftChange.findFirst).mockResolvedValueOnce({
        id: "draft_prod_auto",
        organizationId: "org_1",
        entityType: "PRODUCT",
        action: "CREATE",
        status: "DRAFT",
        payload: { name: "Latte", sku: "LAT-01", categoryId: "cat_1" },
      } as any);

      vi.mocked(db.category.findFirst).mockResolvedValueOnce({ id: "cat_1", organizationId: "org_1" } as any);
      vi.mocked(db.product.create).mockResolvedValueOnce({ id: "prod_latte_1", name: "Latte" } as any);
      vi.mocked(db.mcpDraftChange.update).mockResolvedValueOnce({ id: "draft_prod_auto", status: "APPLIED" } as any);

      const res = await mcpService.handleRpcRequest(
        {
          jsonrpc: "2.0",
          id: 11,
          method: "tools/call",
          params: {
            name: "create_product",
            arguments: {
              name: "Latte",
              sku: "LAT-01",
              categoryId: "cat_1",
              autoPublish: true,
            },
          },
        },
        authContext
      );

      expect(res.result.isError).toBe(false);
      const parsed = JSON.parse(res.result.content[0].text);
      expect(parsed.status).toBe("APPLIED");
      expect(parsed.success).toBe(true);
      expect(db.product.create).toHaveBeenCalled();
    });

    it("should publish a pending draft with publish_draft(confirm: true)", async () => {
      vi.mocked(db.mcpDraftChange.findFirst).mockResolvedValueOnce({
        id: "draft_task_1",
        organizationId: "org_1",
        entityType: "STAFF_TASK",
        action: "CREATE",
        status: "DRAFT",
        payload: { title: "Clean workstation", priority: "HIGH" },
      } as any);

      vi.mocked(db.staffTask.create).mockResolvedValueOnce({ id: "task_clean_1", title: "Clean workstation" } as any);
      vi.mocked(db.mcpDraftChange.update).mockResolvedValueOnce({ id: "draft_task_1", status: "APPLIED" } as any);

      const res = await mcpService.handleRpcRequest(
        {
          jsonrpc: "2.0",
          id: 12,
          method: "tools/call",
          params: {
            name: "publish_draft",
            arguments: { draftId: "draft_task_1", confirm: true },
          },
        },
        authContext
      );

      expect(res.result.isError).toBe(false);
      const parsed = JSON.parse(res.result.content[0].text);
      expect(parsed.status).toBe("APPLIED");
      expect(parsed.draftId).toBe("draft_task_1");
      expect(db.staffTask.create).toHaveBeenCalled();
    });

    it("should reject publish_draft if confirm is false or missing", async () => {
      const res = await mcpService.handleRpcRequest(
        {
          jsonrpc: "2.0",
          id: 13,
          method: "tools/call",
          params: {
            name: "publish_draft",
            arguments: { draftId: "draft_task_1", confirm: false },
          },
        },
        authContext
      );

      expect(res.result.isError).toBe(true);
      expect(res.result.content[0].text).toContain("Explicit confirmation required");
    });

    it("should revert an applied price update draft using previousState snapshot", async () => {
      vi.mocked(db.mcpDraftChange.findFirst).mockResolvedValueOnce({
        id: "draft_price_1",
        organizationId: "org_1",
        entityType: "PRICE",
        action: "UPDATE",
        status: "APPLIED",
        targetId: "var_101",
        previousState: { retailPrice: 15.0, wholesalePrice: 12.0, buyingPrice: 8.0 },
      } as any);

      vi.mocked(db.productVariant.updateMany).mockResolvedValueOnce({ count: 1 } as any);
      vi.mocked(db.mcpDraftChange.update).mockResolvedValueOnce({ id: "draft_price_1", status: "REVERTED" } as any);

      const res = await mcpService.handleRpcRequest(
        {
          jsonrpc: "2.0",
          id: 14,
          method: "tools/call",
          params: {
            name: "revert_draft",
            arguments: { draftId: "draft_price_1", confirm: true },
          },
        },
        authContext
      );

      expect(res.result.isError).toBe(false);
      const parsed = JSON.parse(res.result.content[0].text);
      expect(parsed.status).toBe("REVERTED");
      expect(db.productVariant.updateMany).toHaveBeenCalledWith({
        where: { id: "var_101", product: { organizationId: "org_1" } },
        data: {
          retailPrice: 15.0,
          wholesalePrice: 12.0,
          buyingPrice: 8.0,
        },
      });
    });

    it("should revert an applied order creation by marking status CANCELLED", async () => {
      vi.mocked(db.mcpDraftChange.findFirst).mockResolvedValueOnce({
        id: "draft_order_create_1",
        organizationId: "org_1",
        entityType: "ORDER",
        action: "CREATE",
        status: "APPLIED",
        targetId: "ord_101",
      } as any);

      vi.mocked(db.transaction.updateMany).mockResolvedValueOnce({ count: 1 } as any);
      vi.mocked(db.mcpDraftChange.update).mockResolvedValueOnce({ id: "draft_order_create_1", status: "REVERTED" } as any);

      const res = await mcpService.handleRpcRequest(
        {
          jsonrpc: "2.0",
          id: 15,
          method: "tools/call",
          params: {
            name: "revert_draft",
            arguments: { draftId: "draft_order_create_1", confirm: true },
          },
        },
        authContext
      );

      expect(res.result.isError).toBe(false);
      const parsed = JSON.parse(res.result.content[0].text);
      expect(parsed.status).toBe("REVERTED");
      expect(db.transaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ord_101", organizationId: "org_1" },
          data: expect.objectContaining({ status: "CANCELLED" }),
        })
      );
    });

    it("should discard a pending draft with discard_draft", async () => {
      vi.mocked(db.mcpDraftChange.findFirst).mockResolvedValueOnce({
        id: "draft_discard_1",
        organizationId: "org_1",
        status: "DRAFT",
      } as any);

      vi.mocked(db.mcpDraftChange.update).mockResolvedValueOnce({
        id: "draft_discard_1",
        status: "DISCARDED",
      } as any);

      const res = await mcpService.handleRpcRequest(
        {
          jsonrpc: "2.0",
          id: 16,
          method: "tools/call",
          params: {
            name: "discard_draft",
            arguments: { draftId: "draft_discard_1" },
          },
        },
        authContext
      );

      expect(res.result.isError).toBe(false);
      const parsed = JSON.parse(res.result.content[0].text);
      expect(parsed.status).toBe("DISCARDED");
    });

    it("should view diff using get_draft_diff", async () => {
      vi.mocked(db.mcpDraftChange.findFirst).mockResolvedValueOnce({
        id: "draft_diff_1",
        organizationId: "org_1",
        entityType: "PRICE",
        action: "UPDATE",
        status: "DRAFT",
        targetId: "var_1",
        summary: "Price update",
        payload: { retailPrice: 20 },
        previousState: { retailPrice: 15 },
        diffSummary: { operation: "UPDATE", fields: [{ field: "retailPrice", from: 15, to: 20 }] },
      } as any);

      const res = await mcpService.handleRpcRequest(
        {
          jsonrpc: "2.0",
          id: 17,
          method: "tools/call",
          params: {
            name: "get_draft_diff",
            arguments: { draftId: "draft_diff_1" },
          },
        },
        authContext
      );

      expect(res.result.isError).toBe(false);
      const parsed = JSON.parse(res.result.content[0].text);
      expect(parsed.id).toBe("draft_diff_1");
      expect(parsed.diffSummary.fields[0].from).toBe(15);
      expect(parsed.diffSummary.fields[0].to).toBe(20);
    });
  });
});
