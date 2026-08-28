import { Controller, Get, Post, Req, Res, Query, Logger } from "@nestjs/common";
import { Request, Response } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { McpServerService } from "./mcp-server.service";

@Controller()
export class McpController {
  private readonly logger = new Logger(McpController.name);
  private transports: Record<string, SSEServerTransport> = {};

  constructor(private readonly mcpServerService: McpServerService) {}

  @Get("sse")
  async handleSse(@Req() req: Request, @Res() res: Response) {
    this.logger.log("Establish SSE connection request received.");
    const transport = new SSEServerTransport("/messages", res);
    this.logger.log(`New SSE session initialized: ${transport.sessionId}`);
    this.transports[transport.sessionId] = transport;

    res.on("close", () => {
      this.logger.log(`SSE session closed: ${transport.sessionId}`);
      delete this.transports[transport.sessionId];
    });

    await this.mcpServerService.server.connect(transport);
  }

  @Post("messages")
  async handleMessages(
    @Req() req: Request,
    @Res() res: Response,
    @Query("sessionId") sessionId: string
  ) {
    this.logger.log(`Post message received on SSE session: ${sessionId}`);
    if (!sessionId) {
      res.status(400).send("Bad request: Missing sessionId query parameter.");
      return;
    }

    const transport = this.transports[sessionId];
    if (!transport) {
      res.status(400).send(`No transport connection active for session: ${sessionId}`);
      return;
    }

    await transport.handlePostMessage(req, res, req.body);
  }
}
