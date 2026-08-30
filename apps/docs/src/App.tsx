// App.tsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  Copy,
  Check,
  Terminal,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Code,
  Lock,
  Menu,
  X,
  Workflow,
  RefreshCw,
  Sun,
  Moon,
  Play,
  Send,
  ArrowLeft,
  ArrowRight,
  Fingerprint,
  Download,
} from "lucide-react";
import openapiSpec from "./openapi.json";
import CmsCustomizationGuide, {
  PRESETS,
  type CmsSimulatorState,
} from "./components/CmsCustomizationGuide";
import GlobalResponseGuide from "./components/GlobalResponseGuide";
import InstallationSetupGuide from "./components/InstallationSetupGuide";
import CustomerAuthGuide from "./components/CustomerAuthGuide";
import SignInWithScrymeGuide from "./components/SignInWithScrymeGuide";
import WorkflowAutomationGuide from "./components/WorkflowAutomationGuide";
import UserGuides from "./components/UserGuides";

// --- Type Definitions for parsed schema ---
interface Endpoint {
  path: string;
  method: string;
  summary: string;
  description: string;
  operationId: string;
  parameters: any[];
  requestBody: any;
  responses: any;
  security: any[];
  tag: string;
}

// Shared method badge styling — used in sidebar + detail header
const methodStyles: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  POST: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  PATCH: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  PUT: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  DELETE: "bg-rose-500/10 text-rose-400 border-rose-500/25",
};

const methodBadge = (method: string) =>
  methodStyles[method] || "bg-slate-500/10 text-slate-400 border-slate-500/25";

