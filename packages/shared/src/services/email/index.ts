import { Resend } from "resend";
import { env } from "@repo/env";

let resendInstance: Resend | null = null;

function getResendClient(): Resend | null {
  if (resendInstance) return resendInstance;
  const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  resendInstance = new Resend(apiKey);
  return resendInstance;
}

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/**
 * Send email using Resend API with fallback log mode for development if API key is not configured.
 */
export async function sendEmail(payload: SendEmailPayload): Promise<{ success: boolean; id?: string; error?: string }> {
  const resend = getResendClient();
  const from = payload.from || env.EMAIL_FROM || process.env.EMAIL_FROM || "Scryme <no-reply@scryme.tech>";

  if (!resend) {
    console.warn(
      `[Email Service Mock/Fallback] RESEND_API_KEY is missing. Mock email sent to: ${Array.isArray(payload.to) ? payload.to.join(", ") : payload.to} | Subject: "${payload.subject}"`
    );
    return { success: true, id: "mock-email-id-" + Date.now() };
  }

  try {
    const response = await resend.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    if (response.error) {
      console.error("[Email Service] Resend API error:", response.error);
      return { success: false, error: response.error.message };
    }

    return { success: true, id: response.data?.id };
  } catch (error: any) {
    console.error("[Email Service] Failed to send email via Resend:", error);
    return { success: false, error: error?.message || "Unknown email delivery error" };
  }
}

/**
 * Email template layout helper
 */
function renderEmailLayout(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e5e7eb;">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Scryme</h1>
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 13px; color: #64748b;">
              <p style="margin: 0;">This email was sent by Scryme platform. If you didn't request this, you can safely ignore this message.</p>
              <p style="margin: 8px 0 0 0;">&copy; ${new Date().getFullYear()} Scryme. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send email verification link to user
 */
export async function sendVerificationEmail(params: {
  email: string;
  url: string;
  user?: { name?: string | null };
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const { email, url, user } = params;
  const name = user?.name || "there";

  const bodyContent = `
    <h2 style="font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #0f172a;">Verify your email address</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
      Hi ${name}, welcome to Scryme! Please confirm your email address by clicking the button below:
    </p>
    <div style="text-align: center; margin-bottom: 28px;">
      <a href="${url}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
        Verify Email Address
      </a>
    </div>
    <p style="font-size: 14px; line-height: 1.5; color: #64748b; margin-bottom: 12px;">
      If the button above doesn't work, copy and paste this link into your web browser:
    </p>
    <p style="font-size: 13px; word-break: break-all; color: #2563eb; background-color: #f1f5f9; padding: 10px 14px; border-radius: 6px; margin-bottom: 24px;">
      ${url}
    </p>
    <p style="font-size: 13px; color: #94a3b8; margin: 0;">
      This verification link will expire in 24 hours.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: "Verify your email address - Scryme",
    html: renderEmailLayout("Verify Email Address", bodyContent),
    text: `Hi ${name},\n\nPlease verify your email address by opening the following link:\n${url}\n\nThis link will expire in 24 hours.\n\n- The Scryme Team`,
  });
}

/**
 * Send password reset email to user
 */
export async function sendPasswordResetEmail(params: {
  email: string;
  url: string;
  user?: { name?: string | null };
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const { email, url, user } = params;
  const name = user?.name || "there";

  const bodyContent = `
    <h2 style="font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #0f172a;">Reset your password</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
      Hi ${name}, we received a request to reset your password for your Scryme account. Click the button below to set a new password:
    </p>
    <div style="text-align: center; margin-bottom: 28px;">
      <a href="${url}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
        Reset Password
      </a>
    </div>
    <p style="font-size: 14px; line-height: 1.5; color: #64748b; margin-bottom: 12px;">
      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
    <p style="font-size: 13px; word-break: break-all; color: #2563eb; background-color: #f1f5f9; padding: 10px 14px; border-radius: 6px; margin-bottom: 24px;">
      ${url}
    </p>
    <p style="font-size: 13px; color: #94a3b8; margin: 0;">
      This password reset link will expire in 1 hour.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: "Reset your password - Scryme",
    html: renderEmailLayout("Reset Password", bodyContent),
    text: `Hi ${name},\n\nWe received a request to reset your password. You can reset it using the following link:\n${url}\n\nIf you didn't request this, please ignore this email.\n\n- The Scryme Team`,
  });
}

/**
 * Send 2FA / One-Time Password (OTP) code via email
 */
export async function sendTwoFactorOTPEmail(params: {
  email: string;
  otp: string;
  user?: { name?: string | null };
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const { email, otp, user } = params;
  const name = user?.name || "there";

  const bodyContent = `
    <h2 style="font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #0f172a;">Your Two-Factor Authentication Code</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
      Hi ${name}, use the verification code below to complete your sign-in process:
    </p>
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="display: inline-block; background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 16px 36px;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f172a;">${otp}</span>
      </div>
    </div>
    <p style="font-size: 14px; line-height: 1.5; color: #64748b; margin-bottom: 12px;">
      Never share this code with anyone. Scryme employees will never ask for your 2FA code.
    </p>
    <p style="font-size: 13px; color: #94a3b8; margin: 0;">
      This code is valid for 10 minutes.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `Your Scryme verification code: ${otp}`,
    html: renderEmailLayout("Two-Factor Authentication Code", bodyContent),
    text: `Hi ${name},\n\nYour Scryme 2FA verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\n- The Scryme Team`,
  });
}
