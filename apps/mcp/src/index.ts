import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import express from "express";
import axios, { type AxiosResponse } from "axios";
import { getScrymeV3API } from "@repo/v3-sdk";

// Initialize the MCP Server with metadata
export const server = new McpServer({
  name: "scryme-v3",
  version: "1.0.0",
});

// V3 API client factory from our monorepo SDK
const v3 = getScrymeV3API();

// Token caching and refresh logic
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function ensureAuthenticated(orgSlug?: string) {
  const clientId = process.env.SCRYME_CLIENT_ID;
  const clientSecret = process.env.SCRYME_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing SCRYME_CLIENT_ID or SCRYME_CLIENT_SECRET environment variables. " +
      "Please configure these credentials so that the MCP server can authenticate with the V3 API."
    );
  }

  const now = Date.now();
  // Refresh if token is missing, or expiring in less than 5 minutes
  if (!cachedToken || now >= tokenExpiresAt - 300 * 1000) {
    console.error("Exchanging client credentials for a new V3 access token...");
    try {
      const apiBaseUrl = process.env.SCRYME_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://api.scryme.tech";
      const tokenUrl = `${apiBaseUrl}/v3/auth/token`;

      const response = await axios.post(tokenUrl, {
        clientId,
        clientSecret,
      }, {
        headers: { "Content-Type": "application/json" }
      });

      if (response.data && response.data.accessToken) {
        cachedToken = response.data.accessToken;
        const expiresIn = response.data.expiresIn || 3600;
        tokenExpiresAt = Date.now() + expiresIn * 1000;
        console.error("Successfully obtained new V3 access token.");
      } else {
        throw new Error("Invalid response format from token exchange endpoint.");
      }
    } catch (error: any) {
      console.error("Error exchanging client credentials:", error.message || error);
      throw error;
    }
  }

  // Set axios defaults for the SDK client (safe default fallback)
  axios.defaults.baseURL = process.env.SCRYME_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://api.scryme.tech";
  axios.defaults.headers.common["Authorization"] = `Bearer ${cachedToken}`;
  if (orgSlug) {
    axios.defaults.headers.common["x-org-slug"] = orgSlug;
  } else {
    delete axios.defaults.headers.common["x-org-slug"];
  }
}

// Enterprise SDK Call Helper with Automatic Token Verification/Refresh and Error Handling
async function callSdk<T>(
  orgSlug: string,
  fn: (config?: any) => Promise<AxiosResponse<T>>,
  additionalConfig: any = {}
): Promise<any> {
  await ensureAuthenticated(orgSlug);
  try {
    const config = {
      ...additionalConfig,
      headers: {
        ...additionalConfig?.headers,
        Authorization: `Bearer ${cachedToken}`,
        "x-org-slug": orgSlug,
      },
    };
    const response = await fn(config);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  } catch (error: any) {
    const errorPayload = error.response?.data || error.message || error;
    console.error("Scryme V3 API Call Error:", errorPayload);
    return {
      content: [
        {
          type: "text",
          text: `Error calling V3 API: ${JSON.stringify(errorPayload, null, 2)}`,
        },
      ],
      isError: true,
    };
  }
}

// ==========================================
// 1. CATALOG TOOLS
// ==========================================

server.registerTool(
  "get_products",
  {
    description: "Retrieve a paginated list of catalog products for an organization",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      limit: z.number().optional().describe("Number of products to return (default 20)"),
      offset: z.number().optional().describe("Offset for pagination (default 0)"),
    },
  },
  async ({ orgSlug, limit, offset }) => {
    return callSdk(orgSlug, (config) => v3.catalogGetProducts(orgSlug, { limit, offset } as any, config));
  }
);

server.registerTool(
  "create_product",
  {
    description: "Create a new product inside the organization's catalog",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      name: z.string().describe("Product name"),
      sku: z.string().describe("Stock Keeping Unit (SKU)"),
      barcode: z.string().optional().describe("Barcode or UPC"),
      description: z.string().optional().describe("Detailed description"),
      price: z.number().describe("Product selling price"),
      costPrice: z.number().optional().describe("Product cost price"),
      categoryIds: z.array(z.string()).optional().describe("Array of category IDs to associate"),
    },
  },
  async ({ orgSlug, ...dto }) => {
    return callSdk(orgSlug, (config) => v3.catalogCreateProduct(orgSlug, dto as any, config));
  }
);

// ==========================================
// 2. CUSTOMER TOOLS
// ==========================================

