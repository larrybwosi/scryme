import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CRM_EVENTS,
  trackCrmEvent,
  identifyCrmUser,
  clearCrmUser,
} from "../openpanel";

describe("OpenPanel CRM Analytics Utilities", () => {
  const originalWindow = global.window;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it("should have pre-defined CRM event constants", () => {
    expect(CRM_EVENTS.LOGIN_SUCCESS).toBe("crm_login_success");
    expect(CRM_EVENTS.LOGIN_FAILED).toBe("crm_login_failed");
    expect(CRM_EVENTS.CUSTOMER_CREATED).toBe("crm_customer_created");
    expect(CRM_EVENTS.DEAL_STAGE_CHANGED).toBe("crm_deal_stage_changed");
    expect(CRM_EVENTS.ACTION_FAILED).toBe("crm_action_failed");
  });

  it("should call window.op with track event when window.op is present", () => {
    const mockOp = vi.fn();
    (global as any).window = { op: mockOp };

    trackCrmEvent(CRM_EVENTS.LOGIN_SUCCESS, { method: "email" });

    expect(mockOp).toHaveBeenCalledWith("track", {
      name: "crm_login_success",
      method: "email",
    });
  });

  it("should call window.op with identify when window.op is present", () => {
    const mockOp = vi.fn();
    (global as any).window = { op: mockOp };

    identifyCrmUser({
      profileId: "user_123",
      email: "test@example.com",
      name: "Test User",
      role: "OWNER",
    });

    expect(mockOp).toHaveBeenCalledWith("identify", {
      profileId: "user_123",
      email: "test@example.com",
      name: "Test User",
      role: "OWNER",
    });
  });

  it("should call window.op with clear when clearing user", () => {
    const mockOp = vi.fn();
    (global as any).window = { op: mockOp };

    clearCrmUser();

    expect(mockOp).toHaveBeenCalledWith("clear");
  });

  it("should gracefully handle undefined window environment without crashing", () => {
    // @ts-ignore
    delete (global as any).window;

    expect(() => {
      trackCrmEvent(CRM_EVENTS.CUSTOMER_CREATED, { id: "123" });
      identifyCrmUser({ profileId: "user_123" });
      clearCrmUser();
    }).not.toThrow();
  });
});
