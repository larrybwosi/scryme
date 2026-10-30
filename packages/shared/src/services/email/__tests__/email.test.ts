import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendTwoFactorOTPEmail,
  sendOrganizationInvitationEmail,
  sendPaymentDueEmail,
  sendSubscriptionExpiredEmail,
} from "../index";

describe("Email Service Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should send email in mock mode when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await sendEmail({
      to: "user@realdomain.com",
      subject: "Test Subject",
      html: "<p>Test Content</p>",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.id).toContain("mock-email-id-");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should handle placeholder recipients gracefully without calling Resend API", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Test Subject",
      html: "<p>Test Content</p>",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.id).toContain("mock-placeholder-email-id-");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should construct verification email and call sendEmail", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await sendVerificationEmail({
      email: "test@realdomain.com",
      url: "https://app.scryme.tech/verify-email?token=xyz123",
      user: { name: "Alice" },
    });

    expect(result.success).toBe(true);
  });

  it("should construct password reset email and call sendEmail", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await sendPasswordResetEmail({
      email: "test@realdomain.com",
      url: "https://app.scryme.tech/reset-password?token=reset123",
      user: { name: "Bob" },
    });

    expect(result.success).toBe(true);
  });

  it("should construct 2FA OTP email and call sendEmail", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await sendTwoFactorOTPEmail({
      email: "test@realdomain.com",
      otp: "654321",
      user: { name: "Charlie" },
    });

    expect(result.success).toBe(true);
  });

  it("should construct organization invitation email and call sendEmail", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await sendOrganizationInvitationEmail({
      email: "test@realdomain.com",
      url: "https://app.scryme.tech/accept-invite?token=inv123",
      inviterName: "David",
      organizationName: "Acme Corp",
      role: "ADMIN",
    });

    expect(result.success).toBe(true);
  });

  it("should construct payment due email and call sendEmail", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await sendPaymentDueEmail({
      email: "billing@realdomain.com",
      userName: "Dave",
      organizationName: "Acme Corp",
      planName: "Scale Tier",
      dueDate: "2025-04-15",
      amount: 199.0,
      currency: "USD",
      actionUrl: "https://app.scryme.tech/settings/billing",
    });

    expect(result.success).toBe(true);
  });

  it("should construct subscription expired email and call sendEmail", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await sendSubscriptionExpiredEmail({
      email: "billing@realdomain.com",
      userName: "Eve",
      organizationName: "Beta LLC",
      planName: "Growth Tier",
      expirationDate: "2025-03-31",
      amount: "99.00",
      currency: "USD",
      actionUrl: "https://app.scryme.tech/settings/billing/renew",
    });

    expect(result.success).toBe(true);
  });
});
