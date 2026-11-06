import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Headers,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AllowPublic } from "@/common/decorators/auth.decorator";
import { McpService, McpAuthContext } from "./mcp.service";
import { randomUUID } from "crypto";

@ApiTags("v3-mcp")
@Controller("mcp")
export class McpController {
  private readonly logger = new Logger(McpController.name);

  // Active Streamable HTTP Sessions map (sessionId -> auth context & metadata)
  private readonly activeSessions = new Map<
    string,
    {
      auth?: McpAuthContext;
      createdAt: number;
      lastActiveAt: number;
    }
  >();

  constructor(private readonly mcpService: McpService) {}

  private extractApiKey(headers: Record<string, any>, queryKey?: string): string | null {
    const authHeader = headers["authorization"] || headers["Authorization"];
    if (authHeader && typeof authHeader === "string") {
      if (authHeader.startsWith("Bearer ")) return authHeader.slice(7).trim();
      return authHeader.trim();
    }
    const headerKey = headers["x-mcp-api-key"] || headers["x-api-key"];
    if (headerKey && typeof headerKey === "string") return headerKey.trim();
    if (queryKey && typeof queryKey === "string") return queryKey.trim();

    return null;
  }

  private getAuthChallengeHeaders(req: any): Record<string, string> {
    const host =
      req.headers?.["x-forwarded-host"] || req.headers?.host || req.hostname || "api.scryme.tech";
    const proto = req.headers?.["x-forwarded-proto"] || req.protocol || "https";
    const origin = `${proto}://${host}`;
    const resourceMetadataUrl = `${origin}/.well-known/oauth-protected-resource/v3/mcp`;

    return {
      "WWW-Authenticate": `Bearer resource_metadata="${resourceMetadataUrl}"`,
    };
  }

