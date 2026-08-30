import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { McpServerService } from "./mcp-server.service";
import { McpController } from "./mcp.controller";

@Module({
  imports: [],
  controllers: [McpController],
  providers: [AuthService, McpServerService],
  exports: [AuthService, McpServerService],
})
export class McpModule {}
