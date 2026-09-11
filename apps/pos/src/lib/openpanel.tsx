import React, { useEffect } from "react";
import { OpenPanel } from "@openpanel/web";

/**
 * Standardized POS event names for OpenPanel tracking.
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
  CART_DISCOUNT_APPLIED: "pos_cart_discount_applied",
  CART_CLEARED: "pos_cart_cleared",
  ORDER_HELD: "pos_order_held",
  HELD_ORDER_RESTORED: "pos_held_order_restored",
  SALE_COMPLETED: "pos_sale_completed",
  SALE_FAILED: "pos_sale_failed",
  OFFLINE_SALE_QUEUED: "pos_offline_sale_queued",
  PAYMENT_INITIATED: "pos_payment_initiated",
  MPESA_STK_REQUESTED: "pos_mpesa_stk_requested",
  MPESA_STK_SUCCESS: "pos_mpesa_stk_success",
  MPESA_STK_FAILED: "pos_mpesa_stk_failed",

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
  BARCODE_PRINTED: "pos_barcode_printed",

  // Stock & Inventory Management
  STOCK_DELIVERY_RECEIVED: "pos_stock_delivery_received",
  STOCK_TRANSFER_CREATED: "pos_stock_transfer_created",
  STOCK_REQUEST_CREATED: "pos_stock_request_created",

  // Customers
  CUSTOMER_CREATED: "pos_customer_created",
  CUSTOMER_SELECTED: "pos_customer_selected",
  CUSTOMER_UPDATED: "pos_customer_updated",

  // Cash & Petty Cash Management
  PETTY_CASH_LOGGED: "pos_petty_cash_logged",
  CASH_DRAWER_OPENED: "pos_cash_drawer_opened",

  // Offline & Sync Engine
  SYNC_COMPLETED: "pos_sync_completed",
  SYNC_FAILED: "pos_sync_failed",
  PENDING_TRANSACTION_DISPATCHED: "pos_pending_transaction_dispatched",
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
  const apiUrl =
    host && !host.includes("PLACEHOLDER")
      ? host
      : undefined;

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
 * Safely track an analytics event in the POS application.
 */
export function trackPosEvent(event: PosEventName, properties?: Record<string, unknown>) {
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
 * Identify the active user or staff session in OpenPanel.
 */
export function identifyPosUser(profile: { profileId: string; [key: string]: unknown }) {
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
