import { sendEmail, EmailResult } from "../mailer";
import { BRAND, escapeHtml, heading, paragraph, button, fallbackLink, expiryNote, renderEmailLayout } from "../layout";

export interface SendVerificationEmailParams {
  email: string;
  url: string;
  user?: { name?: string | null };
}

/**
 * Send email verification link to user
 */
export async function sendVerificationEmail(params: SendVerificationEmailParams): Promise<EmailResult> {
  const { email, url, user } = params;
  const name = user?.name || "there";

  const bodyContent = [
    heading("Verify your email address"),
    paragraph(`Hi ${escapeHtml(name)}, welcome to ${BRAND.name}! Confirm your email address to activate your account and get started.`),
    button("Verify Email Address", url),
    fallbackLink(url),
    expiryNote("This verification link expires in 24 hours."),
  ].join("\n");

  return sendEmail({
    to: email,
    subject: `Verify your email address - ${BRAND.name}`,
    html: renderEmailLayout({
      title: "Verify your email address",
      preheader: `Confirm your email to activate your ${BRAND.name} account.`,
      bodyContent,
    }),
    text: `Hi ${name},\n\nWelcome to ${BRAND.name}! Please verify your email address by opening the following link:\n${url}\n\nThis link will expire in 24 hours.\n\n- The ${BRAND.name} Team`,
  });
}
