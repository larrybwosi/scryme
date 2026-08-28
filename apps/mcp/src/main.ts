import { NestFactory } from "@nestjs/core";
import { McpModule } from "./mcp.module";
import { McpServerService } from "./mcp-server.service";
import { LoggerService } from "@nestjs/common";

export class StderrLogger implements LoggerService {
  log(message: any, ...optionalParams: any[]) {
    console.error(`[LOG]`, message, ...optionalParams);
  }
  error(message: any, ...optionalParams: any[]) {
    console.error(`[ERROR]`, message, ...optionalParams);
  }
  warn(message: any, ...optionalParams: any[]) {
    console.error(`[WARN]`, message, ...optionalParams);
  }
  debug(message: any, ...optionalParams: any[]) {
    console.error(`[DEBUG]`, message, ...optionalParams);
  }
  verbose(message: any, ...optionalParams: any[]) {
    console.error(`[VERBOSE]`, message, ...optionalParams);
  }
}

async function bootstrap() {
  const logger = new StderrLogger();
  const transportArg = process.argv.includes("--transport")
    ? process.argv[process.argv.indexOf("--transport") + 1]
    : null;
  const useSse = transportArg === "sse" || process.env.SCRYME_MCP_TRANSPORT === "sse";

  if (useSse) {
    const app = await NestFactory.create(McpModule, { logger });
    const port = process.env.SCRYME_MCP_PORT || process.env.PORT || 3001;
    await app.listen(port);
    logger.log(`Scryme V3 MCP NestJS Server listening on SSE port ${port}`);
  } else {
    // In stdio mode, stdout is strictly reserved for raw JSON-RPC protocol transport.
    // Ensure all NestJS framework and application logs output exclusively to stderr.
    const app = await NestFactory.createApplicationContext(McpModule, { logger });
    const mcpServerService = app.get(McpServerService);
    await mcpServerService.startStdioTransport();
  }
}

if (require.main === module || process.env.NODE_ENV !== "test") {
  bootstrap().catch((err) => {
    console.error("Fatal error starting Scryme V3 MCP Server:", err);
    process.exit(1);
  });
}
