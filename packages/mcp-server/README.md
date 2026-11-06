# Scryme MCP Server (`@scryme/mcp-server`)

The Model Context Protocol (MCP) stdio server package for Scryme. It enables Claude Desktop, Cursor IDE, Claude Code, and other local AI assistants to safely query live inventory, view sales analytics, list tasks, and stage modifications within your organization workspace.

---

## Installation and Execution

You do not need to install this package permanently on your machine. You can invoke it dynamically using `npx`:

```bash
npx -y @scryme/mcp-server
```

Or install it globally:

```bash
npm install -g @scryme/mcp-server
scryme-mcp
```

---

## Environment Configuration

Configure the following environment variables when integrating the server into your assistant:

| Variable | Description | Default |
|---|---|---|
| `SCRYME_API_KEY` | Dedicated MCP API key starting with `mcp_live_` or Bearer token (required) | None |
| `MCP_API_KEY` | Alternative key parameter if `SCRYME_API_KEY` is not set | None |
| `SCRYME_TOKEN` | Bearer token alias if API keys are not specified | None |
| `SCRYME_API_URL` | Base Scryme API URL | `https://api.scryme.tech` |

---

## Assistant Configuration Snippets

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "scryme": {
      "command": "npx",
      "args": ["-y", "@scryme/mcp-server"],
      "env": {
        "SCRYME_API_KEY": "mcp_live_your_key_here",
        "SCRYME_API_URL": "https://api.scryme.tech"
      }
    }
  }
}
```

### Cursor IDE (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "scryme": {
      "command": "npx",
      "args": ["-y", "@scryme/mcp-server"],
      "env": {
        "SCRYME_API_KEY": "mcp_live_your_key_here",
        "SCRYME_API_URL": "https://api.scryme.tech"
      }
    }
  }
}
```

### Claude Code CLI

```bash
claude mcp add scryme -- npx -y @scryme/mcp-server
```

---

## Architecture

This package operates as a lightweight bridge:
1. Spawns an MCP stdio transport communicating via standard JSON-RPC 2.0 messages.
2. Proxies requests to the Scryme V3 API (`/v3/mcp/tools`, `/v3/mcp/tools/execute`, `/v3/mcp/resources`, `/v3/mcp/rpc`).
3. Attaches authentication headers and enforces tenant boundary validation on the Scryme backend.