  private setCorsHeaders(res: any) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-mcp-api-key, x-api-key, mcp-session-id, Mcp-Session-Id",
    );
    res.header("Access-Control-Expose-Headers", "mcp-session-id, Mcp-Session-Id");
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  }

  /**
   * MCP Streamable HTTP - GET Endpoint
   * Handles initialization / discovery probing and session opening
   */
  @AllowPublic()
  @Get()
  @ApiOperation({ summary: "MCP Streamable HTTP transport stream / session probe" })
  async handleGetStream(
    @Req() req: any,
    @Res() res: any,
    @Headers() headers: Record<string, any>,
    @Query("key") queryKey: string,
  ) {
    this.setCorsHeaders(res);

    const rawKey = this.extractApiKey(headers, queryKey);
    let auth: McpAuthContext | undefined;

    if (rawKey) {
      try {
        auth = await this.mcpService.validateApiKey(rawKey);
      } catch (e: any) {
        const challenge = this.getAuthChallengeHeaders(req);
        Object.entries(challenge).forEach(([k, v]) => res.header(k, v));
        return res.status(HttpStatus.UNAUTHORIZED).send({
          error: "Unauthorized",
          message: e.message || "Invalid credentials",
        });
      }
    }

    const sessionId = (headers["mcp-session-id"] || headers["Mcp-Session-Id"]) as string || randomUUID();
    this.activeSessions.set(sessionId, {
      auth,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    res.header("mcp-session-id", sessionId);

    // If client accepts event-stream, establish keep-alive streamable response
    const accept = (headers["accept"] || headers["Accept"] || "") as string;
    if (accept.includes("text/event-stream")) {
      res.header("Content-Type", "text/event-stream");
      res.header("Cache-Control", "no-cache");
      res.header("Connection", "keep-alive");

      // Send initial connect ping
      res.raw.write(`: connect\n\n`);

      const keepAliveInterval = setInterval(() => {
        try {
          res.raw.write(`: keep-alive\n\n`);
        } catch {
          clearInterval(keepAliveInterval);
        }
      }, 15000);

      res.raw.on("close", () => {
        clearInterval(keepAliveInterval);
        this.activeSessions.delete(sessionId);
      });

      return;
    }

    // Standard JSON response for HTTP GET probe
    return res.status(HttpStatus.OK).send({
      status: "ok",
      transport: "Streamable HTTP",
      version: "2024-11-05",
      sessionId,
      serverInfo: {
        name: "Scryme MCP Server",
        version: "10.2.30",
      },
    });
  }

  /**
   * MCP Streamable HTTP - POST Endpoint
   * Handles JSON-RPC 2.0 requests over Streamable HTTP transport
   */
  @AllowPublic()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "MCP Streamable HTTP JSON-RPC message handler" })
  async handlePostStream(
    @Req() req: any,
    @Res() res: any,
    @Headers() headers: Record<string, any>,
    @Query("key") queryKey: string,
    @Body() body: any,
  ) {
    this.setCorsHeaders(res);

    let sessionId = (headers["mcp-session-id"] || headers["Mcp-Session-Id"]) as string;
    if (!sessionId) {
      sessionId = randomUUID();
    }

    res.header("mcp-session-id", sessionId);

    const rawKey = this.extractApiKey(headers, queryKey);
    let auth: McpAuthContext | undefined;

    if (rawKey) {
      try {
        auth = await this.mcpService.validateApiKey(rawKey);
        this.activeSessions.set(sessionId, {
          auth,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
        });
      } catch (err: any) {
        const challenge = this.getAuthChallengeHeaders(req);
        Object.entries(challenge).forEach(([k, v]) => res.header(k, v));
        return res.status(HttpStatus.UNAUTHORIZED).send({
          jsonrpc: "2.0",
          id: body?.id || null,
          error: {
            code: -32000,
            message: err.message || "Unauthorized MCP credentials",
          },
        });
      }
    } else {
      const existingSession = this.activeSessions.get(sessionId);
      if (existingSession?.auth) {
        auth = existingSession.auth;
        existingSession.lastActiveAt = Date.now();
      }
    }

    // Check if the message is unauthenticated 'initialize', 'ping', or capability discovery
    const isInitOrDiscovery =
      body?.method === "initialize" ||
      body?.method === "notifications/initialized" ||
      body?.method === "ping";

    if (!auth && !isInitOrDiscovery) {
      const challenge = this.getAuthChallengeHeaders(req);
      Object.entries(challenge).forEach(([k, v]) => res.header(k, v));
      return res.status(HttpStatus.UNAUTHORIZED).send({
        jsonrpc: "2.0",
        id: body?.id || null,
        error: {
          code: -32000,
          message: "Authentication required to invoke MCP workspace operations. Please sign in or provide a valid Bearer token.",
        },
      });
    }

    // Handle batch requests or single request
    if (Array.isArray(body)) {
      const results = await Promise.all(
        body.map((item) =>
          this.mcpService.handleRpcRequest(
            item,
            auth || {
              keyId: "guest",
              organizationId: "",
              name: "Guest",
              scopes: [],
            },
          ),
        ),
      );
      return res.status(HttpStatus.OK).send(results);
    }

    const result = await this.mcpService.handleRpcRequest(
      body,
      auth || {
        keyId: "guest",
        organizationId: "",
        name: "Guest",
        scopes: [],
      },
    );

    return res.status(HttpStatus.OK).send(result);
  }

  /**
   * Delete session endpoint for Streamable HTTP transport
   */
  @AllowPublic()
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Terminate active MCP session" })
  async deleteSession(
    @Headers() headers: Record<string, any>,
    @Res() res: any,
  ) {
    this.setCorsHeaders(res);
    const sessionId = (headers["mcp-session-id"] || headers["Mcp-Session-Id"]) as string;
    if (sessionId) {
      this.activeSessions.delete(sessionId);
    }
    return res.status(HttpStatus.OK).send({ success: true });
  }

  /**
   * Direct JSON-RPC endpoint at /rpc
   */
  @Post("rpc")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Execute single MCP JSON-RPC 2.0 request" })
  async handleRpc(
    @Req() req: any,
    @Res() res: any,
    @Headers() headers: Record<string, any>,
    @Query("key") queryKey: string,
    @Body() body: any,
  ) {
    this.setCorsHeaders(res);
    const rawKey = this.extractApiKey(headers, queryKey);
    if (!rawKey) {
      const challenge = this.getAuthChallengeHeaders(req);
      Object.entries(challenge).forEach(([k, v]) => res.header(k, v));
      return res.status(HttpStatus.UNAUTHORIZED).send({
        jsonrpc: "2.0",
        id: body?.id || null,
        error: { code: -32000, message: "Missing MCP API Key or Bearer token" },
      });
    }
    const auth = await this.mcpService.validateApiKey(rawKey);
    const response = await this.mcpService.handleRpcRequest(body, auth);
    return res.status(HttpStatus.OK).send(response);
  }

  @Get("tools")
  @ApiOperation({ summary: "Get list of available MCP tools" })
  async getTools(
    @Req() req: any,
    @Res() res: any,
    @Headers() headers: Record<string, any>,
    @Query("key") queryKey: string,
  ) {
    this.setCorsHeaders(res);
    const rawKey = this.extractApiKey(headers, queryKey);
    if (!rawKey) {
      const challenge = this.getAuthChallengeHeaders(req);
      Object.entries(challenge).forEach(([k, v]) => res.header(k, v));
      return res.status(HttpStatus.UNAUTHORIZED).send({ message: "Missing MCP API Key" });
    }
    await this.mcpService.validateApiKey(rawKey);
    const tools = await this.mcpService.listTools();
    return res.status(HttpStatus.OK).send(tools);
  }

  @Post("tools/execute")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Directly execute an MCP tool by name and arguments" })
  async executeTool(
    @Req() req: any,
    @Res() res: any,
    @Headers() headers: Record<string, any>,
    @Query("key") queryKey: string,
    @Body() body: { name: string; arguments: Record<string, any> },
  ) {
    this.setCorsHeaders(res);
    const rawKey = this.extractApiKey(headers, queryKey);
    if (!rawKey) {
      const challenge = this.getAuthChallengeHeaders(req);
      Object.entries(challenge).forEach(([k, v]) => res.header(k, v));
      return res.status(HttpStatus.UNAUTHORIZED).send({ message: "Missing MCP API Key" });
    }
    const auth = await this.mcpService.validateApiKey(rawKey);
    const result = await this.mcpService.callTool(body.name, body.arguments, auth);
    return res.status(HttpStatus.OK).send(result);
  }

  @Get("resources")
  @ApiOperation({ summary: "Get list of available MCP resources" })
  async getResources(
    @Req() req: any,
    @Res() res: any,
    @Headers() headers: Record<string, any>,
    @Query("key") queryKey: string,
  ) {
    this.setCorsHeaders(res);
    const rawKey = this.extractApiKey(headers, queryKey);
    if (!rawKey) {
      const challenge = this.getAuthChallengeHeaders(req);
      Object.entries(challenge).forEach(([k, v]) => res.header(k, v));
      return res.status(HttpStatus.UNAUTHORIZED).send({ message: "Missing MCP API Key" });
    }
    await this.mcpService.validateApiKey(rawKey);
    const resources = await this.mcpService.listResources();
    return res.status(HttpStatus.OK).send(resources);
  }
}
