import { Module } from "@nestjs/common";
import { McpController } from "./mcp.controller";
import { McpService } from "./mcp.service";
import { McpToolsService } from "./mcp-tools.service";

@Module({
  controllers: [McpController],
  providers: [McpService, McpToolsService],
  exports: [McpService, McpToolsService],
})
export class McpModule {}