server.registerTool(
  "get_customers",
  {
    description: "Retrieve list of registered customers for an organization",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      limit: z.number().optional().describe("Number of customers to return (default 20)"),
      offset: z.number().optional().describe("Offset for pagination (default 0)"),
    },
  },
  async ({ orgSlug, limit, offset }) => {
    return callSdk(orgSlug, (config) => v3.customersGetCustomers(orgSlug, { limit, offset } as any, config));
  }
);

server.registerTool(
  "register_customer",
  {
    description: "Register a new customer profile",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      email: z.string().email().describe("Customer's email address"),
      name: z.string().describe("Customer's full name"),
      phone: z.string().optional().describe("Customer's phone number"),
      company: z.string().optional().describe("Customer's company or organization"),
    },
  },
  async ({ orgSlug, ...dto }) => {
    return callSdk(orgSlug, (config) => v3.customersRegister(orgSlug, dto as any, config));
  }
);

server.registerTool(
  "update_customer",
  {
    description: "Update details of an existing customer",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      id: z.string().describe("The customer UUID"),
      name: z.string().optional().describe("Updated customer full name"),
      phone: z.string().optional().describe("Updated customer phone number"),
      company: z.string().optional().describe("Updated customer company name"),
    },
  },
  async ({ orgSlug, id, ...dto }) => {
    return callSdk(orgSlug, (config) => v3.customersUpdate(orgSlug, id, dto as any, config));
  }
);

// ==========================================
// 3. INVENTORY TOOLS
// ==========================================

server.registerTool(
  "get_inventory",
  {
    description: "Retrieve inventory levels for an organization's variants and warehouses",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      locationId: z.string().optional().describe("Filter inventory levels by a specific location UUID"),
      limit: z.number().optional().describe("Number of items to return"),
      offset: z.number().optional().describe("Offset for pagination"),
    },
  },
  async ({ orgSlug, locationId, limit, offset }) => {
    return callSdk(orgSlug, (config) => v3.inventoryGetInventory(orgSlug, { locationId, limit, offset } as any, config));
  }
);

server.registerTool(
  "trace_batch",
  {
    description: "Trace an inventory stock batch by its ID or batch number",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      identifier: z.string().describe("Batch ID or batch number to trace"),
    },
  },
  async ({ orgSlug, identifier }) => {
    return callSdk(orgSlug, (config) => v3.inventoryTraceBatch(orgSlug, identifier, config));
  }
);

server.registerTool(
  "split_batch",
  {
    description: "Split an existing batch into child batches with specified quantities",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      batchId: z.string().describe("ID of the parent batch to split"),
      quantities: z.array(z.number()).describe("Array of quantities for the child batches"),
    },
  },
  async ({ orgSlug, batchId, quantities }) => {
    const splits = quantities.map((q) => ({ quantity: q }));
    return callSdk(
      orgSlug,
      (config) => v3.inventorySplitBatch(orgSlug, batchId, config),
      { data: { splits } }
    );
  }
);

server.registerTool(
  "merge_batches",
  {
    description: "Merge multiple inventory batches into a single batch",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      batchIds: z.array(z.string()).describe("Array of batch IDs to merge"),
    },
  },
  async ({ orgSlug, batchIds }) => {
    return callSdk(
      orgSlug,
      (config) => v3.inventoryMergeBatches(orgSlug, config),
      { data: { batchIds } }
    );
  }
);

// ==========================================
// 4. ORDER TOOLS
// ==========================================

server.registerTool(
  "get_orders",
  {
    description: "Retrieve orders for an organization",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      limit: z.number().optional().describe("Number of orders to return"),
      offset: z.number().optional().describe("Offset for pagination"),
    },
  },
  async ({ orgSlug, limit, offset }) => {
    return callSdk(orgSlug, (config) => v3.ordersGetOrders(orgSlug, { limit, offset } as any, config));
  }
);

server.registerTool(
  "create_order",
  {
    description: "Create a new customer order",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      customerId: z.string().optional().describe("UUID of the customer placing the order"),
      channel: z.enum(["POS", "ONLINE", "B2B", "CRM"]).describe("The sales channel"),
      items: z.array(z.object({
        variantId: z.string().describe("The product variant UUID"),
        quantity: z.number().describe("Quantity of items ordered"),
        unitPrice: z.number().describe("Price per item unit"),
      })).describe("List of items in the order"),
    },
  },
  async ({ orgSlug, ...dto }) => {
    return callSdk(orgSlug, (config) => v3.ordersCreateOrder(orgSlug, dto as any, config));
  }
);

