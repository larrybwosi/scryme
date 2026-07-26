# Scryme V3 Model Context Protocol (MCP) Server

An enterprise-grade Model Context Protocol (MCP) server designed to securely expose Scryme's ERP, inventory, and CRM workflows to LLM systems (such as Claude Desktop, Cursor, and custom AI agents).

This server uses the V3 SDK of the Scryme Monorepo, implementing rigorous multi-tenant security, secure token exchange, and concurrency-safe per-request scoping.

---

## 🚀 Key Features

- **26 Enterprise-Grade Tools**: Complete coverage of Scryme V3 endpoints across Catalog, Customers, Inventory (Batch operations), Orders, CRM (Timeline tracking), Finance (Expenses/P&L), Team Members, Stocking (Transfers), and Measurement Units.
- **Dynamic Credentials & Token Exchange**: Seamlessly exchanges client credentials (`SCRYME_CLIENT_ID` and `SCRYME_CLIENT_SECRET`) for JWT access tokens from the central identity provider.
- **Dual Transport Mechanisms**:
  - **`stdio`**: Standard input/output transport, optimized for single-user local applications like Claude Desktop.
  - **`sse`**: Server-Sent Events (SSE) web server, ideal for multi-connection, multi-tenant network integrations.
- **Multi-Tenant Concurrency Protection**: Explicitly maps and scopes requests per invocation, ensuring zero risk of global axios context leaks in multi-client environments.

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js** (v22 or later)
- **pnpm** (v9 or later)

### Installation

1. Build all required monorepo dependency packages first:
   ```bash
   pnpm --filter "@repo/v3-sdk" build
   ```
2. Build the MCP Server application:
   ```bash
   pnpm --filter mcp build
   ```

### Configuration Environment Variables

Configure the following environment variables in your runtime environment or `.env` file:

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
Standard mode is ideal for local desktop integrations like Claude:
```bash
# Start via pnpm
pnpm --filter mcp start

# Or run directly using Node
node apps/mcp/dist/index.js
```

### 2. Server-Sent Events Mode (`sse`)
SSE mode spawns an Express server listening for network connections:
```bash
# Start in SSE mode using environment variable
SCRYME_MCP_TRANSPORT=sse pnpm --filter mcp start

# Or start via the command line argument
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
      "args": ["/absolute/path/to/scryme/apps/mcp/dist/index.js"],
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
   - **Command**: `node /absolute/path/to/scryme/apps/mcp/dist/index.js`
4. Set the environment variables in your terminal or global environment before launching Cursor.

---

## 🧰 Available Tools Reference

The server exposes 26 comprehensive tools categorized by domain:

### 1. Catalog Tools
- **`get_products`**: Retrieve a paginated list of products for an organization.
  - Parameters: `orgSlug` (string, required), `limit` (number), `offset` (number)
- **`create_product`**: Create a new product inside the organization's catalog.
  - Parameters: `orgSlug` (string, required), `name` (string, required), `sku` (string, required), `price` (number, required), `costPrice` (number), `barcode` (string), `description` (string), `categoryIds` (array of strings)

### 2. Customer Tools
- **`get_customers`**: Retrieve list of registered customers.
  - Parameters: `orgSlug` (string, required), `limit` (number), `offset` (number)
- **`register_customer`**: Register a new customer profile.
  - Parameters: `orgSlug` (string, required), `email` (string, required), `name` (string, required), `phone` (string), `company` (string)
- **`update_customer`**: Update details of an existing customer.
  - Parameters: `orgSlug` (string, required), `id` (string, required), `name` (string), `phone` (string), `company` (string)

### 3. Inventory Tools
- **`get_inventory`**: Retrieve inventory levels for variants and warehouses.
  - Parameters: `orgSlug` (string, required), `locationId` (string), `limit` (number), `offset` (number)
- **`trace_batch`**: Trace an inventory stock batch by its ID or batch number.
  - Parameters: `orgSlug` (string, required), `identifier` (string, required)
- **`split_batch`**: Split an existing batch into child batches with specified quantities.
  - Parameters: `orgSlug` (string, required), `batchId` (string, required), `quantities` (array of numbers, required)
- **`merge_batches`**: Merge multiple inventory batches into a single batch.
  - Parameters: `orgSlug` (string, required), `batchIds` (array of strings, required)

### 4. Order Tools
- **`get_orders`**: Retrieve customer orders.
  - Parameters: `orgSlug` (string, required), `limit` (number), `offset` (number)
- **`create_order`**: Create a new customer order.
  - Parameters: `orgSlug` (string, required), `channel` (`POS`, `ONLINE`, `B2B`, `CRM`, required), `items` (array of objects, required), `customerId` (string)
- **`update_order_status`**: Update the status of an existing order.
  - Parameters: `orgSlug` (string, required), `id` (string, required), `status` (`PENDING`, `PROCESSING`, `COMPLETED`, `CANCELLED`, required)

### 5. CRM Tools
- **`get_crm_record`**: Retrieve a specific CRM contact, lead, or company record.
  - Parameters: `orgSlug` (string, required), `id` (string, required)
- **`create_crm_record`**: Create a new CRM record (Lead, Contact, Company).
  - Parameters: `orgSlug` (string, required), `type` (`LEAD`, `CONTACT`, `COMPANY`, required), `data` (object, required)
- **`create_crm_note`**: Add a note or timeline update to a CRM record.
  - Parameters: `orgSlug` (string, required), `recordId` (string, required), `content` (string, required)
- **`get_crm_timeline`**: Retrieve chronological timeline activities for a CRM record.
  - Parameters: `orgSlug` (string, required), `id` (string, required)

### 6. Finance Tools
- **`get_expenses`**: List recorded business expenses.
  - Parameters: `orgSlug` (string, required), `status` (`PENDING`, `APPROVED`, `REJECTED`), `categoryId` (string)
- **`create_expense`**: Record a new business expense.
  - Parameters: `orgSlug` (string, required), `amount` (number, required), `category` (string, required), `description` (string, required), `receiptUrl` (string)
- **`get_petty_cash_funds`**: Retrieve petty cash funds and active balances.
  - Parameters: `orgSlug` (string, required)
- **`get_profit_loss`**: Generate dynamic Profit and Loss (P&L) financial report.
  - Parameters: `orgSlug` (string, required), `startDate` (string), `endDate` (string)

### 7. Member Tools
- **`get_members`**: List organization members/staff.
  - Parameters: `orgSlug` (string, required), `role` (string)
- **`create_member`**: Invite or create a new team member.
  - Parameters: `orgSlug` (string, required), `email` (string, required), `name` (string, required), `role` (string, required)

### 8. Stocking Tools
- **`get_stock_transfers`**: List stock transfers between locations.
  - Parameters: `orgSlug` (string, required)
- **`create_stock_transfer`**: Initiate or request a stock transfer.
  - Parameters: `orgSlug` (string, required), `fromLocationId` (string, required), `toLocationId` (string, required), `priority` (`LOW`, `MEDIUM`, `HIGH`, required), `items` (array of objects, required)
- **`receive_stock_transfer`**: Record receiving stock transfer items at the destination.
  - Parameters: `orgSlug` (string, required), `id` (string, required), `items` (array of objects, required)

### 9. Units Tools
- **`get_measurement_units`**: Retrieve standard measurement units configuration.
  - Parameters: `orgSlug` (string, required)

---

## 🧪 Development and Testing

Run unit tests and type verification:
```bash
# Run Vitest unit tests
pnpm --filter mcp test

# Run TypeScript compilation check
pnpm --filter mcp type-check
```
