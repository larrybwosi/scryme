# 0005. Model Context Protocol (MCP) Functionality and Authentication

**Date**: 2026-10-31
**Status**: Proposed

## Summary

This specification defines the complete architecture, authentication protocols, transport channels, and tool definitions for the Scryme Model Context Protocol (MCP) server. External AI assistants (Claude Desktop, Cursor, and custom autonomous LLM agents) can securely interact with live Scryme workspace data via both Stdio CLI transport (`@scryme/mcp-server`) and remote HTTP / Server-Sent Events (SSE) endpoints.

## Context

Users and development teams increasingly rely on AI agent integrations (such as Claude Desktop and Cursor) to query workspace state, inspect inventory and orders, analyze sales trends, and coordinate staff operations. Previous MCP implementations lacked hybrid authentication (supporting only static API keys without JWT Bearer token fallback), suffered from packaging/build gaps in the Stdio CLI package, and required hardening of tool input schemas and tenant boundary isolation.

## Requirements

**User stories**:
- As a business user or developer, I want to authenticate AI clients using either an MCP API key (`mcp_live_...`) or an OAuth2 / JWT Bearer token with `mcp:read` / `mcp:write` scopes, so that my assistants can securely connect across various client environments.
- As an AI client (Claude Desktop / Cursor), I want to connect via a lightweight Stdio CLI (`@repo/mcp-server` / `scryme-mcp`) or a remote HTTP/SSE stream (`/v3/mcp/sse`), so that both local and cloud workflows are supported.
- As an organization administrator, I want all MCP tool invocations to be strictly tenant-isolated to my organization ID, preventing cross-tenant data leakage (BOLA/IDOR).
- As an AI model invoking tools, I want well-defined, complete JSON schemas with type constraints, descriptions, and reliable error responses across all 9 core workspace tools.

**Acceptance criteria**:
- **AC-1 (Hybrid Authentication)**: `McpService.validateApiKey` validates either:
  1. MCP API Keys (`mcp_live_...` or hashed tokens) stored in `db.mcpApiKey` (with fallback to `db.apiKey`), checking active status and expiration.
  2. HS256-signed JWT tokens using `JWT_SECRET`, extracting `organizationId`, user/member info, and ensuring valid scopes (`mcp:read`, `mcp:write`).
- **AC-2 (Tool Definitions & Execution)**: Exactly 9 core tools are well-defined with complete JSON schemas and implemented with strict multi-tenant filtering:
  1. `query_inventory`: stock levels, variant stocks, locations.
  2. `search_products`: product catalog search with category & name filters.
  3. `list_orders`: order history with status, date range, and customer filters.
  4. `get_order_details`: single transaction breakdown by ID or order number.
  5. `search_customers`: customer profiles, contact info, and loyalty points.
  6. `get_sales_analytics`: financial revenue summaries and metrics.
  7. `get_top_selling_products`: top products by sales revenue and quantity.
  8. `list_staff_tasks`: staff task assignments, priority, and status.
  9. `get_shift_schedules`: staff shift schedules and active attendance.
- **AC-3 (MCP Resources)**: Supports standard MCP resources `scryme://analytics/summary` and `scryme://inventory/summary` scoped to the authenticated tenant.
- **AC-4 (Stdio CLI Package)**: `@repo/mcp-server` compiles both `dist/index.js` and `dist/index.d.ts`, reads configuration from `SCRYME_API_KEY`/`MCP_API_KEY` or Bearer tokens, and communicates over stdio using JSON-RPC 2.0.
- **AC-5 (Web Settings UI)**: Web application at `/integrations/mcp` provides key creation, revocation, clipboard copy, and instructions for Claude Desktop and Remote SSE setups.

## Design

### Architecture

```
+-------------------------------------------------------------+
|                     AI Client / Agent                       |
|   (Claude Desktop, Cursor, Terminal CLI, Autonomous Agent)  |
+------------------------------+------------------------------+
                               |
            +------------------+------------------+
            | (Stdio Transport)                   | (Remote HTTP / SSE)
            v                                     v
+-----------------------+              +-----------------------+
|  @repo/mcp-server     |              |     NestJS API        |
|  (bin/cli.js -> stdio)|              |   /v3/mcp/sse         |
+-----------+-----------+              |   /v3/mcp/rpc         |
            | (HTTP REST/RPC)          |   /v3/mcp/tools       |
            +------------------------->+   /v3/mcp/messages    |
                                       +-----------+-----------+
                                                   |
                                                   v
                                       +-----------------------+
                                       |      McpService       |
                                       |  - Hybrid Auth        |
                                       |  - Tenant Context     |
                                       |  - JSON-RPC Handler   |
                                       +-----------+-----------+
                                                   |
                                                   v
                                       +-----------------------+
                                       |    McpToolsService    |
                                       |  (9 Scoped Tools +    |
                                       |   2 Scoped Resources) |
                                       +-----------+-----------+
                                                   |
                                                   v
                                       +-----------------------+
                                       |    PostgreSQL (db)    |
                                       +-----------------------+
```

### Security & Multi-Tenancy

1. **Authentication Token Parsing**: Supports `Authorization: Bearer <token>`, `x-mcp-api-key`, and `?key=` query parameters.
2. **Key Storage & Hashing**: Keys are generated as `mcp_live_<random_bytes>` and stored as SHA-256 hashes in `mcp_api_key`. Plaintext keys are never stored.
3. **JWT Bearer Verification**: Decodes HS256 tokens using `JWT_SECRET`. Verifies `organizationId` presence and validates that the token carries required scopes (`mcp:read`, `mcp:write`).
4. **Data Isolation**: Every database query in `McpToolsService` explicitly scopes by `{ organizationId }`. Foreign relational entities (such as location or customer lookups) are also validated within the authenticated organization.
