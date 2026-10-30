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

export type EmailResult = { success: boolean; id?: string; error?: string };

/**
 * Checks if an email recipient uses a dummy/placeholder domain (e.g. example.com)
 * which Resend rejects with a 422 validation_error.
 */
function isPlaceholderRecipient(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const lower = email.trim().toLowerCase();
  const domain = lower.split("@")[1];
  if (!domain) return false;

  return (
    domain === "example.com" ||
    domain === "example.org" ||
    domain === "example.net" ||
    domain.endsWith(".example") ||
    lower.startsWith("test@example.")
  );
}

/**
 * Send email using Resend API with fallback log mode for development if API key is not configured
 * or if placeholder recipients (e.g. example.com) are specified.
 */
export async function sendEmail(payload: SendEmailPayload): Promise<EmailResult> {
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
  const validRecipients = recipients.filter((email) => email && typeof email === "string" && !isPlaceholderRecipient(email));
  const placeholderRecipients = recipients.filter((email) => email && typeof email === "string" && isPlaceholderRecipient(email));

  if (placeholderRecipients.length > 0) {
    console.warn(
      `[Email Service Placeholder] Skipping Resend API delivery for placeholder recipient(s): ${placeholderRecipients.join(", ")} | Subject: "${payload.subject}"`
    );
  }

  if (validRecipients.length === 0) {
    return { success: true, id: "mock-placeholder-email-id-" + Date.now() };
  }

  const resend = getResendClient();
  const from = payload.from || env.EMAIL_FROM || process.env.EMAIL_FROM || "Scryme <no-reply@scryme.tech>";

  if (!resend) {
    console.warn(
      `[Email Service Mock/Fallback] RESEND_API_KEY is missing. Mock email sent to: ${validRecipients.join(", ")} | Subject: "${payload.subject}"`
    );
    return { success: true, id: "mock-email-id-" + Date.now() };
  }

  try {
    const response = await resend.emails.send({
      from,
      to: validRecipients.length === 1 ? validRecipients[0] : validRecipients,
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
