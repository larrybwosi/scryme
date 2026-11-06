# 0005. Model Context Protocol (MCP) Functionality and Authentication

**Date**: 2026-10-31
**Status**: Accepted

## Summary

This specification defines the complete architecture, authentication protocols, transport channels, and tool definitions for the Scryme Model Context Protocol (MCP) server. External AI assistants (Claude Desktop, Cursor, Claude Code, and custom autonomous LLM agents) can securely interact with live Scryme workspace data via both Stdio CLI transport (`@scryme/mcp-server`) and remote Streamable HTTP endpoints (`/v3/mcp`).

## Context

Users and development teams increasingly rely on AI agent integrations (such as Claude Desktop and Cursor) to query workspace state, inspect inventory and orders, analyze sales trends, and coordinate staff operations. Previous MCP implementations lacked hybrid authentication (supporting only static API keys without JWT Bearer token fallback), suffered from packaging/build gaps in the Stdio CLI package, and required hardening of tool input schemas and tenant boundary isolation.

## Requirements

**User stories**:
- As a business user or developer, I want to authenticate AI clients using either an MCP API key (`mcp_live_...`), a BetterAuth OAuth2 access token, or a JWT Bearer token with `mcp:read` / `mcp:write` scopes, so that my assistants can securely connect across various client environments.
- As an AI client (Claude Desktop / Cursor / Claude Code), I want to connect via a lightweight Stdio CLI (`@repo/mcp-server` / `scryme-mcp`) or a remote Streamable HTTP stream (`/v3/mcp`), so that both local and cloud workflows are supported.
- As an unauthenticated client, I want to receive standard RFC 9728 Protected Resource Metadata challenge headers pointing to metadata discovery endpoints.
- As an organization administrator, I want all MCP tool invocations to be strictly tenant-isolated to my organization ID, preventing cross-tenant data leakage (BOLA/IDOR).
- As an AI model invoking tools, I want well-defined, complete JSON schemas with type constraints, descriptions, and reliable error responses across all workspace tools.

**Acceptance criteria**:
- **AC-1 (Hybrid Authentication)**: `McpService.validateApiKey` validates:
  1. MCP API Keys (`mcp_live_...` or hashed tokens) stored in `db.mcpApiKey` (with fallback to `db.apiKey`), checking active status and expiration.
  2. BetterAuth OAuth2 Access Tokens stored in `db.oauthAccessToken`, extracting active organization context and checking valid `mcp:read` / `mcp:write` scopes.
  3. HS256-signed JWT tokens using `JWT_SECRET`, extracting `organizationId`, user/member info, and ensuring valid scopes (`mcp:read`, `mcp:write`).
- **AC-2 (Tool Definitions & Execution)**: Catalog of 23 workspace tools is well-defined with complete JSON schemas and implemented with strict multi-tenant filtering:
  1. Inventory and product catalog tools (`query_inventory`, `search_products`).
  2. Sales, orders, and customer tools (`list_orders`, `get_order_details`, `search_customers`, `get_sales_analytics`, `get_top_selling_products`).
  3. Staff and operations tools (`list_staff_tasks`, `get_shift_schedules`).
  4. Staged draft lifecycle tools (`list_drafts`, `get_draft_diff`, `publish_draft`, `revert_draft`, `discard_draft`).
  5. Staged mutation tools for products (`create_product`, `update_product`, `update_product_price`).
  6. Staged mutation tools for orders (`create_order`, `update_order_status`, `fulfill_order`).
  7. Staged mutation tools for tasks (`create_staff_task`, `assign_staff_task`, `update_staff_task_status`).
- **AC-3 (MCP Resources)**: Supports standard MCP resources `scryme://analytics/summary` and `scryme://inventory/summary` scoped to the authenticated tenant.
- **AC-4 (Stdio CLI Package)**: `@repo/mcp-server` compiles both `dist/index.js` and `dist/index.d.ts`, reads configuration from `SCRYME_API_KEY`/`MCP_API_KEY` or Bearer tokens, and communicates over stdio using JSON-RPC 2.0.
- **AC-5 (Web Settings UI)**: Web application at `/integrations/mcp` provides key creation, revocation, clipboard copy, and instructions for Claude Desktop and Remote Streamable HTTP setups.
- **AC-6 (RFC 9728 Discovery)**: Unauthorized requests to `/v3/mcp` respond with `WWW-Authenticate: Bearer resource_metadata="https://api.scryme.tech/.well-known/oauth-protected-resource/v3/mcp"`.

## Design

### Architecture

```
+-------------------------------------------------------------+
|                     AI Client / Agent                       |
|   (Claude Desktop, Cursor, Terminal CLI, Autonomous Agent)  |
+------------------------------+------------------------------+
                               |
            +------------------+------------------+
            | (Stdio Transport)                   | (Remote Streamable HTTP)
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
                                       |  - Tenant Context     |
                                       |  - JSON-RPC Handler   |
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

### Security & Multi-Tenancy

1. **Authentication Token Parsing**: Supports `Authorization: Bearer <token>`, `x-mcp-api-key`, and `?key=` query parameters.
2. **Key Storage & Hashing**: Keys are generated as `mcp_live_<random_bytes>` and stored as SHA-256 hashes in `mcp_api_key`. Plaintext keys are never stored.
3. **BetterAuth OAuth Tokens**: Validates tokens in `oauth_access_token` and extracts the associated organization context.
4. **JWT Bearer Verification**: Decodes HS256 tokens using `JWT_SECRET`. Verifies `organizationId` presence and validates that the token carries required scopes (`mcp:read`, `mcp:write`).
5. **Data Isolation**: Every database query in `McpToolsService` explicitly scopes by `{ organizationId }`. Foreign relational entities (such as location or customer lookups) are also validated within the authenticated organization.
