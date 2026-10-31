import { describe, it, expect, beforeEach, vi } from "vitest";
import { McpService } from "./mcp.service";
import { McpToolsService } from "./mcp-tools.service";
import { db } from "@repo/db";
import jwt from "jsonwebtoken";

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
      expect(res.capabilities.resources).toBeDefined();
    });
  });

  describe("listTools", () => {
    it("should return 9 available MCP tool definitions", async () => {
      const res = await mcpService.listTools();
      expect(Array.isArray(res.tools)).toBe(true);
      expect(res.tools.length).toBe(9);

      const toolNames = res.tools.map((t: any) => t.name);
      expect(toolNames).toContain("query_inventory");
      expect(toolNames).toContain("search_products");
      expect(toolNames).toContain("list_orders");
      expect(toolNames).toContain("get_order_details");
      expect(toolNames).toContain("search_customers");
      expect(toolNames).toContain("get_sales_analytics");
      expect(toolNames).toContain("get_top_selling_products");
      expect(toolNames).toContain("list_staff_tasks");
      expect(toolNames).toContain("get_shift_schedules");
    });
  });

  describe("validateApiKey - Hybrid Authentication", () => {
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
      expect(auth.scopes).toEqual(["mcp:read", "mcp:write"]);
    });

    it("should validate and return auth context for a valid HS256 JWT Bearer token", async () => {
      const secret = "fallback-secret-for-dev";
      const token = jwt.sign(
        {
          sub: "user_789",
          organizationId: "org_jwt_999",
          name: "Test JWT User",
          scopes: ["mcp:read", "mcp:write"],
        },
        secret,
        { algorithm: "HS256" }
      );

      const auth = await mcpService.validateApiKey(`Bearer ${token}`);
      expect(auth.organizationId).toBe("org_jwt_999");
      expect(auth.keyId).toBe("user_789");
      expect(auth.name).toBe("Test JWT User");
      expect(auth.scopes).toEqual(["mcp:read", "mcp:write"]);
    });

    it("should reject JWT token if organizationId is missing", async () => {
      const secret = "fallback-secret-for-dev";
      const token = jwt.sign(
        {
          sub: "user_no_org",
          scopes: ["mcp:read"],
        },
        secret,
        { algorithm: "HS256" }
      );

      await expect(mcpService.validateApiKey(`Bearer ${token}`)).rejects.toThrow(
        "JWT token is missing organizationId claim"
      );
    });

    it("should reject JWT token if scopes do not include MCP access", async () => {
      const secret = "fallback-secret-for-dev";
      const token = jwt.sign(
        {
          sub: "user_limited",
          organizationId: "org_1",
          scopes: ["billing:read"],
        },
        secret,
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

    it("should throw UnauthorizedException when key is missing or invalid", async () => {
      vi.mocked(db.mcpApiKey.findFirst).mockResolvedValueOnce(null);
      await expect(mcpService.validateApiKey("invalid_key")).rejects.toThrow(
        "Invalid MCP API Key provided"
      );
    });
  });

  describe("handleRpcRequest & Tool Execution", () => {
    const authContext = {
      keyId: "k1",
      organizationId: "org_1",
      name: "Test",
      scopes: ["mcp:read", "mcp:write"],
    };

    it("should process tools/list request", async () => {
      const req = { jsonrpc: "2.0", id: 1, method: "tools/list" };
      const res = await mcpService.handleRpcRequest(req, authContext);

      expect(res.jsonrpc).toBe("2.0");
      expect(res.id).toBe(1);
      expect(res.result.tools.length).toBe(9);
    });

    it("should execute query_inventory tool", async () => {
      vi.mocked(db.product.findMany).mockResolvedValueOnce([
        {
          id: "prod_1",
          name: "Espresso Beans",
          sku: "ESP-001",
          barcode: "123456",
          variants: [
            {
              id: "var_1",
              name: "1kg Bag",
              sku: "ESP-1KG",
              retailPrice: "25.00",
              wholesalePrice: "20.00",
              buyingPrice: "15.00",
              variantStocks: [{ locationId: "loc_1", currentStock: 50 }],
            },
          ],
        },
      ] as any);

      const req = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "query_inventory", arguments: { search: "Espresso" } },
      };

      const res = await mcpService.handleRpcRequest(req, authContext);
      expect(res.result.isError).toBe(false);
      const parsed = JSON.parse(res.result.content[0].text);
      expect(parsed.count).toBe(1);
      expect(parsed.products[0].name).toBe("Espresso Beans");
      expect(parsed.products[0].variants[0].totalStock).toBe(50);
    });

    it("should execute list_orders tool", async () => {
      vi.mocked(db.transaction.findMany).mockResolvedValueOnce([
        {
          id: "tx_1",
          number: "ORD-1001",
          finalTotal: "150.00",
          subtotal: "130.00",
          taxTotal: "20.00",
          status: "COMPLETED",
          paymentStatus: "PAID",
          createdAt: new Date(),
          customer: { id: "c_1", name: "Alice", email: "alice@test.com" },
        },
      ] as any);

      const req = {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "list_orders", arguments: { status: "COMPLETED" } },
      };

      const res = await mcpService.handleRpcRequest(req, authContext);
      expect(res.result.isError).toBe(false);
      const parsed = JSON.parse(res.result.content[0].text);
      expect(parsed.count).toBe(1);
      expect(parsed.orders[0].number).toBe("ORD-1001");
    });

    it("should execute get_order_details tool", async () => {
      vi.mocked(db.transaction.findFirst).mockResolvedValueOnce({
        id: "tx_123",
        number: "ORD-9999",
        finalTotal: "200.00",
        items: [],
        payments: [],
      } as any);

      const req = {
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: { name: "get_order_details", arguments: { transactionId: "ORD-9999" } },
      };

      const res = await mcpService.handleRpcRequest(req, authContext);
      expect(res.result.isError).toBe(false);
      const parsed = JSON.parse(res.result.content[0].text);
      expect(parsed.id).toBe("tx_123");
    });

    it("should execute search_customers tool", async () => {
      vi.mocked(db.customer.findMany).mockResolvedValueOnce([
        {
          id: "cust_1",
          name: "Jane Doe",
          email: "jane@example.com",
          phone: "+123456789",
          loyaltyPoints: 120,
          createdAt: new Date(),
        },
      ] as any);

      const req = {
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: { name: "search_customers", arguments: { query: "Jane" } },
      };

      const res = await mcpService.handleRpcRequest(req, authContext);
      expect(res.result.isError).toBe(false);
      const parsed = JSON.parse(res.result.content[0].text);
      expect(parsed.count).toBe(1);
      expect(parsed.customers[0].email).toBe("jane@example.com");
    });

    it("should execute get_sales_analytics tool", async () => {
      vi.mocked(db.transaction.findMany).mockResolvedValueOnce([
        {
          finalTotal: "100.00",
          subtotal: "90.00",
          taxTotal: "10.00",
          discountTotal: "0.00",
        },
        {
          finalTotal: "200.00",
          subtotal: "180.00",
          taxTotal: "20.00",
          discountTotal: "0.00",
        },
      ] as any);

      const req = {
        jsonrpc: "2.0",
        id: 6,
        method: "tools/call",
        params: { name: "get_sales_analytics", arguments: { timeframe: "month" } },
      };

      const res = await mcpService.handleRpcRequest(req, authContext);
      expect(res.result.isError).toBe(false);
      const parsed = JSON.parse(res.result.content[0].text);
      expect(parsed.metrics.totalOrders).toBe(2);
      expect(parsed.metrics.grossRevenue).toBe(300);
      expect(parsed.metrics.avgOrderValue).toBe(150);
    });

    it("should execute get_top_selling_products tool", async () => {
      vi.mocked(db.transactionItem.findMany).mockResolvedValueOnce([
        { variantId: "v1", productName: "Croissant", quantity: 5, lineTotal: "25.00" },
        { variantId: "v1", productName: "Croissant", quantity: 3, lineTotal: "15.00" },
        { variantId: "v2", productName: "Latte", quantity: 2, lineTotal: "10.00" },
      ] as any);

      const req = {
        jsonrpc: "2.0",
        id: 7,
        method: "tools/call",
        params: { name: "get_top_selling_products", arguments: { limit: 5 } },
      };

      const res = await mcpService.handleRpcRequest(req, authContext);
      expect(res.result.isError).toBe(false);
      const parsed = JSON.parse(res.result.content[0].text);
      expect(parsed.count).toBe(2);
      expect(parsed.topProducts[0].name).toBe("Croissant");
      expect(parsed.topProducts[0].totalQuantity).toBe(8);
      expect(parsed.topProducts[0].totalRevenue).toBe(40);
    });

    it("should execute list_staff_tasks tool", async () => {
      vi.mocked(db.staffTask.findMany).mockResolvedValueOnce([
        {
          id: "task_1",
          title: "Restock shelves",
          description: "Aisle 4 restock",
          status: "PENDING",
          priority: "HIGH",
          dueDate: new Date(),
          createdAt: new Date(),
          member: { id: "m_1", user: { name: "Staff Bob", email: "bob@scryme.tech" } },
        },
      ] as any);

      const req = {
        jsonrpc: "2.0",
        id: 8,
        method: "tools/call",
        params: { name: "list_staff_tasks", arguments: { status: "PENDING" } },
      };

      const res = await mcpService.handleRpcRequest(req, authContext);
      expect(res.result.isError).toBe(false);
      const parsed = JSON.parse(res.result.content[0].text);
      expect(parsed.count).toBe(1);
      expect(parsed.tasks[0].title).toBe("Restock shelves");
    });

    it("should execute get_shift_schedules tool", async () => {
      vi.mocked(db.staffShift.findMany).mockResolvedValueOnce([
        {
          id: "shift_1",
          startTime: "09:00",
          endTime: "17:00",
          isActive: true,
          member: { id: "m_1", user: { name: "Staff Bob", email: "bob@scryme.tech" } },
          locationId: "loc_main",
        },
      ] as any);

      const req = {
        jsonrpc: "2.0",
        id: 9,
        method: "tools/call",
        params: { name: "get_shift_schedules", arguments: { date: "2026-10-31" } },
      };

      const res = await mcpService.handleRpcRequest(req, authContext);
      expect(res.result.isError).toBe(false);
      const parsed = JSON.parse(res.result.content[0].text);
      expect(parsed.count).toBe(1);
      expect(parsed.shifts[0].startTime).toBe("09:00");
    });
  });

  describe("MCP Resources", () => {
    const authContext = {
      keyId: "k1",
      organizationId: "org_1",
      name: "Test",
      scopes: ["mcp:read"],
    };

    it("should list available resources", async () => {
      const res = await mcpService.listResources();
      expect(res.resources.length).toBe(2);
      expect(res.resources.map((r: any) => r.uri)).toContain("scryme://analytics/summary");
      expect(res.resources.map((r: any) => r.uri)).toContain("scryme://inventory/summary");
    });

    it("should read scryme://analytics/summary resource", async () => {
      vi.mocked(db.transaction.findMany).mockResolvedValueOnce([]);
      const res = await mcpService.readResource("scryme://analytics/summary", authContext);
      expect(res.contents[0].uri).toBe("scryme://analytics/summary");
      expect(res.contents[0].mimeType).toBe("application/json");
      expect(res.contents[0].text).toContain("metrics");
    });

    it("should throw NotFoundException for unknown resource uri", async () => {
      await expect(mcpService.readResource("scryme://unknown/resource", authContext)).rejects.toThrow(
        "Resource with URI scryme://unknown/resource not found"
      );
    });
  });
});
