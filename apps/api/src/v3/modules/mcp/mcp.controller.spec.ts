import { describe, it, expect, beforeEach, vi } from "vitest";
import { McpController } from "./mcp.controller";
import { McpService } from "./mcp.service";

describe("McpController Streamable HTTP & Auth Discovery", () => {
  let controller: McpController;
  let mcpService: Partial<McpService>;

  beforeEach(() => {
    mcpService = {
      validateApiKey: vi.fn(),
      handleRpcRequest: vi.fn(),
      listTools: vi.fn(),
      callTool: vi.fn(),
      listResources: vi.fn(),
    };
    controller = new McpController(mcpService as McpService);
  });

  const createMockRes = () => {
    const headers: Record<string, string> = {};
    const res: any = {
      header: vi.fn((k, v) => {
        headers[k] = v;
        return res;
      }),
      status: vi.fn(() => res),
      send: vi.fn((data) => data),
      raw: {
        write: vi.fn(),
        on: vi.fn(),
      },
    };
    res._headers = headers;
    return res;
  };

  it("GET /mcp probe returns Streamable HTTP info and session id", async () => {
    const res = createMockRes();
    const req = { headers: {}, protocol: "https", hostname: "api.scryme.tech" };

    const result = await controller.handleGetStream(req, res, {}, "");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(result.transport).toBe("Streamable HTTP");
    expect(result.sessionId).toBeDefined();
    expect(res.header).toHaveBeenCalledWith("mcp-session-id", expect.any(String));
  });

  it("POST /mcp initialize succeeds without credentials", async () => {
    const res = createMockRes();
    const req = { headers: {}, protocol: "https", hostname: "api.scryme.tech" };
    vi.mocked(mcpService.handleRpcRequest)!.mockResolvedValueOnce({
      jsonrpc: "2.0",
      id: 1,
      result: { protocolVersion: "2024-11-05", serverInfo: { name: "Scryme MCP Server" } },
    });

    const body = { jsonrpc: "2.0", id: 1, method: "initialize", params: {} };
    const result = await controller.handlePostStream(req, res, {}, "", body);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(result.result.serverInfo.name).toBe("Scryme MCP Server");
  });

  it("POST /mcp protected method without auth returns 401 with WWW-Authenticate header", async () => {
    const res = createMockRes();
    const req = {
      headers: { host: "api.scryme.tech" },
      protocol: "https",
      hostname: "api.scryme.tech",
    };

    const body = { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "query_inventory" } };
    const result = await controller.handlePostStream(req, res, {}, "", body);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.header).toHaveBeenCalledWith(
      "WWW-Authenticate",
      'Bearer resource_metadata="https://api.scryme.tech/.well-known/oauth-protected-resource/v3/mcp"'
    );
    expect(result.error.code).toBe(-32000);
  });

  it("POST /mcp with valid token succeeds and sets session", async () => {
    const res = createMockRes();
    const req = { headers: {}, protocol: "https", hostname: "api.scryme.tech" };
    vi.mocked(mcpService.validateApiKey)!.mockResolvedValueOnce({
      keyId: "k1",
      organizationId: "org_1",
      name: "Test",
      scopes: ["mcp:read"],
    });
    vi.mocked(mcpService.handleRpcRequest)!.mockResolvedValueOnce({
      jsonrpc: "2.0",
      id: 3,
      result: { tools: [] },
    });

    const headers = { authorization: "Bearer mcp_test_key" };
    const body = { jsonrpc: "2.0", id: 3, method: "tools/list", params: {} };
    const result = await controller.handlePostStream(req, res, headers, "", body);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(result.result.tools).toEqual([]);
  });
});
