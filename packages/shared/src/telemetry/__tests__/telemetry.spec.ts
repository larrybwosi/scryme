import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  maskEmail,
  maskPhone,
  maskSensitiveData,
  isSensitiveKey,
} from "../sanitizer";
import {
  OpenObserveClient,
  TelemetryEvent,
} from "../openobserve";
import {
  setTelemetryContext,
  getTelemetryContext,
  clearTelemetryContext,
  trackTelemetryEvent,
  trackTelemetryError,
  trackTelemetryPerformance,
  TELEMETRY_EVENTS,
  defaultOpenObserveClient,
} from "../index";

describe("Telemetry Sanitizer (PII and Sensitive Data Masking)", () => {
  it("masks emails correctly preserving domain", () => {
    expect(maskEmail("john.doe@company.com")).toBe("j***@company.com");
    expect(maskEmail("a@b.com")).toBe("***@b.com");
  });

  it("masks phone numbers correctly", () => {
    expect(maskPhone("+254712345678")).toBe("+254***678");
    expect(maskPhone("0712345678")).toBe("071***678");
    expect(maskPhone("123")).toBe("[MASKED_PHONE]");
  });

  it("identifies sensitive keys", () => {
    expect(isSensitiveKey("password")).toBe(true);
    expect(isSensitiveKey("authToken")).toBe(true);
    expect(isSensitiveKey("apiKey")).toBe(true);
    expect(isSensitiveKey("mpesa_password")).toBe(true);
    expect(isSensitiveKey("orderId")).toBe(false);
  });

  it("recursively sanitizes complex nested telemetry objects", () => {
    const rawPayload = {
      user: {
        email: "alice@enterprise.org",
        phoneNumber: "+15551234567",
        secretToken: "sk_live_9999999",
      },
      transaction: {
        amount: 2500,
        currency: "USD",
        cardNumber: "4111 2222 3333 4444",
      },
      metadata: [
        { contactEmail: "bob@test.com", role: "admin" },
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThis",
      ],
    };

    const sanitized: any = maskSensitiveData(rawPayload);

    expect(sanitized.user.email).toBe("a***@enterprise.org");
    expect(sanitized.user.phoneNumber).toBe("+155***567");
    expect(sanitized.user.secretToken).toBe("[MASKED_SECRET]");
    expect(sanitized.transaction.amount).toBe(2500);
    expect(sanitized.transaction.currency).toBe("USD");
    expect(sanitized.transaction.cardNumber).toBe("[MASKED_CARD]");
    expect(sanitized.metadata[0].contactEmail).toBe("b***@test.com");
    expect(sanitized.metadata[0].role).toBe("admin");
    expect(sanitized.metadata[1]).toBe("[MASKED_TOKEN]");
  });
});

describe("OpenObserveClient", () => {
  let client: OpenObserveClient;
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    client = new OpenObserveClient({
      url: "https://observe.scryme.internal",
      organization: "acme-tenant",
      stream: "audit-events",
      authToken: "Basic secret123",
      service: "test-service",
      environment: "test",
      batchSize: 2,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    client.clearQueueForTesting();
  });

  it("queues and flushes events when batch threshold is met", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

    client.track("custom_action", { detail: "alpha" });
    expect(client.getQueue().length).toBe(1);

    client.track("custom_action", { detail: "beta" });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://observe.scryme.internal/api/acme-tenant/audit-events/_json",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic secret123",
        },
      })
    );
  });

  it("attaches tenant context and organizationId to queued events", () => {
    client.setUserContext({ organizationId: "org_enterprise_1", userId: "usr_42" });
    client.track("tenant_operation", { action: "sync" });

    const queue = client.getQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].organizationId).toBe("org_enterprise_1");
    expect(queue[0].tenantId).toBe("org_enterprise_1");
    expect(queue[0].userContext?.userId).toBe("usr_42");
  });
});

describe("Enterprise Dual Telemetry Interface", () => {
  beforeEach(() => {
    clearTelemetryContext();
    defaultOpenObserveClient.clearQueueForTesting();
  });

  it("sets and retrieves global telemetry context", () => {
    setTelemetryContext({
      organizationId: "org_999",
      userId: "usr_test",
      userEmail: "support@scryme.tech",
      role: "SUPERADMIN",
    });

    const ctx = getTelemetryContext();
    expect(ctx.organizationId).toBe("org_999");
    expect(ctx.userId).toBe("usr_test");
    expect(ctx.userEmail).toBe("s***@scryme.tech");
    expect(ctx.role).toBe("SUPERADMIN");
  });

  it("tracks telemetry errors and formats stack diagnostics", () => {
    const error = new Error("Database timeout connection drop");
    trackTelemetryError(error, { queryName: "fetchOrders" });

    const queue = defaultOpenObserveClient.getQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].event).toBe(TELEMETRY_EVENTS.CLIENT_ERROR);
    expect(queue[0].errorMessage).toBe("Database timeout connection drop");
    expect(queue[0].queryName).toBe("fetchOrders");
  });

  it("tracks performance metrics with duration", () => {
    trackTelemetryPerformance("page_load_fcp", 350, { path: "/dashboard" });

    const queue = defaultOpenObserveClient.getQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].event).toBe(TELEMETRY_EVENTS.PERFORMANCE_METRIC);
    expect(queue[0].metricName).toBe("page_load_fcp");
    expect(queue[0].durationMs).toBe(350);
    expect(queue[0].path).toBe("/dashboard");
  });

  it("dispatches to window.op OpenPanel hook if present", () => {
    const mockOp = vi.fn();
    (global as any).window = { op: mockOp };

    trackTelemetryEvent("checkout_completed", { amount: 1500 });

    expect(mockOp).toHaveBeenCalledWith("track", expect.objectContaining({
      name: "checkout_completed",
      amount: 1500,
    }));

    delete (global as any).window;
  });
});
