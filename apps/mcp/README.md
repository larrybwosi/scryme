# Scryme V3 Model Context Protocol (MCP) NestJS Server

An enterprise-grade Model Context Protocol (MCP) server built with **NestJS**, designed to securely expose Scryme's ERP, inventory, CRM, and service booking workflows to LLM systems (such as Claude Desktop, Cursor, and custom AI agents).

This server uses the V3 SDK of the Scryme Monorepo, implementing multi-tenant security, secure token exchange, and lightweight NestJS SWC compilation for fast build times and low resource utilization.

---

## 🚀 Key Features

- **NestJS Framework Architecture**: Built with NestJS modules (`McpModule`), services (`AuthService`, `McpServerService`), and controllers (`McpController`).
- **Low Resource Usage & High Performance**: Powered by Nest CLI and SWC compiler, compiling in milliseconds without heavy type-declaration bundlers.
- **Enterprise-Grade Tools**: Complete coverage across Catalog, Services, Customers, Inventory (Batch operations), Orders, CRM (Timeline tracking), Finance (Expenses/P&L), Team Members, Stocking (Transfers), Measurement Units, and Shopping Cart.
- **Dynamic Credentials & Token Exchange**: Seamlessly exchanges client credentials (`SCRYME_CLIENT_ID` and `SCRYME_CLIENT_SECRET`) for JWT access tokens.
- **Dual Transport Mechanisms**:
  - **`stdio`**: Standard input/output transport via NestJS ApplicationContext, optimized for single-user desktop applications like Claude Desktop.
  - **`sse`**: Server-Sent Events (SSE) web server via NestJS Express Controller, ideal for multi-connection network integrations.

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js** (v22 or later)
- **pnpm** (v10 or later)

### Installation & Building

1. Build required monorepo dependency packages first:
   ```bash
   pnpm --filter "@scryme/sdk" build
   ```
2. Build the MCP Server application with Nest CLI:
   ```bash
   pnpm --filter mcp build
   ```

### Configuration Environment Variables

| Variable | Description | Default | Required |
|---|---|---|---|
| `SCRYME_CLIENT_ID` | Your Scryme developer client ID | - | **Yes** |
| `SCRYME_CLIENT_SECRET` | Your Scryme developer client secret | - | **Yes** |
| `SCRYME_API_URL` | The Scryme V3 API base URL | `https://api.scryme.tech` | No |
| `SCRYME_MCP_TRANSPORT` | Server transport type (`stdio` or `sse`) | `stdio` | No |
| `SCRYME_MCP_PORT` | Port number for the SSE server | `3001` | No |

---

## 💻 How to Run the Server

### 1. Standard Input/Output Mode (`stdio`)
```bash
# Start via pnpm
pnpm --filter mcp start

# Or run directly using Node
node apps/mcp/dist/src/main.js
```

### 2. Server-Sent Events Mode (`sse`)
```bash
# Start in SSE mode using environment variable
SCRYME_MCP_TRANSPORT=sse pnpm --filter mcp start

# Or start via command line argument
pnpm --filter mcp start -- --transport sse
```

---

## 🔌 Integration Guides

### Integration with Claude Desktop

Add the Scryme MCP server configuration to your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "scryme-v3": {
      "command": "node",
      "args": ["/absolute/path/to/scryme/apps/mcp/dist/src/main.js"],
      "env": {
        "SCRYME_CLIENT_ID": "your_client_id_here",
        "SCRYME_CLIENT_SECRET": "your_client_secret_here",
        "SCRYME_API_URL": "https://api.scryme.tech"
      }
    }
  }
}
```

### Integration with Cursor

1. Open Cursor Settings -> **Features** -> **MCP**.
2. Click **+ Add New MCP Server**.
3. Fill in the dialog:
   - **Name**: `Scryme V3`
   - **Type**: `command`
   - **Command**: `node /absolute/path/to/scryme/apps/mcp/dist/src/main.js`

---

## 🧪 Development and Testing

Run unit tests and type verification:
```bash
# Run Vitest unit tests
pnpm --filter mcp test

# Run TypeScript compilation check
pnpm --filter mcp type-check
```
