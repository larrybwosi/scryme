import { NestFactory } from "@nestjs/core";
import { McpModule } from "./mcp.module";
import { McpServerService } from "./mcp-server.service";
import { AuthService } from "./auth.service";

export * from "./mcp.module";
export * from "./auth.service";
export * from "./mcp-server.service";
export * from "./mcp.controller";

// Exported singleton instances for backward compatibility & testing
export const authService = new AuthService();
export const mcpServerService = new McpServerService(authService);
mcpServerService.onModuleInit();
export const server = mcpServerService.server;

export async function ensureAuthenticated(orgSlug?: string) {
  return authService.ensureAuthenticated(orgSlug);
}

export async function getMcpServices() {
  const app = await NestFactory.createApplicationContext(McpModule, { logger: false });
  const auth = app.get(AuthService);
  const mcp = app.get(McpServerService);
  return {
    authService: auth,
    mcpServerService: mcp,
    server: mcp.server,
  };
}
