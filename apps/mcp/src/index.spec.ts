import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";

// Mock axios before importing index.ts so we don't trigger active network calls during setup
vi.mock("axios");

process.argv = ["node", "main.js"];
process.env.SCRYME_CLIENT_ID = "mock_client_id";
process.env.SCRYME_CLIENT_SECRET = "mock_client_secret";

import { Test } from "@nestjs/testing";
import { McpModule } from "./mcp.module";
import { AuthService } from "./auth.service";
import { McpServerService } from "./mcp-server.service";

describe("Scryme V3 MCP Server NestJS Architecture & Tool Suite", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("should bootstrap NestJS McpModule and register all enterprise tools", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [McpModule],
    }).compile();

    const mcpServerService = moduleRef.get<McpServerService>(McpServerService);
    mcpServerService.onModuleInit();

    const registeredTools: Record<string, any> = (mcpServerService.server as any)._registeredTools;
    expect(registeredTools).toBeDefined();

    const toolNames = Object.keys(registeredTools);
    expect(toolNames.length).toBeGreaterThanOrEqual(36);

    const expectedTools = [
      "get_products",
      "create_product",
      "get_services",
      "create_service",
      "get_customers",
      "register_customer",
      "update_customer",
      "get_customer_by_id",
      "delete_customer",
      "get_customer_addresses",
      "add_customer_address",
      "get_inventory",
      "trace_batch",
      "split_batch",
      "merge_batches",
      "get_orders",
      "create_order",
      "update_order_status",
      "get_crm_record",
      "create_crm_record",
      "create_crm_note",
      "get_crm_timeline",
      "get_expenses",
      "create_expense",
      "get_petty_cash_funds",
      "get_profit_loss",
      "get_members",
      "create_member",
      "get_stock_transfers",
      "create_stock_transfer",
      "receive_stock_transfer",
      "get_measurement_units",
      "get_cart",
      "add_to_cart",
      "remove_from_cart",
      "clear_cart",
    ];

    for (const toolName of expectedTools) {
      expect(toolNames).toContain(toolName);
      const tool = registeredTools[toolName];
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
    }

    const registeredResources: Record<string, any> = (mcpServerService.server as any)._registeredResources;
    expect(registeredResources).toBeDefined();
    expect(Object.keys(registeredResources)).toContain("scryme://system/status");

    const registeredPrompts: Record<string, any> = (mcpServerService.server as any)._registeredPrompts;
    expect(registeredPrompts).toBeDefined();
    expect(Object.keys(registeredPrompts)).toContain("sales_analysis");
    expect(Object.keys(registeredPrompts)).toContain("inventory_audit");
  });

  it("should validate and execute the token exchange flow via AuthService", async () => {
    const mockTokenResponse = {
      data: {
        success: true,
        timestamp: "2026-08-05T00:00:00.000Z",
        data: {
          access_token: "mock_jwt_access_token_123",
          token_type: "Bearer",
          expires_in: 3600,
        },
      },
    };

    vi.mocked(axios.post).mockResolvedValueOnce(mockTokenResponse);

    const moduleRef = await Test.createTestingModule({
      imports: [McpModule],
    }).compile();

    const authService = moduleRef.get<AuthService>(AuthService);
    await authService.ensureAuthenticated("test-org-slug");

    expect(axios.post).toHaveBeenCalled();
    expect(axios.defaults.baseURL).toBe("https://api.scryme.tech");
    expect(axios.defaults.headers.common["Authorization"]).toBe("Bearer mock_jwt_access_token_123");
    expect(axios.defaults.headers.common["x-org-slug"]).toBe("test-org-slug");
  });
});
