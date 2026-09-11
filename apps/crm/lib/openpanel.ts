import { useOpenPanel } from "@openpanel/nextjs";

/**
 * Standardized CRM event names for OpenPanel tracking
 */
export const CRM_EVENTS = {
  // Auth & Session
  LOGIN_SUCCESS: "crm_login_success",
  LOGIN_FAILED: "crm_login_failed",
  SIGNUP_SUCCESS: "crm_signup_success",
  SIGNUP_FAILED: "crm_signup_failed",
  PASSKEY_LOGIN_INITIATED: "crm_passkey_login_initiated",
  PASSKEY_LOGIN_FAILED: "crm_passkey_login_failed",
  PASSWORD_RESET_REQUESTED: "crm_password_reset_requested",
  PASSWORD_RESET_FAILED: "crm_password_reset_failed",
  SIGN_OUT: "crm_sign_out",

  // Customers & Leads
  CUSTOMER_CREATED: "crm_customer_created",
  CUSTOMER_UPDATED: "crm_customer_updated",
  CUSTOMER_DELETED: "crm_customer_deleted",
  CUSTOMER_SEARCH_FILTERED: "crm_customer_search_filtered",
  CUSTOMER_TAB_CHANGED: "crm_customer_tab_changed",
  LEAD_CREATED: "crm_lead_created",
  LEAD_UPDATED: "crm_lead_updated",
  LEAD_DELETED: "crm_lead_deleted",
  LEAD_STATUS_CHANGED: "crm_lead_status_changed",
  LEAD_CONVERTED_TO_CUSTOMER: "crm_lead_converted_to_customer",
  LEAD_SEARCH_FILTERED: "crm_lead_search_filtered",

  // Pipeline, Deals, Contacts & Companies
  DEAL_CREATED: "crm_deal_created",
  DEAL_STAGE_CHANGED: "crm_deal_stage_changed",
  DEAL_WON: "crm_deal_won",
  DEAL_LOST: "crm_deal_lost",
  DEAL_DELETED: "crm_deal_deleted",
  DEAL_SEARCH_FILTERED: "crm_deal_search_filtered",
  CONTACT_CREATED: "crm_contact_created",
  CONTACT_UPDATED: "crm_contact_updated",
  CONTACT_DELETED: "crm_contact_deleted",
  CONTACT_SEARCHED: "crm_contact_searched",
  COMPANY_CREATED: "crm_company_created",
  COMPANY_UPDATED: "crm_company_updated",
  COMPANY_DELETED: "crm_company_deleted",
  COMPANY_SEARCHED: "crm_company_searched",

  // Activities, Notes & Follow-ups
  ACTIVITY_LOGGED: "crm_activity_logged",
  ACTIVITY_STATUS_CHANGED: "crm_activity_status_changed",
  NOTE_CREATED: "crm_note_created",
  NOTE_DELETED: "crm_note_deleted",
  FOLLOWUP_CREATED: "crm_followup_created",
  FOLLOWUP_COMPLETED: "crm_followup_completed",

  // Campaigns & Workflows
  CAMPAIGN_CREATED: "crm_campaign_created",
  CAMPAIGN_STATUS_CHANGED: "crm_campaign_status_changed",
  WORKFLOW_CREATED: "crm_workflow_created",
  SEGMENT_CREATED: "crm_segment_created",

  // Analytics, Views & Pain Points
  DASHBOARD_VIEWED: "crm_dashboard_viewed",
  REPORT_VIEWED: "crm_report_viewed",
  REPORT_EXPORTED: "crm_report_exported",
  REPORT_FILTER_CHANGED: "crm_report_filter_changed",
  ACTION_FAILED: "crm_action_failed",
  FORM_VALIDATION_FAILED: "crm_form_validation_failed",
} as const;

export type CrmEventName = (typeof CRM_EVENTS)[keyof typeof CRM_EVENTS] | string;

/**
 * Safe client-side track helper that uses window.op or OpenPanel hook.
 */
export function trackCrmEvent(event: CrmEventName, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  try {
    if (typeof (window as any).op === "function") {
      (window as any).op("track", { name: event, ...properties });
    }
  } catch (err) {
    console.warn("[OpenPanel] Failed to track event:", event, err);
  }
}

/**
 * Identify a user in OpenPanel on the client.
 */
export function identifyCrmUser(profile: {
  profileId: string;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
}) {
  if (typeof window === "undefined") return;

  try {
    if (typeof (window as any).op === "function") {
      (window as any).op("identify", profile);
    }
  } catch (err) {
    console.warn("[OpenPanel] Failed to identify user:", err);
  }
}

/**
 * Clear identified user session in OpenPanel.
 */
export function clearCrmUser() {
  if (typeof window === "undefined") return;

  try {
    if (typeof (window as any).op === "function") {
      (window as any).op("clear");
    }
  } catch (err) {
    console.warn("[OpenPanel] Failed to clear user:", err);
  }
}

/**
 * React hook wrapper for tracking inside client components.
 */
export function useOpenPanelTrack() {
  const op = useOpenPanel();

  return {
    track: (event: CrmEventName, properties?: Record<string, unknown>) => {
      try {
        if (op && typeof op.track === "function") {
          op.track(event, properties);
        } else {
          trackCrmEvent(event, properties);
        }
      } catch {
        trackCrmEvent(event, properties);
      }
    },
    identify: (profile: { profileId: string; [key: string]: unknown }) => {
      try {
        if (op && typeof op.identify === "function") {
          op.identify(profile);
        } else {
          identifyCrmUser(profile);
        }
      } catch {
        identifyCrmUser(profile);
      }
    },
  };
}
