import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { McpService } from "./mcp.service";

@ApiTags("v3-mcp")
@Controller("v3/mcp")
export class McpController {
  private readonly logger = new Logger(McpController.name);

  constructor(private readonly mcpService: McpService) {}

  private extractApiKey(headers: Record<string, any>, queryKey?: string): string {
    const authHeader = headers["authorization"] || headers["Authorization"];
    if (authHeader && typeof authHeader === "string") {
      if (authHeader.startsWith("Bearer ")) return authHeader.slice(7).trim();
      return authHeader.trim();
    }
    const headerKey = headers["x-mcp-api-key"] || headers["x-api-key"];
    if (headerKey && typeof headerKey === "string") return headerKey.trim();
    if (queryKey && typeof queryKey === "string") return queryKey.trim();

    throw new UnauthorizedException("Missing MCP API Key in Authorization header or x-mcp-api-key");
  }

  @Get("sse")
  @ApiOperation({ summary: "Establish MCP Server-Sent Events (SSE) connection stream" })
  async sseConnect(
    @Headers() headers: Record<string, any>,
    @Query("key") queryKey: string,
    @Res() res: Response,
  ) {
    const rawKey = this.extractApiKey(headers, queryKey);
    const auth = await this.mcpService.validateApiKey(rawKey);

    this.logger.log(`MCP SSE client connected orgId=${auth.organizationId}`);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Send endpoint URI event for standard MCP SSE transport
    const endpointUrl = "/v3/mcp/messages";
    res.write(`event: endpoint\ndata: ${endpointUrl}?org=${auth.organizationId}\n\n`);

    // Keep-alive heartbeat
    const keepAliveInterval = setInterval(() => {
      res.write(": keep-alive\n\n");
    }, 15000);

    res.on("close", () => {
      clearInterval(keepAliveInterval);
      this.logger.log(`MCP SSE client disconnected orgId=${auth.organizationId}`);
    });
  }

  @Post("messages")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Handle MCP JSON-RPC message for active SSE session" })
  async handleSseMessage(
    @Headers() headers: Record<string, any>,
    @Query("key") queryKey: string,
    @Body() body: any,
  ) {
    const rawKey = this.extractApiKey(headers, queryKey);
    const auth = await this.mcpService.validateApiKey(rawKey);
    return this.mcpService.handleRpcRequest(body, auth);
  }

  @Post("rpc")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Execute single MCP JSON-RPC 2.0 request" })
  async handleRpc(
    @Headers() headers: Record<string, any>,
    @Query("key") queryKey: string,
    @Body() body: any,
  ) {
    const rawKey = this.extractApiKey(headers, queryKey);
    const auth = await this.mcpService.validateApiKey(rawKey);
    return this.mcpService.handleRpcRequest(body, auth);
  }

  @Get("tools")
  @ApiOperation({ summary: "Get list of available MCP tools" })
  async getTools(@Headers() headers: Record<string, any>, @Query("key") queryKey: string) {
    const rawKey = this.extractApiKey(headers, queryKey);
    await this.mcpService.validateApiKey(rawKey);
    return this.mcpService.listTools();
  }

  @Post("tools/execute")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Directly execute an MCP tool by name and arguments" })
  async executeTool(
    @Headers() headers: Record<string, any>,
    @Query("key") queryKey: string,
    @Body() body: { name: string; arguments: Record<string, any> },
  ) {
    const rawKey = this.extractApiKey(headers, queryKey);
    const auth = await this.mcpService.validateApiKey(rawKey);
    return this.mcpService.callTool(body.name, body.arguments, auth);
  }

  @Get("resources")
  @ApiOperation({ summary: "Get list of available MCP resources" })
  async getResources(@Headers() headers: Record<string, any>, @Query("key") queryKey: string) {
    const rawKey = this.extractApiKey(headers, queryKey);
    await this.mcpService.validateApiKey(rawKey);
    return this.mcpService.listResources();
  }
}
