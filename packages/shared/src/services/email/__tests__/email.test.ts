import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendTwoFactorOTPEmail,
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
      to: "user@example.com",
      subject: "Test Subject",
      html: "<p>Test Content</p>",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.id).toContain("mock-email-id-");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should construct verification email and call sendEmail", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await sendVerificationEmail({
      email: "test@example.com",
      url: "https://app.scryme.tech/verify-email?token=xyz123",
      user: { name: "Alice" },
    });

    expect(result.success).toBe(true);
  });

  it("should construct password reset email and call sendEmail", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await sendPasswordResetEmail({
      email: "test@example.com",
      url: "https://app.scryme.tech/reset-password?token=reset123",
      user: { name: "Bob" },
    });

    expect(result.success).toBe(true);
  });

  it("should construct 2FA OTP email and call sendEmail", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await sendTwoFactorOTPEmail({
      email: "test@example.com",
      otp: "654321",
      user: { name: "Charlie" },
    });

    expect(result.success).toBe(true);
  });
});
