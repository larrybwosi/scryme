# Scryme Model Context Protocol (MCP) Integration Guide

This guide provides comprehensive reference documentation for connecting external AI assistants, autonomous agent runtimes, and developer environments to the Scryme workspace data layer via the Model Context Protocol (MCP).

---

## 1. Architectural Overview

The Model Context Protocol establishes an open, bi-directional communication bridge between Large Language Model (LLM) agents and the Scryme platform. External systems can query live inventory, inspect sales aggregates, view shift schedules, and stage safe database modifications through tenant isolated boundaries.

```
+-------------------------------------------------------------+
|                     AI Client / Agent                       |
|   (Claude Desktop, Cursor, Claude Code, Autonomous Agent)   |
+------------------------------+------------------------------+
                               |
            +------------------+------------------+
            | (Stdio Transport)                   | (Streamable HTTP)
            v                                     v
+-----------------------+              +-----------------------+
|  @repo/mcp-server     |              |     NestJS API        |
|  (bin/cli.js -> stdio)|              |   /v3/mcp             |
+-----------+-----------+              |   /v3/mcp/rpc         |
            | (HTTP REST/RPC)          |   /v3/mcp/tools       |
            +------------------------->+   /v3/mcp/tools/execute
                                       +-----------+-----------+
                                                   |
                                                   v
                                       +-----------------------+
                                       |      McpService       |
                                       |  - Hybrid Auth        |
                                       |  - BetterAuth OAuth   |
                                       |  - RFC 9728 Discovery |
                                       |  - JSON-RPC 2.0 Engine|
                                       +-----------+-----------+
                                                   |
                                                   v
                                       +-----------------------+
                                       |    McpToolsService    |
                                       |  (23 Scoped Tools +   |
                                       |   2 Scoped Resources) |
                                       +-----------+-----------+
                                                   |
                                                   v
                                       +-----------------------+
                                       |    PostgreSQL (db)    |
                                       +-----------------------+
```

---

## 2. Supported Transports and Connections

Scryme provides dual connection protocols tailored to distinct client environments:

### A. Stdio CLI Transport (`@scryme/mcp-server`)
Designed for local desktop environments such as Claude Desktop, Cursor IDE, and Claude Code CLI. The host client executes the Node.js runner over standard input and standard output streams.

- Package: `@scryme/mcp-server` (or local monorepo `@repo/mcp-server`)
- Binary: `scryme-mcp`
- Execution: `npx -y @scryme/mcp-server`

### B. Streamable HTTP Transport (`/v3/mcp`)
Designed for remote services, cloud agents, serverless pipelines, and web applications. Supports JSON-RPC 2.0 messages over standard HTTP POST and persistent streaming event channels over HTTP GET.

- Base URL: `https://api.scryme.tech/v3/mcp`
- Session Header: `mcp-session-id` (client assigned UUID or server assigned upon initial connection)
- Keep-Alive Stream: `GET /v3/mcp` with `Accept: text/event-stream` sends periodic keep-alive comments
- JSON-RPC Message: `POST /v3/mcp` handles standard JSON-RPC 2.0 requests with batch and single message support

---

## 3. Authentication Pathways and Security Controls

Every incoming request must present valid authorization credentials. Scryme validates credentials through three distinct mechanisms:

### 1. Dedicated MCP API Keys (`mcp_live_...`)
- Recommended for all persistent assistant integrations and workstation configs.
- Keys are created from the web portal at `/integrations/mcp`.
- Keys are prefixed with `mcp_live_` followed by cryptographically secure random bytes.
- The server stores only cryptographic SHA-256 hashes inside `db.mcpApiKey`. Plaintext tokens are never persisted.
- Supported headers: `Authorization: Bearer <key>`, `x-mcp-api-key: <key>`, or URL query parameter `?key=<key>`.

### 2. BetterAuth OAuth 2.0 Access Tokens
- Supported for authenticated user sessions and OAuth application integrations.
- Tokens from `db.oauthAccessToken` are validated against expiration and revocation.
- Scopes required: `mcp:read` and `mcp:write` (or administrative wildcards).
- Organization context is automatically extracted from the active session or membership profile.