server.registerTool(
  "update_order_status",
  {
    description: "Update the status of an existing order",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      id: z.string().describe("The order UUID"),
      status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"]).describe("The new order status"),
    },
  },
  async ({ orgSlug, id, status }) => {
    return callSdk(orgSlug, (config) => v3.ordersUpdateStatus(orgSlug, id, { status } as any, config));
  }
);

// ==========================================
// 5. CRM TOOLS
// ==========================================

server.registerTool(
  "get_crm_record",
  {
    description: "Retrieve a specific CRM contact, lead, or business account record",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      id: z.string().describe("The CRM record UUID"),
    },
  },
  async ({ orgSlug, id }) => {
    return callSdk(orgSlug, (config) => v3.crmControllerGetRecord(orgSlug, id, config));
  }
);

server.registerTool(
  "create_crm_record",
  {
    description: "Create a new CRM record (e.g. Lead, Contact, Company)",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      type: z.enum(["LEAD", "CONTACT", "COMPANY"]).describe("The CRM record type"),
      data: z.any().describe("CRM custom and standard fields mapping"),
    },
  },
  async ({ orgSlug, ...dto }) => {
    return callSdk(orgSlug, (config) => v3.crmControllerCreateRecord(orgSlug, dto as any, config));
  }
);

server.registerTool(
  "create_crm_note",
  {
    description: "Add a note or update to a CRM record timeline",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      recordId: z.string().describe("The parent CRM record UUID"),
      content: z.string().describe("Note markdown or text content"),
    },
  },
  async ({ orgSlug, ...dto }) => {
    return callSdk(orgSlug, (config) => v3.crmControllerCreateNote(orgSlug, dto as any, config));
  }
);

server.registerTool(
  "get_crm_timeline",
  {
    description: "Retrieve chronological timeline activities and notes for a CRM record",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      id: z.string().describe("The CRM record UUID"),
    },
  },
  async ({ orgSlug, id }) => {
    return callSdk(orgSlug, (config) => v3.crmControllerGetTimeline(orgSlug, id, config));
  }
);

// ==========================================
// 6. FINANCE TOOLS
// ==========================================

server.registerTool(
  "get_expenses",
  {
    description: "List recorded business expenses",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional().describe("Filter expenses by approval status"),
      categoryId: z.string().optional().describe("Filter expenses by category UUID"),
    },
  },
  async ({ orgSlug, status, categoryId }) => {
    return callSdk(orgSlug, (config) => v3.expenseControllerGetExpenses({ status, categoryId } as any, config));
  }
);

server.registerTool(
  "create_expense",
  {
    description: "Record a new business expense",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      amount: z.number().describe("Expense amount"),
      category: z.string().describe("Expense category (e.g., UTILITIES, RENT)"),
      description: z.string().describe("Brief description of the expense"),
      receiptUrl: z.string().optional().describe("Optional URL to the uploaded receipt"),
    },
  },
  async ({ orgSlug, ...dto }) => {
    return callSdk(orgSlug, (config) => v3.expenseControllerCreateExpense(dto as any, config));
  }
);

server.registerTool(
  "get_petty_cash_funds",
  {
    description: "Retrieve petty cash funds and their active balances",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
    },
  },
  async ({ orgSlug }) => {
    return callSdk(orgSlug, (config) => v3.pettyCashControllerGetFunds(config));
  }
);

server.registerTool(
  "get_profit_loss",
  {
    description: "Generate dynamic Profit and Loss (P&L) financial report",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      startDate: z.string().optional().describe("ISO date string for start of reporting period"),
      endDate: z.string().optional().describe("ISO date string for end of reporting period"),
    },
  },
  async ({ orgSlug, startDate, endDate }) => {
    return callSdk(orgSlug, (config) => v3.accountingGetProfitLoss(orgSlug, { startDate, endDate } as any, config));
  }
);

// ==========================================
// 7. MEMBER TOOLS
// ==========================================

server.registerTool(
  "get_members",
  {
    description: "List organization members/staff",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      role: z.string().optional().describe("Filter members by role"),
    },
  },
  async ({ orgSlug, role }) => {
    return callSdk(orgSlug, (config) => v3.membersControllerGetMembers(orgSlug, { role } as any, config));
  }
);

