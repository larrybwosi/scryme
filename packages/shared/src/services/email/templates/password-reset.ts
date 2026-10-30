import { sendEmail, EmailResult } from "../mailer";
import { BRAND, escapeHtml, heading, paragraph, button, fallbackLink, callout, expiryNote, renderEmailLayout } from "../layout";

export interface SendPasswordResetEmailParams {
  email: string;
  url: string;
  user?: { name?: string | null };
}

/**
 * Send password reset email to user
 */
export async function sendPasswordResetEmail(params: SendPasswordResetEmailParams): Promise<EmailResult> {
  const { email, url, user } = params;
  const name = user?.name || "there";

  const bodyContent = [
    heading("Reset your password"),
    paragraph(`Hi ${escapeHtml(name)}, we received a request to reset the password for your ${BRAND.name} account. Click the button below to choose a new one.`),
    button("Reset Password", url),
    fallbackLink(url),
    callout(
      `<strong>Didn't request this?</strong> You can safely ignore this email &mdash; your password will not change. If you're concerned about your account's security, consider updating your password once you sign in.`
    ),
    expiryNote("This password reset link expires in 1 hour."),
  ].join("\n");

  return sendEmail({
    to: email,
    subject: `Reset your password - ${BRAND.name}`,
    html: renderEmailLayout({
      title: "Reset your password",
      preheader: "Use this link to choose a new password. It expires in 1 hour.",
      bodyContent,
    }),
    text: `Hi ${name},\n\nWe received a request to reset your password. You can set a new one using the following link:\n${url}\n\nThis link will expire in 1 hour. If you didn't request this, you can safely ignore this email and your password will remain unchanged.\n\n- The ${BRAND.name} Team`,
  });
}
