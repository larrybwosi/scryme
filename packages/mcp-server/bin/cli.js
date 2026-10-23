#!/usr/bin/env node
import { runServer } from "../dist/index.js";

runServer().catch((err) => {
  console.error("Fatal error starting Scryme MCP Server:", err);
  process.exit(1);
});
