import { normalizeOpenPanelUrl } from "@repo/env";
import React, { useEffect } from "react";
import { OpenPanel } from "@openpanel/web";
import {
  trackOpenObserveEvent,
  setOpenObserveUserContext,
  clearOpenObserveUserContext,
} from "./openobserve";

/**
 * Standardized POS event names for OpenPanel & OpenObserve tracking.
 * Designed to give full visibility into feature adoption, usage, and user behavior.
 */
export const POS_EVENTS = {
  // Adoption & Device Setup
  DEVICE_PROVISIONED: "pos_device_provisioned",
  DEVICE_SETUP_COMPLETED: "pos_device_setup_completed",
  DEVICE_RESET: "pos_device_reset",
  LOCATION_SWITCHED: "pos_location_switched",
  APP_STARTED: "pos_app_started",

  // Authentication & Staff Sessions
  STAFF_CHECKIN: "pos_staff_checkin",
  STAFF_CHECKOUT: "pos_staff_checkout",
  STAFF_SWITCHED: "pos_staff_switched",
  SHIFT_STARTED: "pos_shift_started",
  SHIFT_ENDED: "pos_shift_ended",

  // Core Sales & Checkout Flow
  CART_ITEM_ADDED: "pos_cart_item_added",
  CART_ITEM_REMOVED: "pos_cart_item_removed",
  CART_ITEM_QTY_UPDATED: "pos_cart_item_qty_updated",
  CART_PRICE_OVERRIDDEN: "pos_cart_price_overridden",
  CART_DISCOUNT_APPLIED: "pos_cart_discount_applied",
  CART_CLEARED: "pos_cart_cleared",
  ORDER_HELD: "pos_order_held",
  HELD_ORDER_RESTORED: "pos_held_order_restored",
  SALE_COMPLETED: "pos_sale_completed",
  SALE_FAILED: "pos_sale_failed",
  OFFLINE_SALE_QUEUED: "pos_offline_sale_queued",
  PAYMENT_INITIATED: "pos_payment_initiated",
  PAYMENT_METHOD_CHANGED: "pos_payment_method_changed",
  MPESA_STK_REQUESTED: "pos_mpesa_stk_requested",
  MPESA_STK_SUCCESS: "pos_mpesa_stk_success",
  MPESA_STK_FAILED: "pos_mpesa_stk_failed",

  // Refunds & Voids
  REFUND_INITIATED: "pos_refund_initiated",
  REFUND_COMPLETED: "pos_refund_completed",
  REFUND_FAILED: "pos_refund_failed",

  // Receipts & Printing
  RECEIPT_PRINTED: "pos_receipt_printed",
  RECEIPT_DOWNLOADED: "pos_receipt_downloaded",
  RECEIPT_EMAILED: "pos_receipt_emailed",
  KITCHEN_TICKET_PRINTED: "pos_kitchen_ticket_printed",

  // Feature Adoption: Pharmacy
  PRESCRIPTION_LOGGED: "pos_prescription_logged",
  PRESCRIPTION_VERIFIED: "pos_prescription_verified",
  PRESCRIPTION_DISPENSED: "pos_prescription_dispensed",
  PRESCRIPTION_LABEL_PRINTED: "pos_prescription_label_printed",

  // Feature Adoption: Restaurant / Hospitality
  TABLE_SELECTED: "pos_table_selected",
  TABLE_MOVED: "pos_table_moved",
  KDS_STATUS_UPDATED: "pos_kds_status_updated",

  // Feature Adoption: Supermarket & Barcodes
  SUPERMARKET_MODE_USED: "pos_supermarket_mode_used",
  SCANNER_USED: "pos_scanner_used",
  SCANNER_ERROR: "pos_scanner_error",
  BARCODE_PRINTED: "pos_barcode_printed",

  // Stock & Inventory Management
  STOCK_DELIVERY_RECEIVED: "pos_stock_delivery_received",
  STOCK_TRANSFER_CREATED: "pos_stock_transfer_created",
  STOCK_REQUEST_CREATED: "pos_stock_request_created",

  // Customers
  CUSTOMER_CREATED: "pos_customer_created",
  CUSTOMER_SELECTED: "pos_customer_selected",
  CUSTOMER_UPDATED: "pos_customer_updated",
  CUSTOMER_CLEARED: "pos_customer_cleared",
  CUSTOMER_SEARCHED: "pos_customer_searched",

  // Cash & Petty Cash Management
  PETTY_CASH_LOGGED: "pos_petty_cash_logged",
  CASH_DRAWER_OPENED: "pos_cash_drawer_opened",
  CASH_FLOAT_ADDED: "pos_cash_float_added",
  CASH_PAYOUT_LOGGED: "pos_cash_payout_logged",

  // Offline, Hardware & Sync Engine
  SYNC_COMPLETED: "pos_sync_completed",
  SYNC_FAILED: "pos_sync_failed",
  PENDING_TRANSACTION_DISPATCHED: "pos_pending_transaction_dispatched",
  NETWORK_STATUS_CHANGED: "pos_network_status_changed",
  PRINTER_ERROR: "pos_printer_error",
} as const;

