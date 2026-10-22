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
  const apiKey = process.env.SCRYME_API_KEY || process.env.MCP_API_KEY;
  const baseUrl = (process.env.SCRYME_API_URL || "https://api.scryme.tech").replace(/\/$/, "");

  if (!apiKey) {
    console.error("Error: SCRYME_API_KEY or MCP_API_KEY environment variable is required.");
    process.exit(1);
  }

  const mcpApi = axios.create({
    baseURL: `${baseUrl}/v3/mcp`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });

  const server = new Server(
    {
      name: "scryme-mcp-server",
      version: "10.2.23",
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
      console.error("Error fetching tools from Scryme API:", error.message);
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
      return {
        content: [
          {
            type: "text",
            text: `Failed executing tool ${request.params.name}: ${error.response?.data?.message || error.message}`,
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
      console.error("Error fetching resources from Scryme API:", error.message);
      return { resources: [] };
    }
  });

  // Read resource handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    try {
      const response = await mcpApi.post("/rpc", {
        jsonrpc: "2.0",
        id: 1,
        method: "resources/read",
        params: { uri: request.params.uri },
      });
      if (response.data?.error) {
        throw new Error(response.data.error.message);
      }
      return response.data?.result || { contents: [] };
    } catch (error: any) {
      throw new Error(`Failed reading resource ${request.params.uri}: ${error.message}`);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Scryme MCP Stdio Server running successfully.");
}