### 3. HS256 JWT Bearer Tokens
- Suitable for custom microservice agent runtimes.
- Signed using the system `JWT_SECRET`.
- The token payload must contain the `organizationId` claim and required scopes (`mcp:read`, `mcp:write`).

### 4. RFC 9728 OAuth Protected Resource Metadata
When an unauthenticated client initiates a request against `/v3/mcp`, the server returns `401 Unauthorized` accompanied by the standard RFC 9728 discovery challenge header:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://api.scryme.tech/.well-known/oauth-protected-resource/v3/mcp"
```

Clients can probe `https://api.scryme.tech/.well-known/oauth-protected-resource/v3/mcp` to automatically discover supported authorization servers, documentation links, and scopes (`mcp:read`, `mcp:write`).

---

## 4. Client Setup and Configuration Snippets

### Claude Desktop
Add the following block to your `claude_desktop_config.json`:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "scryme": {
      "command": "npx",
      "args": ["-y", "@scryme/mcp-server"],
      "env": {
        "SCRYME_API_KEY": "mcp_live_your_api_key_here",
        "SCRYME_API_URL": "https://api.scryme.tech"
      }
    }
  }
}
```

### Cursor IDE
Create or update `.cursor/mcp.json` in your workspace root:

```json
{
  "mcpServers": {
    "scryme": {
      "command": "npx",
      "args": ["-y", "@scryme/mcp-server"],
      "env": {
        "SCRYME_API_KEY": "mcp_live_your_api_key_here",
        "SCRYME_API_URL": "https://api.scryme.tech"
      }
    }
  }
}
```

### Claude Code CLI
Add Scryme directly using the Claude Code command line tool:

```bash
claude mcp add scryme -- npx -y @scryme/mcp-server
```

### Remote Streamable HTTP Endpoint Configuration
For MCP clients supporting remote HTTP endpoints:

```json
{
  "mcpServers": {
    "scryme-remote": {
      "url": "https://api.scryme.tech/v3/mcp",
      "headers": {
        "Authorization": "Bearer mcp_live_your_api_key_here"
      }
    }
  }
}
```

---

## 5. Direct HTTP and JSON-RPC Invocation Examples

### Direct Tool Execution Endpoint
Execute any tool directly via REST POST:

```bash
curl -X POST "https://api.scryme.tech/v3/mcp/tools/execute" \
  -H "Authorization: Bearer mcp_live_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "query_inventory",
    "arguments": {
      "search": "espresso",
      "limit": 5
    }
  }'
```

### Streamable HTTP JSON-RPC 2.0 Request
Execute standard JSON-RPC 2.0 calls with session tracking:

```bash
curl -X POST "https://api.scryme.tech/v3/mcp" \
  -H "Authorization: Bearer mcp_live_your_api_key_here" \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: session_xyz_12345" \
  -d '{
    "jsonrpc": "2.0",
    "id": 101,
    "method": "tools/call",
    "params": {
      "name": "get_sales_analytics",
      "arguments": {
        "timeframe": "month"
      }
    }
  }'