export type PosEventName = (typeof POS_EVENTS)[keyof typeof POS_EVENTS] | string;

let openPanelInstance: OpenPanel | null = null;

export function resetOpenPanelInstanceForTesting() {
  openPanelInstance = null;
}

export function getOpenPanelInstance(): OpenPanel | null {
  if (typeof window === "undefined") return null;

  const envClientId = typeof process !== "undefined" ? process.env?.VITE_OPENPANEL_CLIENT_ID : undefined;
  const clientId = envClientId !== undefined ? envClientId : import.meta.env.VITE_OPENPANEL_CLIENT_ID;
  if (
    !clientId ||
    clientId.includes("PLACEHOLDER") ||
    clientId === "your-openpanel-client-id"
  ) {
    return null;
  }

  const envHost = typeof process !== "undefined" ? process.env?.VITE_OPENPANEL_HOST : undefined;
  const host = envHost !== undefined ? envHost : import.meta.env.VITE_OPENPANEL_HOST;
  const apiUrl = normalizeOpenPanelUrl(host);

  if (!openPanelInstance) {
    try {
      openPanelInstance = new OpenPanel({
        clientId,
        apiUrl,
        trackScreenViews: true,
        trackAttributes: true,
        trackOutgoingLinks: true,
      });
    } catch {
      return null;
    }
  }

  return openPanelInstance;
}

export function OpenPanelProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    getOpenPanelInstance();
  }, []);

  return <>{children}</>;
}

/**
 * Safely track an analytics event in the POS application across both OpenPanel and OpenObserve.
 */
export function trackPosEvent(event: PosEventName, properties?: Record<string, unknown>) {
  // Always send event to OpenObserve telemetry client
  try {
    trackOpenObserveEvent(event, properties);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[OpenObserve] Tracking error:", event, err);
    }
  }

  // Send event to OpenPanel
  const op = getOpenPanelInstance();
  if (op) {
    try {
      op.track(event, properties);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("[OpenPanel] Tracking error:", event, err);
      }
    }
  }
}

/**
 * Identify the active user or staff session in OpenPanel and OpenObserve.
 */
export function identifyPosUser(profile: { profileId: string; [key: string]: unknown }) {
  try {
    setOpenObserveUserContext(profile);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[OpenObserve] Set user context error:", err);
    }
  }

  const op = getOpenPanelInstance();
  if (op && profile?.profileId) {
    try {
      op.identify(profile);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("[OpenPanel] Identify error:", err);
      }
    }
  }
}

/**
 * Clear the current user identity on checkout or session reset.
 */
export function clearPosUser() {
  try {
    clearOpenObserveUserContext();
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[OpenObserve] Clear user error:", err);
    }
  }

  const op = getOpenPanelInstance();
  if (op) {
    try {
      if (typeof op.clear === "function") {
        op.clear();
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("[OpenPanel] Clear user error:", err);
      }
    }
  }
}

/**
 * Set global context properties (e.g. location, business mode) attached to subsequent events.
 */
export function setPosGlobalProperties(properties: Record<string, unknown>) {
  try {
    setOpenObserveUserContext(properties);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[OpenObserve] Set global properties error:", err);
    }
  }

  const op = getOpenPanelInstance();
  if (op) {
    try {
      if (typeof op.setGlobalProperties === "function") {
        op.setGlobalProperties(properties);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("[OpenPanel] Set global properties error:", err);
      }
    }
  }
}