function getFallbackDataForPath(
  path: string,
  method: string,
  operationId: string,
  summary: string,
): any {
  const cleanPath = path.toLowerCase();

  // Webhooks
  if (cleanPath.includes("/webhooks")) {
    if (method === "GET") {
      return [
        {
          id: "wh_1",
          name: "ERP Inventory Sync",
          url: "https://api.merchant.com/v3/webhooks/inventory",
          events: ["inventory.updated", "inventory.low_stock"],
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];
    }
    if (method === "POST") {
      return {
        id: "wh_" + Math.random().toString(36).substr(2, 5),
        name: summary || "New Webhook Subscription",
        url: "https://api.merchant.com/v3/webhooks/callback",
        events: ["transaction.created", "customer.registered"],
        isActive: true,
        createdAt: new Date().toISOString(),
      };
    }
    return { success: true, message: "Webhook action completed successfully" };
  }

  // Inventory Integrity & Trace
  if (cleanPath.includes("/inventory/integrity/verify")) {
    return {
      verified: true,
      integrityScore: 100,
      checkedAt: new Date().toISOString(),
      issuesFound: 0,
      corruptedRecords: [],
    };
  }
  if (cleanPath.includes("/inventory/integrity/fix/")) {
    return {
      fixed: true,
      variantId: path.split("/").pop() || "var_123",
      reconciledQuantity: 250,
      resolvedAt: new Date().toISOString(),
    };
  }
  if (cleanPath.includes("/inventory/trace/")) {
    return {
      identifier: path.split("/").pop() || "BATCH-999",
      batchId: "bat_trace_888",
      originSupplierId: "sup_acme_001",
      traceTimeline: [
        {
          action: "RECEIVE",
          date: "2026-02-15T08:00:00Z",
          location: "Warehouse North",
          member: "mem_john_01",
          quantity: 1000,
        },
        {
          action: "QUALITY_CHECK",
          date: "2026-02-15T11:30:00Z",
          status: "PASSED",
          inspector: "mem_inspector_02",
        },
        {
          action: "DISPATCH",
          date: "2026-02-20T14:15:00Z",
          targetLocation: "Store Branch B",
          quantity: 300,
        },
      ],
    };
  }
  if (
    cleanPath.includes("/inventory/batches/") &&
    cleanPath.includes("/split")
  ) {
    return {
      parentBatchId: path.split("/").slice(-2, -1)[0] || "bat_parent",
      childBatches: [
        {
          id: "bat_child_001",
          batchNumber: "B-SPLIT-01",
          quantity: 150,
          unit: "kg",
        },
        {
          id: "bat_child_002",
          batchNumber: "B-SPLIT-02",
          quantity: 150,
          unit: "kg",
        },
      ],
    };
  }
  if (cleanPath.includes("/inventory/batches/merge")) {
    return {
      mergedBatchId: "bat_merged_abc",
      mergedBatchNumber: "B-MERGE-2026",
      sourceBatchIds: ["bat_source_1", "bat_source_2"],
      totalQuantity: 500,
      unit: "pcs",
    };
  }
  if (
    cleanPath.includes("/inventory/assemblies") &&
    cleanPath.includes("/complete")
  ) {
    return {
      assemblyId: path.split("/").slice(-2, -1)[0] || "asm_123",
      status: "COMPLETED",
      completedAt: new Date().toISOString(),
      producedVariantId: "var_final_product",
      quantityProduced: 50,
      materialsConsumed: [
        { variantId: "var_raw_material_1", quantity: 100 },
        { variantId: "var_raw_material_2", quantity: 50 },
      ],
    };
  }
  if (cleanPath.includes("/inventory/assemblies")) {
    return {
      assemblyId: "asm_plan_999",
      name: "Standard Packaging Bundle",
      status: "PENDING_PRODUCTION",
      scheduledDate: "2026-03-10T10:00:00Z",
      components: [
        { variantId: "var_box_large", quantity: 1 },
        { variantId: "var_tape_premium", quantity: 0.1 },
      ],
    };
  }
  if (cleanPath.includes("/inventory/adjustments/request")) {
    return {
      adjustmentRequestId: "adj_req_777",
      status: "PENDING_APPROVAL",
      requestedBy: "mem_cashier_05",
      variantId: "var_bagel_sesame",
      requestedAdjustment: -12,
      reason: "Damaged during morning delivery setup",
    };
  }
  if (
    cleanPath.includes("/inventory/adjustments") &&
    cleanPath.includes("/approve")
  ) {
    return {
      adjustmentId: path.split("/").slice(-2, -1)[0] || "adj_123",
      status: "APPROVED",
      approvedBy: "mem_manager_01",
      approvedAt: new Date().toISOString(),
    };
  }
  if (
    cleanPath.includes("/inventory/adjustments") &&
    cleanPath.includes("/reject")
  ) {
    return {
      adjustmentId: path.split("/").slice(-2, -1)[0] || "adj_123",
      status: "REJECTED",
      rejectedBy: "mem_manager_01",
      rejectionReason: "Insufficient physical evidence or photo provided",
      rejectedAt: new Date().toISOString(),
    };
  }
  if (cleanPath.includes("/inventory/adjustments")) {
    return [
      {
        id: "adj_01",
        variantId: "var_flour_all_purpose",
        quantityChanged: -25,
        reason: "Sack spillage / water damage",
        status: "APPROVED",
        createdAt: "2026-03-01T14:20:00Z",
      },
    ];
  }
  if (cleanPath.includes("/inventory/analytics/supplier-lead-time")) {
    return {
      supplierId: "sup_flour_co",
      averageLeadTimeDays: 3.2,
      totalOrdersProcessed: 48,
      reliabilityScore: 0.98,
      onTimeDeliveryRate: 0.96,
    };
  }
  if (cleanPath.includes("/inventory/analytics/waste")) {
    return {
      totalWasteQuantity: 145.5,
      totalWasteValueAmount: 580.0,
      shrinkageRatePercentage: 1.4,
      byReasonCode: {
        DAMAGED: 85.0,
        EXPIRED: 45.5,
        THEFT: 15.0,
      },
      computedAt: new Date().toISOString(),
    };
  }
  if (
    cleanPath.includes("/inventory/batches/") &&
    cleanPath.includes("/unpack")
  ) {
    return {
      unpackedBatchId: "bat_unpacked_999",
      baseUnitQuantity: 1000,
      baseUnitId: "unit_grams",
      unpackedBy: "mem_baker_01",
      unpackedAt: new Date().toISOString(),
    };
  }
  if (cleanPath.includes("/inventory/batches/scan-unpack")) {
    return {
      unpackedBatchId: "bat_scanned_888",
      scannedQrCode: "QR-BATCH-WHEAT-50KG",
      status: "SUCCESS_UNPACKED",
      baseUnitQuantity: 50,
      baseUnitId: "unit_kg",
    };
  }
  if (
    cleanPath.includes("/inventory/b2b/availability") ||
    cleanPath.includes("/inventory/b2b/quick-inquiry")
  ) {
    return {
      available: true,
      requestedVariants: [
        {
          variantId: "var_croissant_butter",
          requestedQuantity: 100,
          availableQuantity: 120,
          hasSufficientStock: true,
        },
      ],
      defaultLocationId: "loc_central_bakery",
    };
  }

  // CRM
  if (cleanPath.includes("/crm/records") && cleanPath.includes("/notes")) {
    return [
      {
        id: "crm_note_1",
        content:
          "Followed up with corporate client regarding custom baking event. Highly interested in organic options.",
        createdById: "mem_sales_01",
        createdAt: "2026-03-01T12:00:00Z",
      },
    ];
  }
  if (cleanPath.includes("/crm/records") && cleanPath.includes("/timeline")) {
    return {
      recordId: path.split("/").slice(-2, -1)[0] || "rec_123",
      timeline: [
        {
          type: "NOTE",
          id: "note_1",
          content: "Created account profile",
          date: "2026-02-10T10:00:00Z",
          author: "mem_system",
        },
        {
          type: "ACTIVITY",
          id: "act_1",
          activityType: "CALL",
          description: "Intro call",
          date: "2026-02-12T15:30:00Z",
          outcome: "Interested",
        },
      ],
    };
  }
  if (
    cleanPath.includes("/crm/records") &&
    cleanPath.includes("/associations")
  ) {
    return [
      {
        associationId: "crm_assoc_1",
        relationshipId: "rel_company_to_contacts",
        sourceRecordId: "rec_company_acme",
        targetRecordId: "rec_contact_john_doe",
        associatedAt: "2026-02-10T10:15:00Z",
      },
    ];
  }
  if (cleanPath.includes("/crm/records")) {
    return {
      id: "crm_rec_" + Math.random().toString(36).substr(2, 5),
      objectId: "crm_obj_deals",
      data: {
        deal_value: 5000,
        deal_stage: "PROPOSAL",
        deal_title: "Acme Corp Bakery Catering",
      },
      ownerId: "mem_sales_mgr",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  if (cleanPath.includes("/crm/notes")) {
    return {
      id: "crm_note_new",
      recordId: "rec_123",
      content: "Client updated preferred delivery schedule.",
      timelineDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }
  if (cleanPath.includes("/crm/activities")) {
    return {
      id: "crm_activity_new",
      recordId: "rec_123",
      type: "EMAIL",
      description: "Sent pricing sheet proposal for review.",
      metadata: { recipient: "purchasing@acme.com", status: "SENT" },
      createdAt: new Date().toISOString(),
    };
  }
  if (cleanPath.includes("/crm/objects") && cleanPath.includes("/fields")) {
    return [
      {
        name: "deal_value",
        label: "Deal Value ($)",
        type: "NUMBER",
        isRequired: true,
      },
    ];
  }
  if (cleanPath.includes("/crm/objects")) {
    return [
      {
        id: "obj_deals",
        name: "deal",
        label: "Deal",
        labelPlural: "Deals",
        description: "Sales opportunities",
      },
    ];
  }
  if (cleanPath.includes("/crm/relationships")) {
    return [
      {
        id: "rel_1",
        name: "company_employees",
        type: "ONE_TO_MANY",
        sourceObjectId: "obj_companies",
        targetObjectId: "obj_contacts",
      },
    ];
  }
  if (cleanPath.includes("/crm/associations")) {
    return {
      id: "assoc_new",
      relationshipId: "rel_1",
      sourceRecordId: "rec_company_1",
      targetRecordId: "rec_contact_1",
      associatedAt: new Date().toISOString(),
    };
  }
  if (cleanPath.includes("/crm-integrations")) {
    if (cleanPath.includes("/auth")) {
      return {
        authUrl:
          "https://login.hubspot.com/oauth/authorize?client_id=scryme_hubspot_id&redirect_uri=https://api.scryme.tech/v3/hubspot/callback",
      };
    }
    if (cleanPath.includes("/webhook")) {
      return { status: "WEBHOOK_PROCESSED_SUCCESSFULLY" };
    }
    if (cleanPath.includes("/reply")) {
      return {
        success: true,
        message: "Response successfully dispatched to integrated CRM provider",
      };
    }
    return { success: true };
  }

  // Finance / Accounting Reports
  if (cleanPath.includes("/finance/accounting/reports/profit-loss")) {
    return {
      revenue: 1250000.0,
      costOfGoodsSold: 450000.0,
      grossProfit: 800000.0,
      operatingExpenses: 350000.0,
      netProfit: 450000.0,
      currencyCode: "KES",
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    };
  }
  if (cleanPath.includes("/finance/accounting/reports/balance-sheet")) {
    return {
      assets: {
        currentAssets: {
          cash: 250000.0,
          inventory: 150000.0,
          accountsReceivable: 50000.0,
        },
        fixedAssets: { equipment: 500000.0, property: 1200000.0 },
        totalAssets: 2150000.0,
      },
      liabilities: {
        currentLiabilities: {
          accountsPayable: 75000.0,
          salesTaxPayable: 25000.0,
        },
        longTermLiabilities: { bankLoan: 400000.0 },
        totalLiabilities: 500000.0,
      },
      equity: {
        retainedEarnings: 650000.0,
        shareCapital: 1000000.0,
        totalEquity: 1650000.0,
      },
      asOfDate: "2026-01-31",
    };
  }
  if (cleanPath.includes("/finance/accounting/reports/cash-flow")) {
    return {
      operatingActivities: 180000.0,
      investingActivities: -120000.0,
      financingActivities: -20000.0,
      netCashFlow: 40000.0,
      cashAtBeginning: 210000.0,
      cashAtEnd: 250000.0,
      currencyCode: "KES",
    };
  }
  if (cleanPath.includes("/finance/accounting/reports/tax-summary")) {
    return {
      jurisdiction: "Kenya Revenue Authority",
      taxPeriod: "2026-Q1",
      salesVatRate: 0.16,
      taxableSalesAmount: 1250000.0,
      outputVatCollected: 200000.0,
      inputVatClaimable: 72000.0,
      netVatPayable: 128000.0,
      currencyCode: "KES",
    };
  }
  if (cleanPath.includes("/finance/accounting/initialize")) {
    return {
      status: "SUCCESSFULLY_INITIALIZED",
      chartOfAccountsCreated: true,
      defaultAccountsCount: 45,
      initializedAt: new Date().toISOString(),
    };
  }

  // Petty cash
  if (
    cleanPath.includes("/finance/petty-cash") &&
    cleanPath.includes("/transactions")
  ) {
    return [
      {
        id: "petty_tx_1",
        amount: -250.0,
        description: "Bought office milk and coffee",
        date: "2026-03-02T10:00:00Z",
        operatorMemberId: "mem_cashier_1",
      },
    ];
  }
  if (
    cleanPath.includes("/finance/petty-cash") &&
    cleanPath.includes("/top-up")
  ) {
    return {
      fundId: path.split("/").slice(-2, -1)[0] || "fund_123",
      topUpAmount: 5000.0,
      newFloatBalance: 7500.0,
      toppedUpAt: new Date().toISOString(),
    };
  }
  if (cleanPath.includes("/finance/petty-cash")) {
    if (method === "GET") {
      return [
        {
          id: "pc_fund_1",
          name: "Bakery Register 1 Float",
          floatAmount: 5000.0,
          currentBalance: 4850.0,
          currency: "KES",
          responsibleMemberId: "mem_cashier_1",
        },
      ];
    }
    return {
      id: "pc_fund_new",
      name: "Office Petty Cash",
      floatAmount: 10000.0,
      currencyCode: "KES",
      responsibleMemberId: "mem_admin_01",
      createdAt: new Date().toISOString(),
    };
  }

  // Expenses
  if (cleanPath.includes("/finance/expenses/categories")) {
    return [
      { id: "cat_utilities", name: "Utilities", code: "EXP-UTI" },
      { id: "cat_raw_materials", name: "Raw Materials", code: "EXP-RAW" },
      { id: "cat_rent", name: "Rent & Leases", code: "EXP-RNT" },
    ];
  }
  if (cleanPath.includes("/finance/expenses")) {
    if (method === "GET") {
      return [
        {
          id: "exp_1",
          description: "Water bill January",
          amount: 1200.0,
          expenseDate: "2026-01-25",
          categoryId: "cat_utilities",
          status: "PAID",
        },
      ];
    }
    return {
      id: "exp_new",
      description: "Flour delivery supply invoice",
      amount: 45000.0,
      expenseDate: new Date().toISOString(),
      categoryId: "cat_raw_materials",
      status: "PENDING_APPROVAL",
    };
  }

  // Utility accounts
  if (cleanPath.includes("/finance/utility-accounts")) {
    if (method === "GET") {
      return [
        {
          id: "util_elec_01",
          name: "KPLC Electricity Meter 1",
          provider: "Kenya Power",
          accountNumber: "331200921-01",
          type: "ELECTRICITY",
        },
      ];
    }
    return {
      id: "util_new",
      name: "Nairobi Water Metre 2",
      provider: "Nairobi Water",
      accountNumber: "WAT-99211",
      type: "WATER",
    };
  }

  // Public Invoices & Downloads
  if (cleanPath.includes("/public-invoices/")) {
    if (cleanPath.includes("/download")) {
      return {
        downloadUrl:
          "https://storage.scryme.tech/secure-invoices/inv_pdf_hash_2026.pdf?token=valid_download_token",
        fileName: "scryme-invoice-download.pdf",
        expiresAt: "2026-03-05T12:00:00Z",
      };
    }
    if (cleanPath.includes("/generate-public-link")) {
      return {
        publicLinkUrl:
          "https://api.scryme.tech/v3/public-invoices/tx_abc_123?token=public_view_token",
        expirySeconds: 2592000,
        expiresAt: "2026-04-02T12:00:00Z",
      };
    }
  }

  // Business accounts
  if (cleanPath.includes("/business-accounts")) {
    return {
      id: "biz_acc_" + Math.random().toString(36).substr(2, 5),
      name: "Grand Hotel Group",
      taxId: "PIN-KRA-009121",
      defaultLocationId: "loc_main_bakery",
      creditLimit: 500000.0,
      outstandingBalance: 125000.0,
      crmTimeline: [],
    };
  }

  // Admin
  if (cleanPath.includes("/admin/stats")) {
    return {
      activeOrganizationsCount: 142,
      totalUsersCount: 2561,
      systemUptimePercentage: 99.98,
      dailyTransactionsProcessed: 38400,
      apiRequestsCount24h: 1250320,
    };
  }
  if (
    cleanPath.includes("/admin/organizations") ||
    cleanPath.includes("/admin/organizations/")
  ) {
    if (cleanPath.includes("/subscription")) {
      return {
        tierSlug: "enterprise-growth",
        status: "ACTIVE",
        billingInterval: "MONTHLY",
        dodoSubscriptionId: "sub_dodo_xyz_123",
        currentPeriodEnd: "2026-04-01T00:00:00Z",
      };
    }
    if (method === "GET") {
      return [
        {
          id: "org_bakery_co",
          name: "The French Bakery Co.",
          slug: "bakery-co",
          isActive: true,
        },
      ];
    }
    return {
      id: "org_" + Math.random().toString(36).substr(2, 5),
      name: summary || "New Organization",
      slug: "new-org-slug",
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  }
  if (cleanPath.includes("/admin/members")) {
    return [
      {
        id: "mem_admin_01",
        userEmail: "owner@scryme.tech",
        role: "OWNER",
        isActive: true,
      },
    ];
  }
  if (cleanPath.includes("/admin/users")) {
    if (cleanPath.includes("/ban")) {
      return {
        status: "BANNED",
        bannedUserId: path.split("/").slice(-2, -1)[0] || "usr_123",
        banReason: "Violation of enterprise terms of service",
      };
    }
    if (cleanPath.includes("/unban")) {
      return {
        status: "ACTIVE",
        unbannedUserId: path.split("/").slice(-2, -1)[0] || "usr_123",
        unbannedAt: new Date().toISOString(),
      };
    }
    return [
      {
        id: "usr_123",
        email: "admin@scryme.tech",
        name: "Admin User",
        status: "ACTIVE",
      },
    ];
  }
  if (cleanPath.includes("/admin/connected-apps")) {
    return [
      {
        clientId: "client_id_crm_01",
        clientName: "Salesforce CRM Link",
        isActive: true,
        scopes: ["inventory.read", "customers.read_write"],
      },
    ];
  }
  if (cleanPath.includes("/admin/system-logs")) {
    return [
      {
        eventId: "log_9921",
        action: "ORG_CREATE",
        ipAddress: "192.168.1.50",
        timestamp: new Date().toISOString(),
        details: "Organization bakery-co created",
      },
    ];
  }
  if (cleanPath.includes("/admin/settings")) {
    return [
      { key: "allow_public_registrations", value: "false" },
      { key: "default_currency", value: "KES" },
    ];
  }
  if (cleanPath.includes("/admin/tiers")) {
    return [
      {
        slug: "starter",
        name: "Starter Tier",
        price: 29.0,
        memberLimit: 5,
        features: ["pos", "basic_analytics"],
      },
    ];
  }
  if (cleanPath.includes("/admin/payments")) {
    if (cleanPath.includes("/record")) {
      return {
        paymentRecordId: "pay_recorded_0091",
        status: "VERIFIED",
        organizationId: "org_1",
        tierUpgraded: "growth",
      };
    }
    return [
      {
        paymentId: "pay_1",
        amount: 299.0,
        reference: "MPESA-QRE9129A",
        date: "2026-03-01",
        status: "COMPLETED",
      },
    ];
  }
  if (cleanPath.includes("/admin/integrations/definitions")) {
    return [
      {
        id: "int_shopify",
        name: "Shopify",
        slug: "shopify",
        category: "E_COMMERCE",
        isActive: true,
      },
    ];
  }
  if (cleanPath.includes("/admin/integrations/active")) {
    return [
      {
        id: "active_int_01",
        orgId: "org_bakery_co",
        definitionId: "int_shopify",
        connectedAt: "2026-02-14",
      },
    ];
  }

  // Loyalty
  if (cleanPath.includes("/loyalty/vouchers/redeem")) {
    return {
      redeemed: true,
      voucherCode: "VCH-DISC-10",
      discountAmount: 15.5,
      customerId: "cust_123",
      redeemedAt: new Date().toISOString(),
    };
  }
  if (cleanPath.includes("/loyalty/vouchers/validate")) {
    return {
      valid: true,
      voucherCode: "SAVE10",
      discountType: "PERCENTAGE",
      discountValue: 10,
      description: "10% off overall purchase",
    };
  }
  if (cleanPath.includes("/loyalty/status")) {
    return {
      customerId: "cust_123",
      pointsBalance: 420,
      loyaltyTier: "SILVER",
      availableRewards: [
        { rewardId: "rew_coffee_free", name: "Free Espresso", pointsCost: 100 },
      ],
    };
  }

  // Stocking
  if (
    cleanPath.includes("/stocking/physical-reconciliations") &&
    cleanPath.includes("/report")
  ) {
    return {
      reconciliationId: path.split("/").slice(-2, -1)[0] || "rec_123",
      totalDiscrepanciesCount: 3,
      totalAdjustedValueAmount: -45.2,
      detailedItems: [
        {
          variantId: "var_flour",
          systemStock: 50,
          physicalStock: 48,
          discrepancy: -2,
        },
      ],
    };
  }
  if (cleanPath.includes("/stocking/physical-reconciliations")) {
    if (method === "GET") {
      return [
        {
          id: "rec_1",
          locationId: "loc_main",
          status: "COMPLETED",
          createdAt: "2026-02-28T18:00:00Z",
        },
      ];
    }
    return {
      reconciliationId: "rec_new_9921",
      status: "SUBMITTED_SUCCESSFULLY",
      reconciledAt: new Date().toISOString(),
    };
  }
  if (
    cleanPath.includes("/stocking/partners") &&
    cleanPath.includes("/wallet/adjust")
  ) {
    return {
      partnerId: path.split("/").slice(-3, -2)[0] || "partner_123",
      adjustedAmount: 1500.0,
      newWalletBalance: 12500.0,
      action: "TOP_UP",
      timestamp: new Date().toISOString(),
    };
  }
  if (cleanPath.includes("/stocking/partners")) {
    if (method === "GET") {
      return [
        {
          id: "partner_fargo",
          name: "Fargo Courier Services",
          email: "fargo@scryme-delivery.com",
          isActive: true,
        },
      ];
    }
    return {
      id: "partner_" + Math.random().toString(36).substr(2, 5),
      name: summary || "New Delivery Partner",
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  }

  // Default fallback for any other GET/POST/etc
  if (method === "GET") {
    return [];
  }
  return { success: true };
}

const mappings: Record<string, Record<string, string>> = {
  catalog: {
    getProducts: "catalogGetProducts",
    createProduct: "catalogCreateProduct",
    getServices: "catalogGetServices",
    updateProduct: "catalogUpdateProduct",
    updateSupplierVariant: "catalogUpdateSupplierVariant",
    getPriceChangeRequests: "catalogGetPriceChangeRequests",
    reviewPriceChangeRequest: "catalogReviewPriceChangeRequest",
    createServiceCategory: "servicesCreateCategory",
    getServiceCategories: "servicesGetCategories",
    updateServiceCategory: "servicesUpdateCategory",
    deleteServiceCategory: "servicesDeleteCategory",
    createService: "servicesCreateService",
    getServicesList: "servicesGetServices",
    getCurrentMemberShifts: "servicesGetCurrentMemberShifts",
    getShifts: "servicesGetShifts",
    getService: "servicesGetService",
    updateService: "servicesUpdateService",
    deleteService: "servicesDeleteService",
    createResource: "servicesCreateResource",
    getResources: "servicesGetResources",
    updateResource: "servicesUpdateResource",
    deleteResource: "servicesDeleteResource",
    createBooking: "servicesCreateBooking",
    getBookings: "servicesGetBookings",
    getBooking: "servicesGetBooking",
    updateBookingStatus: "servicesUpdateBookingStatus",
    completeBooking: "servicesCompleteBooking",
    createShift: "servicesCreateShift",
    getStaffShifts: "servicesGetStaffShifts",
    addBreak: "servicesAddBreak",
    registerCustomerApp: "servicesRegisterCustomerApp",
    getServiceUtilization: "servicesGetUtilization",
    getServicePerformance: "servicesGetPerformance",
    getServiceFunnel: "servicesGetFunnel",
  },
  auth: {
    exchangeToken: "authExchangeToken",
    handleOAuth2: "authControllerHandleOAuth2",
  },
  inventory: {
    verifyIntegrity: "inventoryVerifyIntegrity",
    fixIntegrity: "inventoryFixIntegrity",
    getInventory: "inventoryGetInventory",
    traceBatch: "inventoryTraceBatch",
    splitBatch: "inventorySplitBatch",
    mergeBatches: "inventoryMergeBatches",
    createAssembly: "inventoryCreateAssembly",
    completeAssembly: "inventoryCompleteAssembly",
    requestAdjustment: "inventoryRequestAdjustment",
    getAdjustments: "inventoryGetAdjustments",
    approveAdjustment: "inventoryApproveAdjustment",
    rejectAdjustment: "inventoryRejectAdjustment",
    getLeadTime: "inventoryGetLeadTime",
    getWasteAnalysis: "inventoryGetWasteAnalysis",
    checkB2BAvailability: "inventoryCheckB2BAvailability",
    unpackBatch: "inventoryUnpackBatch",
    scanUnpackBatch: "inventoryScanUnpackBatch",
    quickStockInquiry: "inventoryQuickStockInquiry",
    getPurchases: "stockingGetPurchases",
    createPurchase: "stockingCreatePurchase",
    receivePurchase: "stockingReceivePurchase",
    getTransfers: "stockingGetTransfers",
    createTransfer: "stockingCreateTransfer",
    shipTransfer: "stockingShipTransfer",
    receiveTransfer: "stockingReceiveTransfer",
    getRequests: "stockingGetRequests",
    getPendingDispatch: "stockingGetPendingDispatch",
    dispatchOrders: "stockingDispatchOrders",
    getActiveDeliveries: "stockingGetActiveDeliveries",
    reconcilePod: "stockingReconcilePod",
    getPhysicalReconciliations: "stockingGetPhysicalReconciliations",
    submitPhysicalReconciliation: "stockingSubmitPhysicalReconciliation",
    getReconciliationReport: "stockingGetReconciliationReport",
    getPartners: "stockingGetPartners",
    createPartner: "stockingCreatePartner",
    getPartner: "stockingGetPartner",
    updatePartner: "stockingUpdatePartner",
    adjustPartnerWallet: "stockingAdjustPartnerWallet",
    getUnits: "unitsGetUnits",
  },
  orders: {
    createOrder: "ordersCreateOrder",
    getOrders: "ordersGetOrders",
    updateStatus: "ordersUpdateStatus",
    requestB2BQuote: "ordersRequestB2BQuote",
    convertQuoteToOrder: "ordersConvertQuoteToOrder",
    getB2BCatalog: "b2BGetCatalog",
    getB2BInvoices: "b2BGetInvoices",
    getB2BOrders: "b2BGetOrders",
    createB2BOrder: "b2BCreateOrder",
    createB2BQuote: "b2BCreateQuote",
    getCart: "cartControllerGetCart",
    clearCart: "cartControllerClearCart",
    addToCart: "cartControllerAddToCart",
    removeFromCart: "cartControllerRemoveFromCart",
    handleStkCallback: "paymentsControllerHandleStkCallback",
  },
  crm: {
    createRecord: "crmControllerCreateRecord",
    getRecord: "crmControllerGetRecord",
    updateRecord: "crmControllerUpdateRecord",
    createNote: "crmControllerCreateNote",
    getRecordNotes: "crmControllerGetRecordNotes",
    createActivity: "crmControllerCreateActivity",
    getTimeline: "crmControllerGetTimeline",
    createObject: "crmControllerCreateObject",
    listObjects: "crmControllerListObjects",
    createField: "crmControllerCreateField",
    listFields: "crmControllerListFields",
    createRelationship: "crmControllerCreateRelationship",
    listRelationships: "crmControllerListRelationships",
    createAssociation: "crmControllerCreateAssociation",
    listRecordAssociations: "crmControllerListRecordAssociations",
    getIntegrationsAuthUrl: "crmIntegrationsGetAuthUrl",
    handleIntegrationsCallback: "crmIntegrationsHandleCallback",
    handleIntegrationsWebhook: "crmIntegrationsHandleWebhook",
    replyToIntegrationsActivity: "crmIntegrationsReplyToActivity",
    createStrapiConnection: "strapiCreateConnection",
    listStrapiConnections: "strapiListConnections",
    getStrapiConnection: "strapiGetConnection",
    updateStrapiConnection: "strapiUpdateConnection",
    deleteStrapiConnection: "strapiDeleteConnection",
    triggerStrapiSync: "strapiTriggerSync",
    enqueueStrapiSync: "strapiEnqueueSync",
    getStrapiWebhookLogs: "strapiGetWebhookLogs",
    getStrapiSyncLogs: "strapiGetSyncLogs",
    exchangeStrapiCustomerToken: "strapiExchangeCustomerToken",
    registerStrapiCustomer: "strapiRegisterCustomer",
    receiveStrapiWebhook: "strapiReceiveWebhook",
  },
  pos: {
    provision: "pOSProvision",
    login: "pOSLogin",
    getMe: "pOSGetMe",
    processSale: "pOSProcessSale",
    sync: "pOSSync",
    getTransactions: "pOSGetTransactions",
    registerPettyCash: "pOSRegisterPettyCash",
    getPettyCashFunds: "pOSGetPettyCashFunds",
    getPettyCashTransactions: "pOSGetPettyCashTransactions",
    createSetupKey: "standalonePosControllerCreateSetupKey",
    activateDevice: "standalonePosControllerActivateDevice",
    validateKey: "standalonePosControllerValidateKey",
    linkOrganization: "standalonePosControllerLinkOrganization",
  },
  accounting: {
    createExpense: "expenseControllerCreateExpense",
    getExpenses: "expenseControllerGetExpenses",
    getExpenseCategories: "expenseControllerGetExpenseCategories",
    getExpense: "expenseControllerGetExpense",
    createPettyCashFund: "pettyCashControllerCreateFund",
    getPettyCashFunds: "pettyCashControllerGetFunds",
    getPettyCashFund: "pettyCashControllerGetFund",
    topUpPettyCashFund: "pettyCashControllerTopUpFund",
    getPettyCashFundTransactions: "pettyCashControllerGetFundTransactions",
    createUtilityAccount: "utilityAccountControllerCreateAccount",
    getUtilityAccounts: "utilityAccountControllerGetAccounts",
    getUtilityAccount: "utilityAccountControllerGetAccount",
    initialize: "accountingInitialize",
    getProfitLoss: "accountingGetProfitLoss",
    getBalanceSheet: "accountingGetBalanceSheet",
    getCashFlow: "accountingGetCashFlow",
    getTaxSummary: "accountingGetTaxSummary",
    createInvoice: "invoiceControllerCreateInvoice",
    getInvoices: "invoiceControllerGetInvoices",
    getInvoice: "invoiceControllerGetInvoice",
    updateInvoice: "invoiceControllerUpdateInvoice",
    deleteInvoice: "invoiceControllerDeleteInvoice",
    finalizeInvoice: "invoiceControllerFinalizeInvoice",
    getTemplates: "invoiceControllerGetTemplates",
    createTemplate: "invoiceControllerCreateTemplate",
    getInvoiceConfig: "invoiceControllerGetConfig",
    updateInvoiceConfig: "invoiceControllerUpdateConfig",
    downloadInvoice: "publicInvoiceControllerDownloadInvoice",
    downloadInvoiceByTransaction: "publicInvoiceControllerDownloadInvoiceByTransaction",
    downloadReceipt: "publicInvoiceControllerDownloadReceipt",
    generatePublicLink: "publicInvoiceControllerGeneratePublicLink",
  },
  loyalty: {
    redeemReward: "loyaltyRedeemReward",
    getCustomerStatus: "loyaltyGetCustomerStatus",
    validateVoucher: "loyaltyValidateVoucher",
    getFavorites: "favoritesControllerGetFavorites",
    addFavorite: "favoritesControllerAddFavorite",
    removeFavorite: "favoritesControllerRemoveFavorite",
  },
  members: {
    getMembers: "membersControllerGetMembers",
    createMember: "membersControllerCreateMember",
    getMember: "membersControllerGetMember",
    updateMember: "membersControllerUpdateMember",
    deleteMember: "membersControllerDeleteMember",
    getMemberActivity: "membersControllerGetMemberActivity",
    updateStatus: "membersControllerUpdateStatus",
    adminCheckOut: "membersControllerAdminCheckOut",
    terminalLogin: "terminalMembersControllerLogin",
    listInvitations: "invitationsList",
    createInvitation: "invitationsCreate",
    revokeInvitation: "invitationsRevoke",
    acceptInvitation: "invitationsAccept",
    getCustomRoles: "roleManagementControllerGetCustomRoles",
    createCustomRole: "roleManagementControllerCreateCustomRole",
    updateCustomRole: "roleManagementControllerUpdateCustomRole",
    deleteCustomRole: "roleManagementControllerDeleteCustomRole",
    getPermissionSets: "roleManagementControllerGetPermissionSets",
    createPermissionSet: "roleManagementControllerCreatePermissionSet",
    getRoleGroups: "roleManagementControllerGetRoleGroups",
    createRoleGroup: "roleManagementControllerCreateRoleGroup",
    assignRoles: "roleManagementControllerAssignRoles",
    removeRoles: "roleManagementControllerRemoveRoles",
    listDepartments: "departmentsList",
    createDepartment: "departmentsCreate",
    getDepartment: "departmentsGet",
    updateDepartment: "departmentsUpdate",
    deleteDepartment: "departmentsDelete",
    addDepartmentMember: "departmentsAddMember",
    removeDepartmentMember: "departmentsRemoveMember",
    getAttendanceLogs: "attendanceControllerGetLogs",
    checkIn: "attendanceControllerCheckIn",
    checkOut: "attendanceControllerCheckOut",
    getMyAttendanceStatus: "attendanceControllerGetMyStatus",
    getAttendanceStatus: "attendanceControllerGetStatus",
    broadcastAnnouncement: "announcementControllerBroadcastAnnouncement",
  },
  admin: {
    getStats: "adminControllerGetStats",
    listOrganizations: "adminControllerListOrganizations",
    createOrganization: "adminControllerCreateOrganization",
    getOrganizationDetails: "adminControllerGetOrganizationDetails",
    updateOrganization: "adminControllerUpdateOrganization",
    deleteOrganization: "adminControllerDeleteOrganization",
    listMembers: "adminControllerListMembers",
    listUsers: "adminControllerListUsers",
    banUser: "adminControllerBanUser",
    unbanUser: "adminControllerUnbanUser",
    listConnectedApps: "adminControllerListConnectedApps",
    listSystemLogs: "adminControllerListSystemLogs",
    listGlobalSettings: "adminControllerListGlobalSettings",
    setGlobalSetting: "adminControllerSetGlobalSetting",
    deleteGlobalSetting: "adminControllerDeleteGlobalSetting",
    listTiers: "adminControllerListTiers",
    defineTier: "adminControllerDefineTier",
    deleteTier: "adminControllerDeleteTier",
    getOrganizationSubscription: "adminControllerGetOrganizationSubscription",
    updateOrganizationSubscription: "adminControllerUpdateOrganizationSubscription",
    listSystemPayments: "adminControllerListSystemPayments",
    recordCustomPayment: "adminControllerRecordCustomPayment",
    listIntegrationDefinitions: "adminControllerListIntegrationDefinitions",
    createIntegrationDefinition: "adminControllerCreateIntegrationDefinition",
    updateIntegrationDefinition: "adminControllerUpdateIntegrationDefinition",
    deleteIntegrationDefinition: "adminControllerDeleteIntegrationDefinition",
    listActiveOrganizationIntegrations: "adminControllerListActiveOrganizationIntegrations",
    createWebhook: "webhooksCreate",
    listWebhooks: "webhooksList",
    deleteWebhook: "webhooksDelete",
    handleWindmillCallback: "windmillCallbackControllerHandleCallback",
    handleWindmillApprovalCallback: "windmillCallbackControllerHandleApprovalCallback",
    handleWindmillBakeryDisposalCallback: "windmillCallbackControllerHandleBakeryDisposalCallback",
    handleWindmillOutcomeCallback: "windmillCallbackControllerHandleOutcomeCallback",
    getCustomers: "customersGetCustomers",
    registerCustomer: "customersRegister",
    updateCustomer: "customersUpdate",
    getCustomerById: "customersGetCustomerById",
    deleteCustomer: "customersDelete",
    getCustomerAddresses: "customersGetAddresses",
    addCustomerAddress: "customersAddAddress",
    createBusinessAccount: "businessAccountControllerCreate",
    getBusinessAccount: "businessAccountControllerGetOne",
    getDashboardAnalytics: "analyticsControllerGetDashboardAnalytics",
    getResourceUtilization: "analyticsControllerGetResourceUtilization",
  },
};

export default function App() {
  // Client-side Router State
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname;
    }
    return "/";
  });

  // Navigation routing helper
  const navigate = (path: string) => {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", path);
      setCurrentPath(path);
    }
  };

  // Sync state on popstate events (browser back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Theme state
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof localStorage !== "undefined" && localStorage.getItem("theme")) {
      return localStorage.getItem("theme") as "dark" | "light";
    }
    return "dark";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [activeEndpointId, setActiveEndpointId] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState<"curl" | "node" | "python">(
    "node",
  );
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  // Playground & Interactive Tabs State
  const [activeDocTab, setActiveDocTab] = useState<
    "reference" | "playground" | "schema"
  >("reference");

  // Re-route checks
  const isApiReference = useMemo(() => {
    return currentPath === "/api-reference" || currentPath === "/api-refrence";
  }, [currentPath]);
  const [playgroundParams, setPlaygroundParams] = useState<
    Record<string, string>
  >({});
  const [playgroundBody, setPlaygroundBody] = useState<Record<string, any>>({});
  const [isPlayingLoading, setIsPlayingLoading] = useState(false);
  const [playgroundResponse, setPlaygroundResponse] = useState<any>(null);

  // CMS Guide Pinned Navigation State
  const [selectedCmsTarget, setSelectedCmsTarget] = useState<
    "service" | "product"
  >("service");

  // CMS Simulator State (Defaults to sourdough)
  const [simState, setSimState] = useState<CmsSimulatorState>({
    name: PRESETS.sourdough.name,
    sku: PRESETS.sourdough.sku,
    price: PRESETS.sourdough.price,
    markdownDescription: PRESETS.sourdough.markdownDescription,
    imageUrl: PRESETS.sourdough.imageUrl,
    seoTitle: PRESETS.sourdough.seoTitle,
    seoDesc: PRESETS.sourdough.seoDesc,
    instructor: PRESETS.sourdough.instructor,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Apply dark/light class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Keyboard shortcut listener for focusing search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "/") {
        if (
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA"
        ) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Parse OpenAPI JSON Spec dynamically
  const endpoints = useMemo(() => {
    const list: Endpoint[] = [];
    const paths = openapiSpec.paths as Record<string, any>;
    if (!paths) return [];

    for (const [pathKey, pathObj] of Object.entries(paths)) {
      for (const [methodKey, methodObj] of Object.entries(pathObj)) {
        if (methodKey === "parameters") continue;

        const tags = methodObj.tags || ["General"];
        const primaryTag = tags[0];

        // Exclude Strapi, Standalone POS, and finance
        if (
          primaryTag &&
          (primaryTag.toLowerCase().includes("strapi") ||
            primaryTag.toLowerCase().includes("standalone pos") ||
            primaryTag.toLowerCase().includes("standalone-pos") ||
            primaryTag.toLowerCase().includes("finance"))
        ) {
          continue;
        }

        if (
          pathKey.toLowerCase().includes("/strapi") ||
          pathKey.toLowerCase().includes("/standalone-pos")
        ) {
          continue;
        }

        list.push({
          path: pathKey,
          method: methodKey.toUpperCase(),
          summary: methodObj.summary || "",
          description: methodObj.description || "",
          operationId: methodObj.operationId || `${methodKey}_${pathKey}`,
          parameters: methodObj.parameters || [],
          requestBody: methodObj.requestBody || null,
          responses: methodObj.responses || {},
          security: methodObj.security || [],
          tag: primaryTag,
        });
      }
    }
    return list;
  }, []);

  // Unique Tags grouped beautifully
  const tagGroups = useMemo(() => {
    const groups: Record<string, Endpoint[]> = {};
    endpoints.forEach((ep) => {
      if (!groups[ep.tag]) {
        groups[ep.tag] = [];
      }
      groups[ep.tag].push(ep);
    });
    return groups;
  }, [endpoints]);

  // Set default state once specs are parsed
  useEffect(() => {
    const tags = Object.keys(tagGroups);
    if (tags.length > 0) {
      setSelectedTag(tags[0]);
      setExpandedGroups(tags.reduce((acc, t) => ({ ...acc, [t]: false }), {}));
      setActiveEndpointId("installation-setup-guide");
    }
  }, [tagGroups]);

  // Filtered endpoints based on Search Query
  const filteredTagGroups = useMemo(() => {
    if (!searchQuery) return tagGroups;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, Endpoint[]> = {};

    for (const [tag, eps] of Object.entries(tagGroups)) {
      const matched = eps.filter(
        (ep) =>
          ep.path.toLowerCase().includes(query) ||
          ep.summary.toLowerCase().includes(query) ||
          ep.description.toLowerCase().includes(query) ||
          ep.method.toLowerCase().includes(query),
      );
      if (matched.length > 0) {
        filtered[tag] = matched;
      }
    }
    return filtered;
  }, [tagGroups, searchQuery]);

  // Show guide in search list if matched
  const showGuideInSearch = useMemo(() => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      "cms customization guide".includes(query) ||
      "customfields".includes(query) ||
      "markdown".includes(query) ||
      "seo metadata".includes(query) ||
      "image gallery".includes(query) ||
      "customattributes".includes(query) ||
      "global response".includes(query) ||
      "response structure".includes(query) ||
      "v3 global".includes(query) ||
      "customer registration".includes(query) ||
      "session management".includes(query) ||
      "customer auth".includes(query) ||
      "sign in with scryme".includes(query) ||
      "oauth2".includes(query) ||
      "workflow automation".includes(query) ||
      "automation engine".includes(query)
    );
  }, [searchQuery]);

  const activeEndpoint = useMemo(() => {
    return (
      endpoints.find((ep) => ep.operationId === activeEndpointId) ||
      endpoints[0]
    );
  }, [endpoints, activeEndpointId]);

  // Initialize playground fields when active endpoint changes
  useEffect(() => {
    if (
      activeEndpoint &&
      activeEndpointId !== "installation-setup-guide" &&
      activeEndpointId !== "cms-customization-guide" &&
      activeEndpointId !== "v3-global-response-guide"
    ) {
      const defaultParams: Record<string, string> = {};
      activeEndpoint.parameters?.forEach((p) => {
        if (p.name === "orgSlug") {
          defaultParams[p.name] = "bakery-co";
        } else {
          defaultParams[p.name] = p.schema?.default || "";
        }
      });
      setPlaygroundParams(defaultParams);

      const resolved = resolveSchema(
        activeEndpoint.requestBody?.content?.["application/json"]?.schema,
      );
      if (resolved && resolved.properties) {
        const mockBody = generateMockFromSchema(resolved);
        setPlaygroundBody(mockBody || {});
      } else {
        setPlaygroundBody({});
      }

      setPlaygroundResponse(null);
      setActiveDocTab("reference");
    }
  }, [activeEndpointId]);

  // JSON Schema Ref Resolver Helper with cycle detection and depth limit
  const resolveSchema = (
    schema: any,
    visited = new Set<string>(),
    depth = 0,
  ): any => {
    if (!schema || depth > 8) return null;
    if (schema.$ref) {
      const refName = schema.$ref.split("/").pop();
      if (refName) {
        if (visited.has(refName)) {
          return {
            type: "object",
            description: `Circular reference to ${refName}`,
          };
        }
        const resolved = (openapiSpec.components as any)?.schemas?.[refName];
        if (resolved) {
          const nextVisited = new Set(visited);
          nextVisited.add(refName);
          return resolveSchema(resolved, nextVisited, depth + 1);
        }
      }
    }
    if (schema.type === "object" && schema.properties) {
      const resolvedProperties: any = {};
      for (const [key, value] of Object.entries(schema.properties)) {
        resolvedProperties[key] = resolveSchema(value, visited, depth + 1);
      }
      return { ...schema, properties: resolvedProperties };
    }
    if (schema.type === "array" && schema.items) {
      return {
        ...schema,
        items: resolveSchema(schema.items, visited, depth + 1),
      };
    }
    return schema;
  };

  // Mock JSON payload builder with recursion limit and cycle detection
  const generateMockFromSchema = (
    schema: any,
    depth = 0,
    visitedRefs = new Set<string>(),
  ): any => {
    if (!schema || depth > 8) return null;

    if (schema.$ref) {
      const refName = schema.$ref.split("/").pop();
      if (refName) {
        if (visitedRefs.has(refName)) {
          return {};
        }
        const resolved = (openapiSpec.components as any)?.schemas?.[refName];
        if (resolved) {
          const nextVisited = new Set(visitedRefs);
          nextVisited.add(refName);
          return generateMockFromSchema(resolved, depth + 1, nextVisited);
        }
      }
    }

    if (schema.example !== undefined) return schema.example;
    if (schema.default !== undefined) return schema.default;

    if (schema.type === "object") {
      const obj: any = {};
      if (schema.properties) {
        for (const [key, prop] of Object.entries(schema.properties)) {
          obj[key] = generateMockFromSchema(prop, depth + 1, visitedRefs);
        }
      }
      return obj;
    }
    if (schema.type === "array") {
      const childMock = generateMockFromSchema(
        schema.items,
        depth + 1,
        visitedRefs,
      );
      return childMock ? [childMock] : [];
    }
    if (schema.type === "string") {
      if (schema.format === "date-time") return new Date().toISOString();
      if (schema.format === "email") return "developer@scryme.tech";
      if (schema.enum && schema.enum.length > 0) return schema.enum[0];
      return "string_value";
    }
    if (schema.type === "number" || schema.type === "integer") {
      return 100;
    }
    if (schema.type === "boolean") {
      return true;
    }
    return {};
  };

  // Handle CMS simulator field changes
  const handleSimStateChange = (
    field: keyof CmsSimulatorState,
    value: string | number,
  ) => {
    setSimState((prev) => ({ ...prev, [field]: value }));
  };

  // Apply simulator presets
  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const data = PRESETS[presetKey];
    setSimState({
      name: data.name,
      sku: data.sku,
      price: data.price,
      markdownDescription: data.markdownDescription,
      seoTitle: data.seoTitle,
      seoDesc: data.seoDesc,
      imageUrl: data.imageUrl,
      instructor: data.instructor,
    });
  };

  // Extract schema definitions for request body
  const requestBodySchema = useMemo(() => {
    if (!activeEndpoint || !activeEndpoint.requestBody) return null;
    const content = activeEndpoint.requestBody.content;
    const jsonContent = content?.["application/json"];
    return jsonContent?.schema ? resolveSchema(jsonContent.schema) : null;
  }, [activeEndpoint]);

  // Extract Mock Request payload
  const mockRequestPayload = useMemo(() => {
    if (
      activeEndpointId === "installation-setup-guide" ||
      activeEndpointId === "cms-customization-guide" ||
      activeEndpointId === "v3-global-response-guide"
    )
      return null;
    if (activeDocTab === "playground") {
      return playgroundBody;
    }
    if (!activeEndpoint || !activeEndpoint.requestBody) return null;
    const content = activeEndpoint.requestBody.content;
    const jsonContent = content?.["application/json"];
    return jsonContent?.schema
      ? generateMockFromSchema(jsonContent.schema)
      : null;
  }, [activeEndpoint, activeDocTab, playgroundBody, activeEndpointId]);

  // Extract Mock Response payload
  const mockResponsePayload = useMemo(() => {
    if (!activeEndpoint) return null;
    const successResponse =
      activeEndpoint.responses?.["200"] || activeEndpoint.responses?.["201"];
    const content = successResponse?.content;
    const jsonContent = content?.["application/json"];
    let rawMock = jsonContent?.schema
      ? generateMockFromSchema(jsonContent.schema)
      : null;

    if (!rawMock) {
      rawMock = getFallbackDataForPath(
        activeEndpoint.path,
        activeEndpoint.method,
        activeEndpoint.operationId,
        activeEndpoint.summary,
      );
    }

    const isAlreadyWrapped =
      rawMock &&
      typeof rawMock === "object" &&
      !Array.isArray(rawMock) &&
      "success" in rawMock &&
      "data" in rawMock;

    if (isAlreadyWrapped) {
      return rawMock;
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      data: rawMock,
    };
  }, [activeEndpoint]);

  // Dynamic URL with path variables and query parameters populated
  const getDynamicUrl = (path: string) => {
    let finalPath = path;
    const queryParams: string[] = [];

    Object.entries(playgroundParams).forEach(([key, val]) => {
      const isPath = path.includes(`{${key}}`);
      if (isPath) {
        finalPath = finalPath.replace(`{${key}}`, val || `{${key}}`);
      } else if (val) {
        queryParams.push(`${key}=${encodeURIComponent(val)}`);
      }
    });

    if (queryParams.length > 0) {
      return `${finalPath}?${queryParams.join("&")}`;
    }
    return finalPath;
  };

  // Generate dynamic Code Snippets
  const codeSnippets = useMemo(() => {
    const rawApiUrl = import.meta.env.VITE_API_URL || "https://api.scryme.tech";
    const normalizedApiUrl = rawApiUrl.endsWith("/")
      ? rawApiUrl.slice(0, -1)
      : rawApiUrl;

    if (activeEndpointId === "workflow-automation-guide") {
      let curl = `curl -X POST "https://api.scryme.tech/v3/automation/trigger" \\\n  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "key": "lowstock_alert",\n    "payload": {\n      "productId": "prod_123",\n      "currentStock": 3\n    }\n  }'`;

      let node = `// Node.js SDK Code\nimport { ScrymeServerSDK } from '@scryme/sdk/server';\n\nconst scrymeServer = new ScrymeServerSDK({\n  baseURL: "https://api.scryme.tech",\n  orgSlug: "bakery-co",\n  clientId: "your_client_id_123",\n  clientSecret: "your_client_secret_456",\n});\n\n// Provision organization workflow definitions with custom threshold config\nconst provisioned = await fetch("https://api.scryme.tech/v3/automation/definitions/provision", {\n  method: "POST",\n  headers: { "Authorization": "Bearer <ACCESS_TOKEN>", "Content-Type": "application/json" },\n  body: JSON.stringify({ customConfigs: { lowstock_alert: { threshold: 15 } } })\n});`;

      let python = `import requests\n\nurl = "https://api.scryme.tech/v3/automation/trigger"\nheaders = {\n    "Authorization": "Bearer <YOUR_ACCESS_TOKEN>",\n    "Content-Type": "application/json"\n}\npayload = {\n    "key": "lowstock_alert",\n    "payload": {"productId": "prod_123", "currentStock": 3}\n}\nresponse = requests.post(url, json=payload, headers=headers)\nprint(response.json())`;

      return { curl, node, python };
    }

    if (activeEndpointId === "installation-setup-guide") {
      let curl = `pnpm add @scryme/sdk`;
      let node = `// Node.js SDK Code\nimport { ScrymeServerSDK } from '@scryme/sdk/server';\n\nconst scrymeServer = new ScrymeServerSDK({\n  baseURL: "https://api.scryme.tech",\n  orgSlug: "your-org-slug",\n  clientId: "your_client_id_123",\n  clientSecret: "your_client_secret_456",\n});`;
      let python = `# Scryme SDK is natively for Node.js / TypeScript`;
      return { curl, node, python };
    }

    if (activeEndpointId === "v3-global-response-guide") {
      const targetUrl = `${normalizedApiUrl}/v3/bakery-co/inventory?locationId=loc_main`;
      const targetMethod = "GET";

      let curl = `curl -X ${targetMethod} "${targetUrl}" \\\n  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \\\n  -H "Content-Type: application/json"`;

      let node = `// Node.js SDK Code\nimport { ScrymeServerSDK } from '@scryme/sdk/server';\n\nconst scrymeServer = new ScrymeServerSDK({\n  baseURL: "${normalizedApiUrl}",\n  orgSlug: "bakery-co",\n  clientId: "your_client_id_123",\n  clientSecret: "your_client_secret_456",\n});\n\ntry {\n  // 1. Call APIs directly—the SDK handles token retrieval, refresh, and auto-injection of orgSlug automatically!\n  const response = await scrymeServer.inventory.getInventory({\n    locationId: "loc_main"\n  });\n  console.log(response.data); // Standardized enveloped response!\n} catch (error) {\n  console.error("Error:", error);\n}`;

      let python = `import requests\n\nurl = "${targetUrl}"\nheaders = {\n    "Authorization": "Bearer <YOUR_ACCESS_TOKEN>",\n    "Content-Type": "application/json"\n}\n\nresponse = requests.get(url, headers=headers)\nprint(response.json()) # Expect wrapped global response structure!`;

      return { curl, node, python };
    }

    if (activeEndpointId === "cms-customization-guide") {
      const baseUrl = `${normalizedApiUrl}/v3`;

      const targetPayload = {
        name: simState.name,
        sku: simState.sku,
        price: simState.price,
        customFields: {
          markdownDescription: simState.markdownDescription,
          images: [
            {
              id: "img_cms_primary",
              url: simState.imageUrl,
              caption: simState.name,
            },
          ],
          seo: {
            title: simState.seoTitle,
            description: simState.seoDesc,
            keywords: "baking, premium",
          },
          customAttributes: {
            instructor_name: simState.instructor,
          },
        },
      };

      const targetUrl =
        selectedCmsTarget === "service"
          ? `${baseUrl}/bakery-co/services/srv_sourdough_101`
          : `${baseUrl}/bakery-co/catalog/products/prod_proofing_basket`;
      const targetMethod = "PATCH";

      const bodyStr = JSON.stringify(targetPayload, null, 2);

      let curl = `curl -X ${targetMethod} "${targetUrl}" \\\n  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \\\n  -H "Content-Type: application/json" \\\n  -d '${bodyStr.replace(/'/g, "'\\''")}'`;

      const targetMethodCall = selectedCmsTarget === "service"
        ? `catalog.updateService("srv_sourdough_101", ${JSON.stringify(targetPayload, null, 2)})`
        : `catalog.updateProduct("prod_proofing_basket", ${JSON.stringify(targetPayload, null, 2)})`;

      let node = `// Node.js SDK Code\nimport { ScrymeServerSDK } from '@scryme/sdk/server';\n\nconst scrymeServer = new ScrymeServerSDK({\n  baseURL: "${normalizedApiUrl}",\n  orgSlug: "bakery-co",\n  clientId: "your_client_id_123",\n  clientSecret: "your_client_secret_456",\n});\n\ntry {\n  // 1. Call API directly via the catalog submodule—the SDK handles token retrieval, refresh, and auto-injection of orgSlug automatically!\n  const response = await scrymeServer.${targetMethodCall};\n  console.log(response.data);\n} catch (error) {\n  console.error("Error:", error);\n}`;

      let python = `import requests\n\nurl = "${targetUrl}"\nheaders = {\n    "Authorization": "Bearer <YOUR_ACCESS_TOKEN>",\n    "Content-Type": "application/json"\n}\npayload = ${JSON.stringify(targetPayload, null, 4).replace(/true/g, "True").replace(/false/g, "False").replace(/null/g, "None")}\n\nresponse = requests.patch(url, json=payload, headers=headers)\nprint(response.json())`;

      return { curl, node, python };
    }

    if (!activeEndpoint) return { curl: "", node: "", python: "" };

    const baseUrl = normalizedApiUrl;
    const path = getDynamicUrl(activeEndpoint.path);
    const method = activeEndpoint.method;
    const fullUrl = `${baseUrl}${path}`;

    const bodyStr = mockRequestPayload
      ? JSON.stringify(mockRequestPayload, null, 2)
      : "";

    let curl = `curl -X ${method} "${fullUrl}" \\\n  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \\\n  -H "Content-Type: application/json"`;
    if (bodyStr) {
      curl += ` \\\n  -d '${bodyStr.replace(/'/g, "'\\''")}'`;
    }

    const sdkArgs: string[] = [];
    activeEndpoint.parameters?.forEach((param) => {
      if (param.in === "path" && param.name !== "orgSlug") {
        const val = playgroundParams[param.name] || param.schema?.default || "string_value";
        sdkArgs.push(`"${val}"`);
      }
    });

    if (mockRequestPayload && Object.keys(mockRequestPayload).length > 0) {
      sdkArgs.push(JSON.stringify(mockRequestPayload, null, 2));
    }

    const queryParams: Record<string, any> = {};
    activeEndpoint.parameters?.forEach((param) => {
      if (param.in === "query" && param.name !== "orgSlug") {
        const val = playgroundParams[param.name];
        if (val !== undefined && val !== "") {
          queryParams[param.name] = val;
        }
      }
    });
    if (Object.keys(queryParams).length > 0) {
      sdkArgs.push(JSON.stringify(queryParams, null, 2));
    }

    const argsStr = sdkArgs.join(", ");
    let classCall = "";
    let found = false;
    const normOpId = activeEndpoint.operationId.toLowerCase().replace(/_/g, "");
    for (const [moduleName, moduleMapping] of Object.entries(mappings)) {
      for (const [methodName, legacyId] of Object.entries(moduleMapping)) {
        if (legacyId.toLowerCase().replace(/_/g, "") === normOpId) {
          classCall = `scrymeServer.${moduleName}.${methodName}(${argsStr})`;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (!classCall) {
      classCall = `scrymeServer.api.${activeEndpoint.operationId}(${argsStr})`;
    }

    let node = `// Node.js SDK Code\nimport { ScrymeServerSDK } from '@scryme/sdk/server';\n\nconst scrymeServer = new ScrymeServerSDK({\n  baseURL: "${normalizedApiUrl}",\n  orgSlug: "bakery-co",\n  clientId: "your_client_id_123",\n  clientSecret: "your_client_secret_456",\n});\n\ntry {\n  // 1. Perform the API call via submodule—the SDK handles token retrieval, refresh, and auto-injection of orgSlug automatically!\n  const response = await ${classCall};\n  console.log(response.data);\n} catch (error) {\n  console.error("Error:", error);\n}`;

    let python = `import requests\n\n`;
    python += `url = "${fullUrl}"\n`;
    python += `headers = {\n    "Authorization": "Bearer <YOUR_ACCESS_TOKEN>",\n    "Content-Type": "application/json"\n}\n`;
    if (mockRequestPayload) {
      python += `payload = ${JSON.stringify(mockRequestPayload, null, 4).replace(/true/g, "True").replace(/false/g, "False").replace(/null/g, "None")}\n`;
      python += `response = requests.${method.toLowerCase()}(url, json=payload, headers=headers)\n`;
    } else {
      python += `response = requests.${method.toLowerCase()}(url, headers=headers)\n`;
    }
    python += `print(response.json())\n`;

    return { curl, node, python };
  }, [
    activeEndpoint,
    mockRequestPayload,
    activeEndpointId,
    selectedCmsTarget,
    playgroundParams,
    playgroundBody,
    simState,
  ]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMap((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const toggleGroup = (tag: string) => {
    setExpandedGroups((prev) => ({ ...prev, [tag]: !prev[tag] }));
  };

  const expandAllGroups = () => {
    const next: Record<string, boolean> = {};
    Object.keys(tagGroups).forEach((tag) => {
      next[tag] = true;
    });
    setExpandedGroups(next);
  };

  const collapseAllGroups = () => {
    const next: Record<string, boolean> = {};
    Object.keys(tagGroups).forEach((tag) => {
      next[tag] = false;
    });
    setExpandedGroups(next);
  };

  // Simulated API request action
  const sendSimulatedRequest = () => {
    setIsPlayingLoading(true);
    setTimeout(() => {
      setIsPlayingLoading(false);
      setPlaygroundResponse(mockResponsePayload || { success: true });
    }, 1000);
  };

  // Next and Previous pagination logic
  const chronologicalList = useMemo(() => {
    const list: { id: string; type: "guide" | "api"; name: string }[] = [
      {
        id: "installation-setup-guide",
        type: "guide",
        name: "Installation & Setup",
      },
      {
        id: "cms-customization-guide",
        type: "guide",
        name: "CMS Customization Engine",
      },
      {
        id: "v3-global-response-guide",
        type: "guide",
        name: "Global Response Structure",
      },
      {
        id: "customer-registration-guide",
        type: "guide",
        name: "Customer Auth & Sessions",
      },
      {
        id: "signin-scryme-guide",
        type: "guide",
        name: "Sign in with Scryme",
      },
      {
        id: "workflow-automation-guide",
        type: "guide",
        name: "Workflow & Automation",
      },
    ];
    endpoints.forEach((ep) => {
      list.push({
        id: ep.operationId,
        type: "api",
        name: ep.summary || ep.path,
      });
    });
    return list;
  }, [endpoints]);

  const currentChronoIndex = useMemo(() => {
    return chronologicalList.findIndex((item) => item.id === activeEndpointId);
  }, [chronologicalList, activeEndpointId]);

  const handlePrevPage = () => {
    if (currentChronoIndex > 0) {
      setActiveEndpointId(chronologicalList[currentChronoIndex - 1].id);
    }
  };

  const handleNextPage = () => {
    if (currentChronoIndex < chronologicalList.length - 1) {
      setActiveEndpointId(chronologicalList[currentChronoIndex + 1].id);
    }
  };

  // Helper to render schemas in intermediate tabular format
  const renderSchemaProperties = (
    properties: any,
    requiredList: string[] = [],
    prefix = "",
  ) => {
    if (!properties) return null;

    return Object.entries(properties).map(([key, prop]: [string, any]) => {
      const isRequired = requiredList.includes(key);
      const isObject = prop.type === "object";
      const isArray = prop.type === "array";

      return (
        <div
          key={prefix + key}
          className="py-3.5 border-b border-ink-border/50 last:border-b-0 text-sm"
        >
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="font-mono text-paper font-semibold text-[13px]">
              {prefix + key}
            </span>
            <span className="text-brass/90 text-[11px] font-mono font-medium tracking-wide">
              {prop.type || "any"}
            </span>
            {isRequired && (
              <span className="text-rose-400 text-[10px] font-mono uppercase tracking-wider font-semibold">
                required
              </span>
            )}
          </div>
          {prop.description && (
            <p className="text-light-text mt-1.5 text-xs leading-relaxed">
              {prop.description}
            </p>
          )}
          {prop.enum && (
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-brass/70 text-[10px] font-mono font-semibold uppercase tracking-wide">
                Allowed
              </span>
              {prop.enum.map((val: string) => (
                <span
                  key={val}
                  className="bg-ink-bg text-light-text px-1.5 py-0.5 rounded-md text-[11px] font-mono border border-ink-border"
                >
                  {val}
                </span>
              ))}
            </div>
          )}
          {isObject && prop.properties && (
            <div className="pl-4 mt-2.5 border-l-2 border-brass/15">
              {renderSchemaProperties(
                prop.properties,
                prop.required || [],
                `${prefix + key}.`,
              )}
            </div>
          )}
          {isArray && prop.items && prop.items.properties && (
            <div className="pl-4 mt-2.5 border-l-2 border-brass/15">
              <div className="text-[10px] text-brass/60 font-mono uppercase tracking-wide mb-2">
                Array item properties
              </div>
              {renderSchemaProperties(
                prop.items.properties,
                prop.items.required || [],
                `${prefix + key}[].`,
              )}
            </div>
          )}
        </div>
      );
    });
  };

  // Fast Regex Code Syntax Highlighter
  const renderHighlightedCode = (code: string, language: string) => {
    if (!code) return "";
    let safe = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    if (language === "json") {
      safe = safe.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
        (match) => {
          let cls = "text-purple-400";
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = "text-[#C89A4B] font-semibold";
            } else {
              cls = "text-emerald-400";
            }
          } else if (/true|false/.test(match)) {
            cls = "text-sky-400 font-semibold";
          } else if (/null/.test(match)) {
            cls = "text-slate-400 italic";
          }
          if (cls === "text-[#C89A4B] font-semibold") {
            return `<span class="${cls}">${match.slice(0, -1)}</span>:`;
          }
          return `<span class="${cls}">${match}</span>`;
        },
      );
    } else if (language === "curl") {
      safe = safe
        .replace(
          /(curl|-X|-H|-d|\\)/g,
          '<span class="text-sky-400 font-semibold">$1</span>',
        )
        .replace(
          /("Authorization: [^"]*")/g,
          '<span class="text-amber-400 font-medium">$1</span>',
        )
        .replace(
          /("Content-Type: [^"]*")/g,
          '<span class="text-amber-400 font-medium">$1</span>',
        )
        .replace(
          /("https:\/\/[^"]*")/g,
          '<span class="text-emerald-400 font-medium">$1</span>',
        );
    } else if (language === "node" || language === "python") {
      const placeholders: string[] = [];

      // 1. Extract comments and replace with placeholder
      safe = safe.replace(/(\/\/.*|#.*)/g, (match) => {
        const id = placeholders.length;
        placeholders.push(`<span class="text-slate-400 italic">${match}</span>`);
        return `___PLACEHOLDER_${id}___`;
      });

      // 2. Extract strings and replace with placeholder
      safe = safe.replace(/("[^"]*"|'[^']*')/g, (match) => {
        const id = placeholders.length;
        placeholders.push(`<span class="text-emerald-400">${match}</span>`);
        return `___PLACEHOLDER_${id}___`;
      });

      // 3. Highlight keywords
      safe = safe.replace(
        /\b(const|let|var|await|try|catch|function|import|from|requests|print|json)\b/g,
        '<span class="text-sky-400 font-semibold">$1</span>',
      );

      // 4. Restore placeholders in reverse order (to handle any nesting safely)
      for (let i = placeholders.length - 1; i >= 0; i--) {
        safe = safe.replace(`___PLACEHOLDER_${i}___`, placeholders[i]);
      }
    }
    return <span dangerouslySetInnerHTML={{ __html: safe }} />;
  };

  return (
    <div className="min-h-screen bg-ink-bg text-paper flex flex-col font-sans antialiased transition-colors duration-200 [font-feature-settings:'ss01','cv01']">
      {/* Universal Header with Brand Logo, Versioning, and Theme Switching */}
      <header className="h-14 border-b border-ink-border bg-ink-bg/90 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-50 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 -ml-1.5 text-paper hover:text-brass transition-colors lg:hidden"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[7px] bg-gradient-to-br from-[#3EBB6B] to-[#2C8F50] flex items-center justify-center font-black text-white text-[13px] shadow-sm shadow-[#34A853]/30 ring-1 ring-white/10">
              S
            </div>
            <div className="leading-none">
              <span className="font-bold tracking-tight text-paper block text-[13px]">
                Scryme Ledger
              </span>
              <span className="text-[10px] text-brass/90 uppercase tracking-[0.14em] font-semibold">
                V3 API Reference
              </span>
            </div>
          </div>
        </div>

        {/* Center search affordance (desktop) */}
        <button
          onClick={() => searchInputRef.current?.focus()}
          className="hidden md:flex items-center gap-2.5 w-72 px-3 py-1.5 rounded-lg border border-ink-border bg-ink-card/60 text-light-text/70 text-xs hover:border-brass/40 hover:text-light-text transition-colors cursor-pointer"
        >
          <Search size={13} />
          <span className="flex-1 text-left">Search documentation…</span>
          <span className="bg-ink-bg border border-ink-border text-[9px] font-mono font-bold px-1.5 py-0.5 rounded text-light-text/70">
            ⌘K
          </span>
        </button>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 bg-ink-card p-0.5 border border-ink-border rounded-lg">
            <button
              onClick={() => navigate("/")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                !isApiReference
                  ? "bg-brass text-ink-bg font-bold"
                  : "text-light-text hover:text-paper"
              }`}
            >
              User Guides
            </button>
            <button
              onClick={() => navigate("/api-reference")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                isApiReference
                  ? "bg-brass text-ink-bg font-bold"
                  : "text-light-text hover:text-paper"
              }`}
            >
              API Reference
            </button>
          </div>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg border border-ink-border bg-ink-card text-light-text hover:text-paper hover:border-brass/40 transition-all duration-200 cursor-pointer"
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 relative">
        {/* If on User Guides home page, render UserGuides and bypass standard sidebar */}
        {!isApiReference ? (
          <div className="flex-1 p-6 lg:p-12 space-y-8 max-w-7xl mx-auto w-full">
            <UserGuides />
          </div>
        ) : (
          <>
        {/* Sidebar Left Column */}
        <aside
          className={`fixed inset-y-14 lg:inset-y-0 left-0 w-72 bg-ink-bg border-r border-ink-border overflow-y-auto z-40 transition-transform duration-300 transform
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:sticky lg:h-[calc(100vh-56px)] flex flex-col`}
        >
          {/* Search Box (mobile-visible, always present) */}
          <div className="p-3.5 border-b border-ink-border/60">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text/60"
                size={14}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search specs…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-ink-card text-paper pl-8 pr-8 py-2 rounded-lg border border-ink-border focus:outline-none focus:ring-2 focus:ring-brass/30 focus:border-brass text-[13px] transition-all placeholder-light-text/50"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-light-text hover:text-paper"
                >
                  <X size={13} />
                </button>
              ) : (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-ink-bg border border-ink-border text-[9px] font-mono font-bold px-1.5 py-0.5 rounded text-light-text/70">
                  /
                </span>
              )}
            </div>
          </div>

          {/* Expand/Collapse All controls */}
          <div className="px-3.5 py-2.5 flex items-center justify-between text-[10px] font-bold text-light-text/70 uppercase tracking-[0.1em] border-b border-ink-border/30">
            <span>Navigation</span>
            <div className="flex gap-2.5">
              <button
                onClick={expandAllGroups}
                className="hover:text-brass cursor-pointer transition-colors"
              >
                Expand
              </button>
              <span className="text-ink-border">/</span>
              <button
                onClick={collapseAllGroups}
                className="hover:text-brass cursor-pointer transition-colors"
              >
                Collapse
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-3.5 space-y-5 overflow-y-auto">
            {/* Core Pinned Customization Guide */}
            {showGuideInSearch && (
              <div className="space-y-0.5">
                <span className="text-[10px] text-brass/80 uppercase tracking-[0.14em] font-bold px-2.5 block mb-1.5">
                  Guides
                </span>
                <button
                  onClick={() => {
                    setActiveEndpointId("installation-setup-guide");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 py-2 px-2.5 rounded-md text-left text-[13px] transition-all duration-150 cursor-pointer ${
                    activeEndpointId === "installation-setup-guide"
                      ? "bg-brass/[0.14] text-paper font-semibold"
                      : "text-light-text hover:text-paper hover:bg-ink-card/70"
                  }`}
                >
                  <Download size={14} className="text-brass shrink-0" />
                  <span className="truncate">Installation & Setup</span>
                </button>
                <button
                  onClick={() => {
                    setActiveEndpointId("cms-customization-guide");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 py-2 px-2.5 rounded-md text-left text-[13px] transition-all duration-150 cursor-pointer ${
                    activeEndpointId === "cms-customization-guide"
                      ? "bg-brass/[0.14] text-paper font-semibold"
                      : "text-light-text hover:text-paper hover:bg-ink-card/70"
                  }`}
                >
                  <BookOpen size={14} className="text-brass shrink-0" />
                  <span className="truncate">CMS Customization Engine</span>
                </button>
                <button
                  onClick={() => {
                    setActiveEndpointId("v3-global-response-guide");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 py-2 px-2.5 rounded-md text-left text-[13px] transition-all duration-150 cursor-pointer ${
                    activeEndpointId === "v3-global-response-guide"
                      ? "bg-brass/[0.14] text-paper font-semibold"
                      : "text-light-text hover:text-paper hover:bg-ink-card/70"
                  }`}
                >
                  <Workflow size={14} className="text-brass shrink-0" />
                  <span className="truncate">Global Response Structure</span>
                </button>
                <button
                  onClick={() => {
                    setActiveEndpointId("customer-registration-guide");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 py-2 px-2.5 rounded-md text-left text-[13px] transition-all duration-150 cursor-pointer ${
                    activeEndpointId === "customer-registration-guide"
                      ? "bg-brass/[0.14] text-paper font-semibold"
                      : "text-light-text hover:text-paper hover:bg-ink-card/70"
                  }`}
                >
                  <Lock size={14} className="text-brass shrink-0" />
                  <span className="truncate">Customer Auth & Sessions</span>
                </button>
                <button
                  onClick={() => {
                    setActiveEndpointId("signin-scryme-guide");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 py-2 px-2.5 rounded-md text-left text-[13px] transition-all duration-150 cursor-pointer ${
                    activeEndpointId === "signin-scryme-guide"
                      ? "bg-brass/[0.14] text-paper font-semibold"
                      : "text-light-text hover:text-paper hover:bg-ink-card/70"
                  }`}
                >
                  <Fingerprint size={14} className="text-brass shrink-0" />
                  <span className="truncate">Sign in with Scryme</span>
                </button>
                <button
                  onClick={() => {
                    setActiveEndpointId("workflow-automation-guide");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 py-2 px-2.5 rounded-md text-left text-[13px] transition-all duration-150 cursor-pointer ${
                    activeEndpointId === "workflow-automation-guide"
                      ? "bg-brass/[0.14] text-paper font-semibold"
                      : "text-light-text hover:text-paper hover:bg-ink-card/70"
                  }`}
                >
                  <Workflow size={14} className="text-brass shrink-0" />
                  <span className="truncate">Workflow & Automation</span>
                </button>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[10px] text-brass/80 uppercase tracking-[0.14em] font-bold px-2.5 block">
                API Reference
              </span>

              {Object.entries(filteredTagGroups).map(([tag, eps]) => {
                const isExpanded = !!expandedGroups[tag];
                const epCount = eps.length;
                return (
                  <div key={tag}>
                    <button
                      onClick={() => toggleGroup(tag)}
                      className="w-full flex items-center justify-between text-left font-semibold text-[12px] text-light-text/90 py-1.5 px-2.5 hover:text-paper rounded-md transition-colors cursor-pointer"
                    >
                      <span className="truncate pr-2">
                        {tag.replace("V3 ", "")}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-light-text/50 text-[10px] font-mono">
                          {epCount}
                        </span>
                        {isExpanded ? (
                          <ChevronDown
                            size={13}
                            className="text-light-text/60"
                          />
                        ) : (
                          <ChevronRight
                            size={13}
                            className="text-light-text/60"
                          />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="space-y-0.5 mt-0.5 mb-1">
                        {eps.map((ep) => {
                          const isActive = activeEndpointId === ep.operationId;
                          return (
                            <button
                              key={ep.operationId}
                              onClick={() => {
                                setActiveEndpointId(ep.operationId);
                                setSidebarOpen(false);
                              }}
                              className={`w-full flex items-center gap-2 py-[7px] pl-4 pr-2.5 rounded-md text-left text-[12.5px] transition-all duration-150 cursor-pointer ${
                                isActive
                                  ? "bg-brass/[0.14] text-paper font-semibold"
                                  : "text-light-text hover:text-paper hover:bg-ink-card/70"
                              }`}
                            >
                              <span
                                className={`text-[8.5px] font-bold px-1.5 py-[1px] rounded uppercase font-mono shrink-0 border ${methodBadge(ep.method)}`}
                              >
                                {ep.method}
                              </span>
                              <span className="truncate">
                                {ep.summary || ep.path}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* Footer inside Sidebar */}
          <div className="p-3.5 border-t border-ink-border text-[10px] text-light-text/60 flex items-center justify-between transition-colors duration-200">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34A853] inline-block" />
              All systems operational
            </span>
            <span className="font-mono">v3.0.0</span>
          </div>
        </aside>

        {/* Content Wrapper (Middle + Right columns) */}
        <main className="flex-1 lg:grid lg:grid-cols-12 min-h-[calc(100vh-56px)]">
          {/* MIDDLE COLUMN */}
          <section className="col-span-7 p-6 lg:px-14 lg:py-12 overflow-y-auto space-y-10 border-r border-ink-border/60 max-w-4xl flex flex-col justify-between transition-colors duration-200">
            <div className="space-y-10 flex-1">
              {activeEndpointId === "installation-setup-guide" ? (
                <InstallationSetupGuide
                  renderHighlightedCode={renderHighlightedCode}
                />
              ) : activeEndpointId === "v3-global-response-guide" ? (
                <GlobalResponseGuide
                  renderHighlightedCode={renderHighlightedCode}
                />
              ) : activeEndpointId === "customer-registration-guide" ? (
                <CustomerAuthGuide
                  renderHighlightedCode={renderHighlightedCode}
                />
              ) : activeEndpointId === "signin-scryme-guide" ? (
                <SignInWithScrymeGuide
                  renderHighlightedCode={renderHighlightedCode}
                />
              ) : activeEndpointId === "workflow-automation-guide" ? (
                <WorkflowAutomationGuide
                  renderHighlightedCode={renderHighlightedCode}
                />
              ) : activeEndpointId === "cms-customization-guide" ? (
                <CmsCustomizationGuide
                  selectedCmsTarget={selectedCmsTarget}
                  setSelectedCmsTarget={setSelectedCmsTarget}
                  simState={simState}
                  onSimStateChange={handleSimStateChange}
                  onApplyPreset={applyPreset}
                  copiedMap={copiedMap}
                  onCopy={handleCopy}
                  renderHighlightedCode={renderHighlightedCode}
                />
              ) : activeEndpoint ? (
                // --- STANDARD ENDPOINT DETAILED VIEW ---
                <div className="space-y-8">
                  {/* Breadcrumb + Header */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-light-text/70 font-medium">
                      <span>Reference</span>
                      <ChevronRight size={11} className="text-light-text/40" />
                      <span className="text-brass">
                        {activeEndpoint.tag.replace("V3 ", "")}
                      </span>
                    </div>
                    <h1 className="text-[28px] font-bold text-paper leading-[1.15] tracking-tight">
                      {activeEndpoint.summary}
                    </h1>
                  </div>

                  {/* Tabs: Reference, Playground, Schema — segmented control */}
                  <div className="inline-flex items-center gap-1 p-1 bg-ink-card/70 border border-ink-border rounded-lg">
                    {(
                      [
                        { key: "reference", label: "Reference", icon: null },
                        { key: "playground", label: "Playground", icon: Play },
                        { key: "schema", label: "Schema", icon: null },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setActiveDocTab(t.key)}
                        className={`px-3.5 py-1.5 text-[11.5px] font-semibold rounded-md cursor-pointer transition-all duration-150 flex items-center gap-1.5 ${
                          activeDocTab === t.key
                            ? "bg-brass text-ink-bg shadow-sm"
                            : "text-light-text hover:text-paper"
                        }`}
                      >
                        {t.icon && <t.icon size={11} />}
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {activeDocTab === "reference" && (
                    <div className="space-y-8 animate-fade-in">
                      {/* HTTP Endpoint Tag & Path */}
                      <div className="bg-ink-card rounded-xl border border-ink-border p-3.5 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`text-[11px] font-bold px-2 py-1 rounded-md uppercase font-mono tracking-wide border shrink-0 ${methodBadge(activeEndpoint.method)}`}
                          >
                            {activeEndpoint.method}
                          </span>
                          <code className="text-paper font-mono text-[13px] break-all font-medium">
                            {getDynamicUrl(activeEndpoint.path)}
                          </code>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-light-text bg-ink-bg px-2.5 py-1 rounded-md border border-ink-border shrink-0">
                          <Lock size={11} className="text-brass" />
                          <span className="font-mono">Bearer Token</span>
                        </div>
                      </div>

                      {/* Description */}
                      {activeEndpoint.description && (
                        <div className="space-y-2.5">
                          <h2 className="text-[11px] uppercase tracking-[0.12em] font-bold text-brass/90">
                            Description
                          </h2>
                          <p className="text-light-text text-[13.5px] leading-[1.7] whitespace-pre-line">
                            {activeEndpoint.description}
                          </p>
                        </div>
                      )}

                      {/* Path/Query Parameters */}
                      {activeEndpoint.parameters &&
                        activeEndpoint.parameters.length > 0 && (
                          <div className="space-y-3">
                            <h2 className="text-[11px] uppercase tracking-[0.12em] font-bold text-brass/90">
                              Parameters
                            </h2>
                            <div className="border border-ink-border rounded-xl bg-ink-card/40 px-4 divide-y divide-ink-border/50">
                              {activeEndpoint.parameters.map((param: any) => (
                                <div
                                  key={param.name}
                                  className="py-3.5 first:pt-3.5 last:pb-3.5 text-sm"
                                >
                                  <div className="flex flex-wrap items-baseline gap-2.5">
                                    <span className="font-mono text-paper font-semibold text-[13px]">
                                      {param.name}
                                    </span>
                                    <span className="text-brass/90 text-[11px] font-mono font-medium">
                                      {param.schema?.type || "string"}
                                    </span>
                                    <span className="bg-ink-bg text-light-text/80 text-[9.5px] font-mono px-1.5 py-0.5 rounded border border-ink-border uppercase tracking-wide">
                                      {param.in}
                                    </span>
                                    {param.required && (
                                      <span className="text-rose-400 text-[10px] font-mono uppercase font-semibold tracking-wider">
                                        required
                                      </span>
                                    )}
                                  </div>
                                  {param.description && (
                                    <p className="text-light-text mt-1.5 text-xs leading-relaxed">
                                      {param.description}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Request Body Properties */}
                      {requestBodySchema && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <h2 className="text-[11px] uppercase tracking-[0.12em] font-bold text-brass/90">
                              Request Body
                            </h2>
                            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/25 text-[9.5px] font-mono px-1.5 py-0.5 rounded font-bold uppercase">
                              json
                            </span>
                          </div>

                          <div className="border border-ink-border rounded-xl bg-ink-card/40 px-4">
                            {requestBodySchema.properties ? (
                              <div>
                                {renderSchemaProperties(
                                  requestBodySchema.properties,
                                  requestBodySchema.required || [],
                                )}
                              </div>
                            ) : (
                              <p className="text-light-text text-xs font-mono py-3.5">
                                Any valid JSON object
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeDocTab === "playground" && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-brass/[0.08] text-paper/90 border border-brass/20 rounded-xl p-3.5 text-[12.5px] leading-relaxed flex gap-2.5">
                        <Play
                          size={14}
                          className="text-brass shrink-0 mt-0.5"
                        />
                        <span>
                          <strong className="text-brass">
                            Interactive sandbox.
                          </strong>{" "}
                          Fill in parameters below to rebuild headers, query
                          filters, JSON payloads, and code snippets in real
                          time, then hit <strong>Send Request</strong> to mock a
                          full cycle.
                        </span>
                      </div>

                      {/* Parameters Form Inputs */}
                      {activeEndpoint.parameters &&
                        activeEndpoint.parameters.length > 0 && (
                          <div className="space-y-2.5">
                            <h3 className="text-[11px] uppercase tracking-[0.12em] font-bold text-brass/90">
                              Query & Path Params
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-ink-card/40 border border-ink-border p-4 rounded-xl">
                              {activeEndpoint.parameters.map((param: any) => (
                                <div key={param.name} className="space-y-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wide text-paper flex items-center justify-between">
                                    <span>
                                      {param.name}{" "}
                                      {param.required && (
                                        <span className="text-rose-400 font-black">
                                          *
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-brass/80 font-mono text-[9px]">
                                      {param.in}
                                    </span>
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={`Enter ${param.name}…`}
                                    value={playgroundParams[param.name] || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setPlaygroundParams((prev) => ({
                                        ...prev,
                                        [param.name]: val,
                                      }));
                                    }}
                                    className="w-full bg-ink-bg border border-ink-border rounded-md px-2.5 py-1.5 text-xs text-paper focus:outline-none focus:ring-2 focus:ring-brass/30 focus:border-brass transition-all"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Request Body Fields Editor */}
                      {requestBodySchema && requestBodySchema.properties && (
                        <div className="space-y-2.5">
                          <h3 className="text-[11px] uppercase tracking-[0.12em] font-bold text-brass/90">
                            Request Payload Fields
                          </h3>
                          <div className="bg-ink-card/40 border border-ink-border p-4 rounded-xl space-y-3.5">
                            {Object.entries(requestBodySchema.properties).map(
                              ([key, prop]: [string, any]) => {
                                const isRequired =
                                  requestBodySchema.required?.includes(key);
                                const currentVal = playgroundBody[key];

                                return (
                                  <div
                                    key={key}
                                    className="space-y-1.5 text-xs"
                                  >
                                    <label className="font-semibold text-paper flex items-baseline justify-between">
                                      <span>
                                        {key}{" "}
                                        {isRequired && (
                                          <span className="text-rose-400">
                                            *
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-brass/80 font-mono text-[9px]">
                                        {prop.type || "string"}
                                      </span>
                                    </label>
                                    {prop.type === "boolean" ? (
                                      <select
                                        value={String(!!currentVal)}
                                        onChange={(e) => {
                                          const boolVal =
                                            e.target.value === "true";
                                          setPlaygroundBody((prev) => ({
                                            ...prev,
                                            [key]: boolVal,
                                          }));
                                        }}
                                        className="w-full bg-ink-bg border border-ink-border rounded-md px-2.5 py-1.5 text-xs text-paper focus:outline-none focus:ring-2 focus:ring-brass/30 focus:border-brass transition-all"
                                      >
                                        <option value="true">true</option>
                                        <option value="false">false</option>
                                      </select>
                                    ) : prop.type === "number" ||
                                      prop.type === "integer" ? (
                                      <input
                                        type="number"
                                        value={
                                          currentVal === undefined
                                            ? ""
                                            : Number(currentVal)
                                        }
                                        onChange={(e) => {
                                          const numVal =
                                            e.target.value === ""
                                              ? ""
                                              : Number(e.target.value);
                                          setPlaygroundBody((prev) => ({
                                            ...prev,
                                            [key]: numVal,
                                          }));
                                        }}
                                        className="w-full bg-ink-bg border border-ink-border rounded-md px-2.5 py-1.5 text-xs text-paper focus:outline-none focus:ring-2 focus:ring-brass/30 focus:border-brass transition-all"
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        value={
                                          currentVal === undefined
                                            ? ""
                                            : String(currentVal)
                                        }
                                        onChange={(e) => {
                                          const txtVal = e.target.value;
                                          setPlaygroundBody((prev) => ({
                                            ...prev,
                                            [key]: txtVal,
                                          }));
                                        }}
                                        className="w-full bg-ink-bg border border-ink-border rounded-md px-2.5 py-1.5 text-xs text-paper focus:outline-none focus:ring-2 focus:ring-brass/30 focus:border-brass transition-all"
                                      />
                                    )}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      )}

                      {/* Playground Send Action Button */}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={sendSimulatedRequest}
                          disabled={isPlayingLoading}
                          className="bg-brass hover:bg-white hover:shadow-md hover:-translate-y-px text-ink-bg font-bold text-[12px] px-4 py-2.5 tracking-wide rounded-lg flex items-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:translate-y-0"
                        >
                          {isPlayingLoading ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" />
                              Sending…
                            </>
                          ) : (
                            <>
                              <Send size={13} />
                              Send Request
                            </>
                          )}
                        </button>
                      </div>

                      {/* Playground Response Block */}
                      {playgroundResponse && (
                        <div className="space-y-2.5 animate-fade-in">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[11px] uppercase tracking-[0.12em] font-bold text-brass/90">
                              Response
                            </h4>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-mono font-bold uppercase tracking-wide px-2 py-0.5 rounded">
                              200 OK · simulated
                            </span>
                          </div>
                          <div className="relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-4 text-xs font-mono shadow-sm">
                            <button
                              onClick={() =>
                                handleCopy(
                                  JSON.stringify(playgroundResponse, null, 2),
                                  "playground-resp",
                                )
                              }
                              className="absolute right-3 top-3 p-1.5 rounded-lg bg-ink-card text-light-text hover:text-paper border border-ink-border transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            >
                              {copiedMap["playground-resp"] ? (
                                <Check size={13} className="text-emerald-400" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                            <pre className="overflow-x-auto text-emerald-300 whitespace-pre leading-relaxed scrollbar-thin max-h-96">
                              <code>
                                {renderHighlightedCode(
                                  JSON.stringify(playgroundResponse, null, 2),
                                  "json",
                                )}
                              </code>
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeDocTab === "schema" && (
                    <div className="space-y-3.5 animate-fade-in">
                      <h3 className="text-[11px] uppercase tracking-[0.12em] font-bold text-brass/90">
                        Raw response schema
                      </h3>
                      <p className="text-[13px] text-light-text leading-relaxed">
                        The complete model representation, parsed dynamically
                        from the central specification.
                      </p>
                      <div className="relative group rounded-xl overflow-hidden bg-ink-bg border border-ink-border p-4 text-xs font-mono shadow-sm">
                        <button
                          onClick={() =>
                            handleCopy(
                              JSON.stringify(activeEndpoint.responses, null, 2),
                              "raw-schema",
                            )
                          }
                          className="absolute right-3 top-3 p-1.5 rounded-lg bg-ink-card text-light-text hover:text-paper border border-ink-border transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          {copiedMap["raw-schema"] ? (
                            <Check size={13} className="text-emerald-400" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                        <pre className="overflow-x-auto text-purple-300 whitespace-pre leading-relaxed scrollbar-thin max-h-[500px]">
                          <code>
                            {renderHighlightedCode(
                              JSON.stringify(activeEndpoint.responses, null, 2),
                              "json",
                            )}
                          </code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <BookOpen size={40} className="text-brass/70 mb-4" />
                  <h3 className="text-lg font-bold">Select an API endpoint</h3>
                  <p className="text-light-text text-sm mt-2 max-w-xs">
                    Explore Scryme Ledger's endpoints from the navigation on the
                    left.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination Controls at Bottom */}
            <div className="mt-12 pt-5 border-t border-ink-border/60 flex items-center justify-between text-xs font-semibold text-light-text select-none">
              <button
                onClick={handlePrevPage}
                disabled={currentChronoIndex === 0}
                className="flex items-center gap-1.5 hover:bg-ink-card px-3 py-1.5 rounded-lg cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-paper"
              >
                <ArrowLeft size={13} />
                <span>Previous</span>
              </button>

              <div className="text-[10px] text-light-text/50 font-mono">
                {currentChronoIndex + 1} / {chronologicalList.length}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentChronoIndex === chronologicalList.length - 1}
                className="flex items-center gap-1.5 hover:bg-ink-card px-3 py-1.5 rounded-lg cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-paper"
              >
                <span>Next</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </section>

          {/* RIGHT COLUMN */}
          <section className="col-span-5 bg-[#080d17] p-6 lg:px-10 lg:py-12 overflow-y-auto space-y-7 sticky top-0 lg:h-[calc(100vh-56px)] flex flex-col justify-between border-t lg:border-t-0 border-ink-border">
            <div className="space-y-6 flex-1">
              {/* Target / Request Snippet Block */}
              <div className="space-y-0 rounded-xl overflow-hidden border border-ink-border shadow-lg shadow-black/20">
                {/* Snippet chrome / header bar */}
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-ink-card border-b border-ink-border">
                  <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.1em] font-bold text-light-text/70">
                    <Code size={12} className="text-brass" />
                    <span>Request</span>
                  </div>
                  <div className="bg-ink-bg rounded-md p-0.5 border border-ink-border flex gap-0.5">
                    {(["curl", "node", "python"] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setCodeLanguage(lang)}
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-1 rounded transition-colors cursor-pointer ${
                          codeLanguage === lang
                            ? "bg-brass text-ink-bg"
                            : "text-light-text hover:text-paper"
                        }`}
                      >
                        {lang === "curl"
                          ? "cURL"
                          : lang === "node"
                            ? "Node"
                            : "Python"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative group bg-ink-bg p-4 text-xs font-mono text-left">
                  {/* Copy Button */}
                  <button
                    onClick={() =>
                      handleCopy(codeSnippets[codeLanguage], "request")
                    }
                    className="absolute right-3 top-3 p-1.5 rounded-lg bg-ink-card text-light-text hover:text-paper border border-ink-border transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    {copiedMap["request"] ? (
                      <Check size={13} className="text-emerald-400" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>

                  <pre className="overflow-x-auto text-paper whitespace-pre leading-relaxed select-all scrollbar-thin max-h-96">
                    <code>
                      {renderHighlightedCode(
                        codeSnippets[codeLanguage],
                        codeLanguage,
                      )}
                    </code>
                  </pre>
                </div>
              </div>

              {/* Response Block (Only for non-guide/standard endpoints reference view) */}
              {activeEndpointId !== "installation-setup-guide" &&
                activeEndpointId !== "cms-customization-guide" &&
                activeEndpointId !== "v3-global-response-guide" &&
                activeEndpointId !== "workflow-automation-guide" &&
                activeDocTab === "reference" && (
                  <div className="space-y-0 rounded-xl overflow-hidden border border-ink-border shadow-lg shadow-black/20 animate-fade-in">
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-ink-card border-b border-ink-border">
                      <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.1em] font-bold text-light-text/70">
                        <Terminal size={12} className="text-brass" />
                        <span>Response</span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-mono font-bold uppercase tracking-wide px-2 py-0.5 rounded">
                        200 OK
                      </span>
                    </div>

                    <div className="relative group bg-ink-bg p-4 text-xs font-mono text-left">
                      <button
                        onClick={() =>
                          handleCopy(
                            JSON.stringify(mockResponsePayload, null, 2),
                            "response",
                          )
                        }
                        className="absolute right-3 top-3 p-1.5 rounded-lg bg-ink-card text-light-text hover:text-paper border border-ink-border transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        {copiedMap["response"] ? (
                          <Check size={13} className="text-emerald-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>

                      <pre className="overflow-x-auto text-emerald-300 whitespace-pre leading-relaxed scrollbar-thin max-h-[350px]">
                        <code>
                          {renderHighlightedCode(
                            JSON.stringify(mockResponsePayload, null, 2),
                            "json",
                          )}
                        </code>
                      </pre>
                    </div>
                  </div>
                )}
            </div>

            {/* Quick Helper Docs */}
            <div className="pt-6 border-t border-ink-border/60 hidden lg:block transition-colors duration-200">
              <div className="bg-ink-card/40 border border-ink-border/60 rounded-xl p-4 text-xs space-y-2 text-left">
                <div className="font-bold text-brass flex items-center gap-1.5">
                  <Fingerprint size={12} />
                  <span>Sandbox Credentials</span>
                </div>
                <p className="text-light-text leading-relaxed">
                  Use the <code className="text-paper">/v3/auth/token</code>{" "}
                  endpoint in sandbox mode to exchange client credentials. All
                  write operations require a valid organization scope.
                </p>
              </div>
            </div>
          </section>
        </main>
          </>
        )}
      </div>
    </div>
  );
}
