import { Module } from "@nestjs/common";
import { McpController } from "./mcp.controller";
import { McpService } from "./mcp.service";
import { McpToolsService } from "./mcp-tools.service";
import { McpDraftService } from "./mcp-draft.service";

@Module({
  controllers: [McpController],
  providers: [McpService, McpToolsService, McpDraftService],
  exports: [McpService, McpToolsService, McpDraftService],
})
export class McpModule {}
