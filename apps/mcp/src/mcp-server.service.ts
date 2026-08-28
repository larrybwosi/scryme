import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { AuthService } from "./auth.service";

@Injectable()
export class McpServerService implements OnModuleInit {
  private readonly logger = new Logger(McpServerService.name);
  public readonly server = new McpServer({
    name: "scryme-v3",
    version: "1.0.0",
  });

  constructor(private readonly authService: AuthService) {}

  onModuleInit() {
    this.registerTools();
    this.registerResources();
    this.registerPrompts();
  }

  public async startStdioTransport() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.log("Scryme V3 MCP Server running on stdio");
  }

  private registerTools() {
    const v3 = this.authService.v3;
    const callSdk = (orgSlug: string, fn: (config?: any) => Promise<any>, additionalConfig?: any) =>
      this.authService.callSdk(orgSlug, fn, additionalConfig);

    // ==========================================
    // 1. CATALOG & SERVICES TOOLS
    // ==========================================

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
      "get_services",
      {
        description: "Retrieve list of bookable services for an organization",
        inputSchema: {
          orgSlug: z.string().describe("The organization's unique slug"),
        },
      },
      async ({ orgSlug }) => {
        return callSdk(orgSlug, (config) => v3.servicesGetServices(orgSlug, config));
      }
    );

    this.server.registerTool(
      "create_service",
      {
        description: "Create a new bookable service",
        inputSchema: {
          orgSlug: z.string().describe("The organization's unique slug"),
          name: z.string().describe("Service name"),
          description: z.string().optional().describe("Service description"),
          durationMinutes: z.number().describe("Duration in minutes"),
          price: z.number().describe("Base price"),
        },
      },
      async ({ orgSlug, ...dto }) => {
        return callSdk(orgSlug, (config) => v3.servicesCreateService(orgSlug, dto as any, config));
      }
    );

    // ==========================================
    // 2. CUSTOMER TOOLS
    // ==========================================

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
      "get_customer_by_id",
      {
        description: "Retrieve a customer profile by their unique ID",
        inputSchema: {
          orgSlug: z.string().describe("The organization's unique slug"),
          id: z.string().describe("The customer UUID"),
        },
      },
      async ({ orgSlug, id }) => {
        return callSdk(orgSlug, (config) => v3.customersGetCustomerById(orgSlug, id, config));
      }
    );

    this.server.registerTool(
      "delete_customer",
      {
        description: "Delete or deactivate a customer profile by their unique ID",
        inputSchema: {
          orgSlug: z.string().describe("The organization's unique slug"),
          id: z.string().describe("The customer UUID"),
        },
      },
      async ({ orgSlug, id }) => {
        return callSdk(orgSlug, (config) => v3.customersDelete(orgSlug, id, config));
      }
    );

    this.server.registerTool(
      "get_customer_addresses",
      {
        description: "Get all registered addresses for a customer",
        inputSchema: {
          orgSlug: z.string().describe("The organization's unique slug"),
          id: z.string().describe("The customer UUID"),
        },
      },
      async ({ orgSlug, id }) => {
        return callSdk(orgSlug, (config) => v3.customersGetAddresses(orgSlug, id, config));
      }
    );

    this.server.registerTool(
      "add_customer_address",
      {
        description: "Add a new address or update an existing one for a customer",
        inputSchema: {
          orgSlug: z.string().describe("The organization's unique slug"),
          id: z.string().describe("The customer UUID"),
          label: z.string().optional().describe("Label of address e.g. Home or Work"),
          street1: z.string().describe("Main street address"),
          street2: z.string().optional().describe("Suite/Apartment number"),
          city: z.string().describe("City name"),
          state: z.string().optional().describe("State/Province"),
          postalCode: z.string().optional().describe("Postal/ZIP code"),
          country: z.string().describe("Country name"),
          isDefault: z.boolean().optional().describe("Whether this is the default address"),
        },
      },
      async ({ orgSlug, id, ...addressDto }) => {
        return callSdk(orgSlug, (config) => v3.customersAddAddress(orgSlug, id, addressDto as any, config));
      }
    );

    // ==========================================
    // 3. INVENTORY TOOLS
    // ==========================================

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
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

    this.server.registerTool(
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
    // 10. CART TOOLS
    // ==========================================

    this.server.registerTool(
      "get_cart",
      {
        description: "Retrieve the active shopping cart by sessionId or customer ID",
        inputSchema: {
          orgSlug: z.string().describe("The organization's unique slug"),
          sessionId: z.string().optional().describe("The guest session ID"),
        },
      },
      async ({ orgSlug, sessionId }) => {
        return callSdk(orgSlug, (config) => v3.cartControllerGetCart(orgSlug, { sessionId } as any, config));
      }
    );

    this.server.registerTool(
      "add_to_cart",
      {
        description: "Add a product variant or service to the shopping cart",
        inputSchema: {
          orgSlug: z.string().describe("The organization's unique slug"),
          productId: z.string().optional().describe("UUID of product"),
          variantId: z.string().optional().describe("UUID of variant"),
          serviceId: z.string().optional().describe("UUID of service"),
          bookingDetails: z.any().optional().describe("Details of booking if service"),
          quantity: z.number().describe("Quantity of item to add"),
          sessionId: z.string().optional().describe("The guest session ID"),
          customerId: z.string().optional().describe("The customer ID"),
        },
      },
      async ({ orgSlug, ...dto }) => {
        return callSdk(orgSlug, (config) => v3.cartControllerAddToCart(orgSlug, dto as any, config));
      }
    );

    this.server.registerTool(
      "remove_from_cart",
      {
        description: "Remove a product variant or service from the shopping cart",
        inputSchema: {
          orgSlug: z.string().describe("The organization's unique slug"),
          productId: z.string().optional().describe("UUID of product"),
          variantId: z.string().optional().describe("UUID of variant"),
          serviceId: z.string().optional().describe("UUID of service"),
          sessionId: z.string().optional().describe("The guest session ID"),
          customerId: z.string().optional().describe("The customer ID"),
        },
      },
      async ({ orgSlug, ...dto }) => {
        return callSdk(orgSlug, (config) => v3.cartControllerRemoveFromCart(orgSlug, dto as any, config));
      }
    );

    this.server.registerTool(
      "clear_cart",
      {
        description: "Remove all items from the active shopping cart",
        inputSchema: {
          orgSlug: z.string().describe("The organization's unique slug"),
          sessionId: z.string().optional().describe("The guest session ID"),
        },
      },
      async ({ orgSlug, sessionId }) => {
        return callSdk(orgSlug, (config) => v3.cartControllerClearCart(orgSlug, { sessionId } as any, config));
      }
    );
  }

  private registerResources() {
    this.server.registerResource(
      "system_status",
      "scryme://system/status",
      {
        description: "Retrieve current Scryme V3 MCP Server status and engine details",
        mimeType: "application/json",
      },
      async (uri) => ({
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify({
              server: "scryme-v3",
              status: "online",
              framework: "NestJS Fastify",
              mcpVersion: "1.0.0",
              timestamp: new Date().toISOString(),
            }, null, 2),
          },
        ],
      })
    );
  }

  private registerPrompts() {
    this.server.registerPrompt(
      "sales_analysis",
      {
        description: "Generate an analysis prompt for organization sales and profit/loss reports",
        argsSchema: {
          orgSlug: z.string().describe("The organization's unique slug"),
          period: z.string().optional().describe("Time period e.g., monthly, quarterly, annual"),
        },
      },
      ({ orgSlug, period }) => ({
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please provide a detailed sales and profit/loss financial report for organization '${orgSlug}' covering the ${period || "current"} period.`,
            },
          },
        ],
      })
    );

    this.server.registerPrompt(
      "inventory_audit",
      {
        description: "Generate a prompt for conducting an inventory stock level audit",
        argsSchema: {
          orgSlug: z.string().describe("The organization's unique slug"),
          locationId: z.string().optional().describe("Specific location or warehouse UUID"),
        },
      },
      ({ orgSlug, locationId }) => ({
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Perform a comprehensive inventory stock level audit and batch trace for organization '${orgSlug}'${locationId ? ` at location '${locationId}'` : ""}. Identify low stock items and expiring batches.`,
            },
          },
        ],
      })
    );
  }
}
