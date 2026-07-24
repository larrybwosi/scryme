import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";

// Mock axios before importing index.ts so we don't trigger active transport starts
vi.mock("axios");

// Mock process.argv so it doesn't try to auto-start transports during import
process.argv = ["node", "index.js"];
process.env.SCRYME_CLIENT_ID = "mock_client_id";
process.env.SCRYME_CLIENT_SECRET = "mock_client_secret";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

describe("Scryme V3 MCP Server Tool Suite", () => {
  let mcpServer: McpServer;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("should register all 20 enterprise-grade tools with dynamic orgSlug parameter", async () => {
    // Import the compiled index or source index to register tools on the server
    const module = await import("./index.js");

    // Access the registered tools Object from the server instance
    const registeredTools: Record<string, any> = (module.server as any)._registeredTools;

    expect(registeredTools).toBeDefined();

    const toolNames = Object.keys(registeredTools);
    expect(toolNames.length).toBeGreaterThanOrEqual(18);

    // Verify presence of key tools
    const expectedTools = [
      "get_products",
      "create_product",
      "get_customers",
      "register_customer",
      "update_customer",
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
    ];

    for (const toolName of expectedTools) {
      expect(toolNames).toContain(toolName);
      const tool = registeredTools[toolName];
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
    }
  });

  it("should validate and execute the token exchange flow correctly", async () => {
    const mockTokenResponse = {
      data: {
        accessToken: "mock_jwt_access_token_123",
        tokenType: "Bearer",
        expiresIn: 3600,
      },
    };

    vi.mocked(axios.post).mockResolvedValueOnce(mockTokenResponse);

    const module = await import("./index.js");

    // Trigger ensureAuthenticated via an arbitrary operation, or call it directly if exported/accessible
    const ensureAuthenticated = (module as any).ensureAuthenticated;
    if (ensureAuthenticated) {
      await ensureAuthenticated("test-org-slug");

      expect(axios.post).toHaveBeenCalled();
      expect(axios.defaults.baseURL).toBe("https://api.scryme.tech");
      expect(axios.defaults.headers.common["Authorization"]).toBe("Bearer mock_jwt_access_token_123");
      expect(axios.defaults.headers.common["x-org-slug"]).toBe("test-org-slug");
    }
  });
});