```

---

## 6. Staged Draft Lifecycle and Safety Controls

To prevent erratic modifications by automated agents, Scryme implements a staged draft engine backed by `db.mcpDraftChange`:

1. **Stage Proposed Change**: Mutations invoke tools (`create_product`, `update_product_price`, `create_order`, `create_staff_task`, etc.) to generate a staged draft change with status `DRAFT`.
2. **Review Diff**: Before applying, the assistant or operator can call `get_draft_diff` to review a structured JSON diff of proposed attributes.
3. **Publish Atomically**: Calling `publish_draft` with `confirm: true` executes the mutation inside an atomic ACID database transaction, captures an original `previousState` snapshot, and marks the draft `APPLIED`.
4. **Revert Anytime**: Calling `revert_draft` with `confirm: true` cleanly restores the entity to its prior state or cancels created records using the recorded snapshot.
5. **Auto Publish Option**: For trusted automated workflows, write tools accept `autoPublish: true` to stage and commit in a single execution.

---

## 7. Complete Catalog of MCP Tools (23 Tools)

### Inventory and Catalog Read Tools
| Tool Name | Parameters | Purpose |
|---|---|---|
| `query_inventory` | `search`, `locationId`, `limit` | Inspect variant stock levels, batch allocations, and location breakdown. |
| `search_products` | `query`, `categoryId`, `limit` | Query product catalog items, prices, barcodes, and categories. |

### Sales, Orders, and Analytics Read Tools
| Tool Name | Parameters | Purpose |
|---|---|---|
| `list_orders` | `status`, `customerId`, `startDate`, `endDate`, `limit` | Query transactions filtered by customer, status, or date range. |
| `get_order_details` | `transactionId` (required) | Retrieve complete order breakdown, line items, and fulfillment state. |
| `search_customers` | `query`, `limit` | Search customer contact info, profiles, and loyalty point totals. |
| `get_sales_analytics` | `timeframe` ("today", "week", "month", "year") | Calculate gross revenue, net revenue, tax, and average order value. |
| `get_top_selling_products` | `limit` | Rank top performing products by total revenue or quantity sold. |

### Staff and Operations Read Tools
| Tool Name | Parameters | Purpose |
|---|---|---|
| `list_staff_tasks` | `status`, `assignedMemberId`, `limit` | Review staff task assignments, priorities, and deadlines. |
| `get_shift_schedules` | `date`, `locationId` | View staff schedules, shifts, and attendance logs for a date. |

### Draft Management and Staging Tools
| Tool Name | Parameters | Purpose |
|---|---|---|
| `list_drafts` | `status`, `entityType`, `limit` | Inspect staged draft changes, execution state, and review statuses. |
| `get_draft_diff` | `draftId` (required) | View structured field level before and after diff comparison. |
| `publish_draft` | `draftId` (required), `confirm` (required boolean) | Commit a staged draft change live inside an ACID transaction. |
| `revert_draft` | `draftId` (required), `confirm` (required boolean) | Roll back an applied draft change using the recorded snapshot. |
| `discard_draft` | `draftId` (required) | Safely drop an unapplied staged draft change without touching tables. |

### Product Catalog Staged Mutations
| Tool Name | Parameters | Purpose |
|---|---|---|
| `create_product` | `name` (required), `sku`, `categoryId`, `description`, `barcode`, `variants`, `autoPublish` | Stage creation of a new product with category and initial variants. |
| `update_product` | `productId` (required), `name`, `description`, `categoryId`, `isActive`, `autoPublish` | Stage updates to product catalog attributes. |
| `update_product_price` | `variantId` (required), `retailPrice`, `wholesalePrice`, `buyingPrice`, `autoPublish` | Stage modifications to variant prices and costs. |

### Orders and Fulfillment Staged Mutations
| Tool Name | Parameters | Purpose |
|---|---|---|
| `create_order` | `locationId` (required), `items` (required), `customerId`, `notes`, `autoPublish` | Stage creation of a sales order with line items and location. |
| `update_order_status` | `transactionId` (required), `status` (required), `autoPublish` | Stage status transition on an existing sales order. |
| `fulfill_order` | `transactionId` (required), `trackingNumber`, `carrier`, `status`, `autoPublish` | Stage fulfillment dispatch details and tracking number. |

### Staff Task Assignment Staged Mutations
| Tool Name | Parameters | Purpose |
|---|---|---|
| `create_staff_task` | `title` (required), `description`, `priority`, `dueDate`, `memberId`, `locationId`, `autoPublish` | Stage creation of a task assignment for staff members. |
| `assign_staff_task` | `taskId` (required), `memberId` (required), `autoPublish` | Stage reassignment of an existing staff task. |
| `update_staff_task_status` | `taskId` (required), `status` (required), `autoPublish` | Stage task progression (TODO, IN_PROGRESS, COMPLETED, CANCELLED). |

---

## 8. Standard MCP Resources

Scryme exposes two pre-computed MCP resources for assistant grounding:

| Resource URI | MIME Type | Description |
|---|---|---|
| `scryme://analytics/summary` | `application/json` | Live gross revenue, net revenue, tax aggregates, and order counts for the active month. |
| `scryme://inventory/summary` | `application/json` | Snapshot of product variant stock levels, location allocations, and low stock items. |
