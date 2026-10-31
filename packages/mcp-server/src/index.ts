import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

export async function runServer() {
  const rawKey = process.env.SCRYME_API_KEY || process.env.MCP_API_KEY || process.env.SCRYME_TOKEN;
  const baseUrl = (process.env.SCRYME_API_URL || "https://api.scryme.tech").replace(/\/$/, "");

  if (!rawKey) {
    console.error("Error: SCRYME_API_KEY, MCP_API_KEY, or SCRYME_TOKEN environment variable is required.");
    process.exit(1);
  }

  const authHeader = rawKey.startsWith("Bearer ") ? rawKey : `Bearer ${rawKey}`;

  const mcpApi = axios.create({
    baseURL: `${baseUrl}/v3/mcp`,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });

  const server = new Server(
    {
      name: "scryme-mcp-server",
      version: "10.2.30",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    try {
      const response = await mcpApi.get("/tools");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching tools from Scryme API:", error.response?.data?.message || error.message);
      return { tools: [] };
    }
  });

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const response = await mcpApi.post("/tools/execute", {
        name: request.params.name,
        arguments: request.params.arguments || {},
      });
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      return {
        content: [
          {
            type: "text",
            text: `Failed executing tool ${request.params.name}: ${errorMsg}`,
          },
        ],
        isError: true,
      };
    }
  });

  // List resources handler
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    try {
      const response = await mcpApi.get("/resources");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching resources from Scryme API:", error.response?.data?.message || error.message);
      return { resources: [] };
    }
  });

  // Read resource handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    try {
      const response = await mcpApi.post("/rpc", {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "resources/read",
        params: { uri: request.params.uri },
      });
      if (response.data?.error) {
        throw new Error(response.data.error.message);
      }
      return response.data?.result || { contents: [] };
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      throw new Error(`Failed reading resource ${request.params.uri}: ${errorMsg}`);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Scryme MCP Stdio Server running successfully.");
}