server.registerTool(
  "create_member",
  {
    description: "Invite or create a new team member",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      email: z.string().email().describe("Member's email address"),
      name: z.string().describe("Member's name"),
      role: z.string().describe("Role to assign (e.g., ADMIN, MANAGER, CASHIER)"),
    },
  },
  async ({ orgSlug, ...dto }) => {
    return callSdk(orgSlug, (config) => v3.membersControllerCreateMember(orgSlug, dto as any, config));
  }
);

// ==========================================
// 8. STOCKING TOOLS
// ==========================================

server.registerTool(
  "get_stock_transfers",
  {
    description: "List stock transfers between warehouses/locations",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
    },
  },
  async ({ orgSlug }) => {
    return callSdk(orgSlug, (config) => v3.stockingGetTransfers(orgSlug, undefined, config));
  }
);

server.registerTool(
  "create_stock_transfer",
  {
    description: "Initiate or request a stock transfer between locations",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      fromLocationId: z.string().describe("Source warehouse/location UUID"),
      toLocationId: z.string().describe("Destination warehouse/location UUID"),
      priority: z.enum(["LOW", "MEDIUM", "HIGH"]).describe("Transfer priority"),
      items: z.array(z.object({
        variantId: z.string().describe("Product variant UUID"),
        quantity: z.number().describe("Quantity to transfer"),
      })).describe("List of items to transfer"),
    },
  },
  async ({ orgSlug, ...dto }) => {
    return callSdk(orgSlug, (config) => v3.stockingCreateTransfer(orgSlug, dto as any, config));
  }
);

server.registerTool(
  "receive_stock_transfer",
  {
    description: "Record the receiving of stock transfer items at the destination",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
      id: z.string().describe("The transfer UUID to receive"),
      items: z.array(z.object({
        variantId: z.string().describe("Variant UUID"),
        quantity: z.number().describe("Quantity received"),
      })).describe("Received items list"),
    },
  },
  async ({ orgSlug, id, items }) => {
    return callSdk(orgSlug, (config) => v3.stockingReceiveTransfer(orgSlug, id, { items } as any, config));
  }
);

// ==========================================
// 9. UNITS TOOLS
// ==========================================

server.registerTool(
  "get_measurement_units",
  {
    description: "Retrieve standard measurement units configuration",
    inputSchema: {
      orgSlug: z.string().describe("The organization's unique slug"),
    },
  },
  async ({ orgSlug }) => {
    return callSdk(orgSlug, (config) => v3.unitsGetUnits(orgSlug, {}, config));
  }
);

// ==========================================
// RUNTIME TRANSPORTS SETUP
// ==========================================

async function runStdio() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Scryme V3 MCP Server running on stdio");
}

async function runSse() {
  const app = express();
  app.use(express.json());

  // Simultaneous connection lookup session Map
  const transports: Record<string, SSEServerTransport> = {};

  app.get("/sse", async (req, res) => {
    console.error("Establish SSE connection request received.");
    const transport = new SSEServerTransport("/messages", res);
    console.error(`New SSE session initialized: ${transport.sessionId}`);
    transports[transport.sessionId] = transport;

    res.on("close", () => {
      console.error(`SSE session closed: ${transport.sessionId}`);
      delete transports[transport.sessionId];
    });

    await server.connect(transport);
  });

  app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId as string;
    console.error(`Post message received on SSE session: ${sessionId}`);
    if (!sessionId) {
      res.status(400).send("Bad request: Missing sessionId query parameter.");
      return;
    }

    const transport = transports[sessionId];
    if (!transport) {
      res.status(400).send(`No transport connection active for session: ${sessionId}`);
      return;
    }

    await transport.handlePostMessage(req, res, req.body);
  });

  const port = process.env.SCRYME_MCP_PORT || process.env.PORT || 3001;
  app.listen(port, () => {
    console.error(`Scryme V3 MCP Server listening on SSE port ${port}`);
  });
}

// Check arguments or environment variables to determine transport type
const transportArg = process.argv.includes("--transport") ? process.argv[process.argv.indexOf("--transport") + 1] : null;
const useSse = transportArg === "sse" || process.env.SCRYME_MCP_TRANSPORT === "sse";

if (useSse) {
  runSse().catch((error) => {
    console.error("Fatal error starting SSE server:", error);
    process.exit(1);
  });
} else {
  runStdio().catch((error) => {
    console.error("Fatal error starting stdio server:", error);
    process.exit(1);
  });
}